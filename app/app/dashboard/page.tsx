"use client";

import React, { useEffect, useMemo, useState } from "react";

type Org = { id: string; name: string; createdAt?: string };
type Team = { id: string; name: string; organizationId: string; createdAt?: string };

type AgentRow = {
  id: string;
  name: string;
  email?: string | null;
  createdAt?: string;
  team?: { id: string; name: string; organization?: { id: string; name: string } } | null;
  conversationsCount?: number;
  scoresCount?: number;
};

type Score = {
  createdAt: string;
  windowSize: number;
  overallScore: number;
  communicationScore: number;
  conversionScore: number;
  riskScore: number;
  coachingPriority: number;
};

type BatchCreateResponse = { ok: boolean; jobId: string; total?: number; status?: string };
type BatchStatusResponse = {
  ok: boolean;
  job: {
    id: string;
    scope: string;
    refId: string;
    windowSize: number;
    status: string;
    percent: number;
    total: number;
    progress: number;
    error?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  counts: { queued: number; running: number; done: number; failed: number; total: number };
  lastFailed: Array<{
    agentId: string;
    agentName?: string | null;
    teamName?: string | null;
    orgName?: string | null;
    error?: string | null;
    at: string;
  }>;
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function fmtNum(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(1) : "—";
}

function clip(s: string, max = 120) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { ok: true, json: JSON.parse(text), text };
  } catch {
    return { ok: false, json: null, text };
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isJobFinished(st: BatchStatusResponse | null) {
  if (!st?.job) return false;
  const status = String(st.job.status ?? "").toLowerCase();
  const pct = Number(st.job.percent ?? 0);
  const queued = Number(st.counts?.queued ?? 0);
  const running = Number(st.counts?.running ?? 0);
  return status === "done" || pct >= 100 || (queued === 0 && running === 0);
}

export default function DashboardPage() {
  // scope (org/team) selector
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // agents + scores
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [agentScores, setAgentScores] = useState<Record<string, Score | null>>({});

  // batch controls
  const [scopeType, setScopeType] = useState<"team" | "org">("team");
  const [windowSize, setWindowSize] = useState<number>(30);

  const [jobId, setJobId] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<BatchStatusResponse | null>(null);

  // ui messages
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingScope, setLoadingScope] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [runningJob, setRunningJob] = useState(false);
  const [justFinished, setJustFinished] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const activeRefId = useMemo(() => {
    if (scopeType === "org") return selectedOrgId || "";
    return selectedTeamId || "";
  }, [scopeType, selectedOrgId, selectedTeamId]);

  const totals = useMemo(() => {
    const conversations = agents.reduce((acc, a) => acc + (a.conversationsCount ?? 0), 0);
    const scoreSnapshots = agents.reduce((acc, a) => acc + (a.scoresCount ?? 0), 0);
    return { agents: agents.length, conversations, scoreSnapshots };
  }, [agents]);

  async function loadScope() {
    setLoadingScope(true);
    setErr(null);
    setInfo(null);

    try {
      const orgRes = await fetch("/api/meta/orgs", { cache: "no-store" });
      const orgParsed = await safeJson(orgRes);
      if (!orgRes.ok || !orgParsed.ok || !orgParsed.json?.ok) {
        throw new Error(orgParsed.text || "Failed to load orgs");
      }
      const orgsList: Org[] = orgParsed.json.orgs ?? [];
      setOrgs(orgsList);

      let orgId = selectedOrgId;
      if (!orgId || !orgsList.some((o) => o.id === orgId)) orgId = orgsList[0]?.id ?? "";
      setSelectedOrgId(orgId);

      if (orgId) {
        const teamRes = await fetch(`/api/meta/teams?orgId=${encodeURIComponent(orgId)}`, { cache: "no-store" });
        const teamParsed = await safeJson(teamRes);
        if (!teamRes.ok || !teamParsed.ok || !teamParsed.json?.ok) {
          throw new Error(teamParsed.text || "Failed to load teams");
        }
        const teamsList: Team[] = teamParsed.json.teams ?? [];
        setTeams(teamsList);

        let teamId = selectedTeamId;
        if (!teamId || !teamsList.some((t) => t.id === teamId)) teamId = teamsList[0]?.id ?? "";
        setSelectedTeamId(teamId);
      } else {
        setTeams([]);
        setSelectedTeamId("");
      }

      setInfo("Scope loaded.");
    } catch (e: any) {
      setErr(e?.message || "Failed to load scope");
    } finally {
      setLoadingScope(false);
    }
  }

  async function loadAgentsAndScores() {
    setLoadingMeta(true);
    setErr(null);
    setInfo(null);

    try {
      const res = await fetch("/api/meta/agents", { cache: "no-store" });
      const parsed = await safeJson(res);
      if (!res.ok || !parsed.ok || !parsed.json?.ok) {
        throw new Error(parsed.text || "Failed to load agents");
      }
      const list: AgentRow[] = parsed.json.agents ?? [];
      setAgents(list);

      const limit = 6;
      const queue = [...list];
      const scores: Record<string, Score | null> = {};

      async function worker() {
        while (queue.length) {
          const a = queue.shift();
          if (!a) break;
          try {
            const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(a.id)}`, { cache: "no-store" });
            const p = await safeJson(r);
            if (r.ok && p.ok && p.json?.ok) {
              scores[a.id] = (p.json.lastScore ?? null) as Score | null;
            } else {
              scores[a.id] = null;
            }
          } catch {
            scores[a.id] = null;
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(limit, list.length) }, () => worker()));
      setAgentScores(scores);

      setInfo("Dashboard data loaded.");
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard data");
    } finally {
      setLoadingMeta(false);
    }
  }

  async function refreshJobStatus(currentJobId: string) {
    if (!currentJobId) return null;

    try {
      const res = await fetch(`/api/batch/score/status?jobId=${encodeURIComponent(currentJobId)}`, { cache: "no-store" });
      const parsed = await safeJson(res);
      if (!res.ok || !parsed.ok || !parsed.json?.ok) {
        throw new Error(parsed.text || "Failed to load job status");
      }
      const st = parsed.json as BatchStatusResponse;
      setJobStatus(st);
      return st;
    } catch (e: any) {
      setErr(e?.message || "Failed to load job status");
      return null;
    }
  }

  async function createJob() {
    setCreatingJob(true);
    setErr(null);
    setInfo(null);

    try {
      const body = JSON.stringify({ scope: scopeType, refId: activeRefId, windowSize });

      const res = await fetch("/api/batch/score/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const parsed = await safeJson(res);
      if (!res.ok || !parsed.ok || !parsed.json?.ok) {
        throw new Error(parsed.text || "Create job failed");
      }

      const j = parsed.json as BatchCreateResponse;
      setJobId(j.jobId);
      setInfo(`Job created: ${j.jobId}`);
      await refreshJobStatus(j.jobId);
    } catch (e: any) {
      setErr(e?.message || "Create job failed");
    } finally {
      setCreatingJob(false);
    }
  }

  async function runToCompletion() {
    if (!jobId) return;

    setRunningJob(true);
    setJustFinished(false);
    setErr(null);
    setInfo(null);

    try {
      let st = await refreshJobStatus(jobId);

      for (let i = 0; i < 80; i++) {
        if (isJobFinished(st)) break;

        await fetch("/api/batch/score/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, take: 3 }),
        });

        st = await refreshJobStatus(jobId);
        if (isJobFinished(st)) break;

        await sleep(450);
      }

      st = await refreshJobStatus(jobId);

      if (isJobFinished(st)) {
        setInfo("Done. Scores updated.");
        setJustFinished(true);
        setTimeout(() => setJustFinished(false), 2000);
      } else {
        setInfo("Stopped (max steps reached).");
      }

      await loadAgentsAndScores();
    } catch (e: any) {
      setErr(e?.message || "Run worker failed");
    } finally {
      setRunningJob(false);
    }
  }

  useEffect(() => {
    loadScope();
    loadAgentsAndScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedOrgId) {
        setTeams([]);
        setSelectedTeamId("");
        return;
      }
      try {
        const res = await fetch(`/api/meta/teams?orgId=${encodeURIComponent(selectedOrgId)}`, { cache: "no-store" });
        const parsed = await safeJson(res);
        if (!res.ok || !parsed.ok || !parsed.json?.ok) return;
        const list: Team[] = parsed.json.teams ?? [];
        setTeams(list);

        if (!list.some((t) => t.id === selectedTeamId)) {
          setSelectedTeamId(list[0]?.id ?? "");
        }
      } catch {
        // silent
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId]);

  const agentById = useMemo(() => {
    const m = new Map<string, AgentRow>();
    for (const a of agents) m.set(a.id, a);
    return m;
  }, [agents]);

  const rowsWithScore = useMemo(() => {
    return agents
      .map((a) => ({ agent: a, score: agentScores[a.id] ?? null }))
      .filter((x) => x.score);
  }, [agents, agentScores]);

  const coachingQueue = useMemo(() => {
    return [...rowsWithScore]
      .sort((a, b) => Number(b.score!.coachingPriority) - Number(a.score!.coachingPriority))
      .slice(0, 12);
  }, [rowsWithScore]);

  const highRisk = useMemo(() => {
    return [...rowsWithScore]
      .filter((x) => Number(x.score!.riskScore) >= 70)
      .sort((a, b) => Number(b.score!.riskScore) - Number(a.score!.riskScore))
      .slice(0, 8);
  }, [rowsWithScore]);

  const topPerformers = useMemo(() => {
    return [...rowsWithScore].sort((a, b) => Number(b.score!.overallScore) - Number(a.score!.overallScore)).slice(0, 8);
  }, [rowsWithScore]);

  const lowPerformers = useMemo(() => {
    return [...rowsWithScore].sort((a, b) => Number(a.score!.overallScore) - Number(b.score!.overallScore)).slice(0, 8);
  }, [rowsWithScore]);

  function AgentCell({ id }: { id: string }) {
    const a = agentById.get(id);
    const name = a?.name || id;

    return (
      <a href={`/app/agents/${encodeURIComponent(id)}`} className="hover:underline">
        <div className="font-semibold">{name}</div>
      </a>
    );
  }

  function RiskBadge({ risk }: { risk: number }) {
    if (!Number.isFinite(risk) || risk < 70) return null;
    return (
      <span className="ml-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
        High risk
      </span>
    );
  }

  const numCell = "font-semibold tabular-nums";
  const numPill = "font-semibold tabular-nums";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold">Operations Dashboard</h1>
          <div className="mt-2 opacity-70">Coaching queue, risk signals, and performance overview.</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setErr(null);
              setInfo(null);
              loadAgentsAndScores();
              loadScope();
              if (jobId) refreshJobStatus(jobId);
            }}
            className="rounded-xl border px-4 py-2"
            disabled={loadingMeta || loadingScope}
          >
            Refresh
          </button>
          <a href="/" className="rounded-xl border bg-black px-4 py-2 text-white">
            Home
          </a>
        </div>
      </div>

      {/* counters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-full border px-4 py-2">
          Agents: <span className={numPill}>{totals.agents || "—"}</span>
        </div>
        <div className="rounded-full border px-4 py-2">
          Conversations: <span className={numPill}>{totals.conversations || "—"}</span>
        </div>
        <div className="rounded-full border px-4 py-2">
          Pattern reports: <span className={numPill}>—</span>
        </div>
        <div className="rounded-full border px-4 py-2">
          Score snapshots: <span className={numPill}>{totals.scoreSnapshots || "—"}</span>
        </div>
      </div>

      {err ? (
        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-red-700">{err}</div>
      ) : null}
      {info ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
          {info}
        </div>
      ) : null}

      {/* scope */}
      <div className="mt-8 rounded-3xl border p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold">Scope</div>
            <div className="mt-1 opacity-70">Select organization and team. Used by Batch Scoring below.</div>
          </div>

          <button
            onClick={loadScope}
            className="rounded-xl border px-4 py-2"
            disabled={loadingScope}
            title="Reload orgs and teams"
          >
            {loadingScope ? "Loading…" : "Reload orgs/teams"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <div className="mb-2 text-sm opacity-70">Organization</div>
            <select
              className="w-full rounded-xl border px-3 py-3"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
            >
              <option value="">Select org</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.id})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="mb-2 text-sm opacity-70">Team</div>
            <select
              className="w-full rounded-xl border px-3 py-3"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={!selectedOrgId}
            >
              <option value="">Select team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm opacity-70">
          Active refId for batch: <span className="font-mono">{activeRefId ? activeRefId : "—"}</span>
        </div>
      </div>

      {/* batch scoring */}
      <div className="mt-8 rounded-3xl border p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold">Batch Scoring</div>
            <div className="mt-1 opacity-70">Create a job for selected scope - then run worker to 100%.</div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <select
              className="rounded-xl border px-3 py-2"
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as any)}
            >
              <option value="team">team</option>
              <option value="org">org</option>
            </select>

            <select
              className="rounded-xl border px-3 py-2"
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
            >
              {[20, 30, 50].map((w) => (
                <option key={w} value={w}>
                  window {w}
                </option>
              ))}
            </select>

            <button
              onClick={createJob}
              disabled={creatingJob || !activeRefId}
              className={cx(
                "rounded-xl px-4 py-2",
                !activeRefId ? "bg-gray-300 text-gray-600" : "bg-black text-white"
              )}
              title={!activeRefId ? "Select org/team first" : "Create job"}
            >
              {creatingJob ? "Creating…" : "Create Job"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <div className="text-sm opacity-70">Job ID</div>
            <div className="mt-2 font-mono text-sm">{jobId || "—"}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => jobId && refreshJobStatus(jobId)}
                className="rounded-xl border px-4 py-2"
                disabled={!jobId}
              >
                Refresh status
              </button>

              <button
                onClick={runToCompletion}
                className={cx(
                  "rounded-xl px-4 py-2",
                  jobId ? "bg-black text-white" : "bg-gray-300 text-gray-600",
                  justFinished ? "bg-emerald-700" : ""
                )}
                disabled={!jobId || runningJob}
                title={!jobId ? "Create job first" : "Run worker until done"}
              >
                {runningJob ? "Running…" : justFinished ? "Done ✓" : "Run to 100%"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-sm opacity-70">Progress</div>
            <div className="mt-2 text-4xl font-semibold tabular-nums">{jobStatus?.job ? `${jobStatus.job.percent}%` : "—"}</div>
            <div className="mt-2 opacity-70 text-sm tabular-nums">
              {jobStatus?.counts
                ? `${jobStatus.counts.done} done - ${jobStatus.counts.queued} queued - ${jobStatus.counts.failed} failed`
                : "—"}
            </div>
            <div className="mt-1 text-sm opacity-70">
              Status: <span className="font-semibold">{jobStatus?.job?.status ?? "—"}</span>
            </div>
            {jobStatus?.job?.error ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {jobStatus.job.error}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-sm opacity-70">Last failures</div>
            <div className="mt-3 space-y-2">
              {(jobStatus?.lastFailed ?? []).length === 0 ? (
                <div className="opacity-70 text-sm">No failures.</div>
              ) : (
                (jobStatus?.lastFailed ?? []).slice(0, 5).map((f, idx) => (
                  <div key={idx} className="rounded-xl border px-3 py-2">
                    <div className="font-semibold">{f.agentName || f.agentId}</div>
                    <div className="mt-1 text-sm">{f.error ? clip(f.error, 140) : "Failed"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* tables */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-3xl border p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold">Coaching Queue</div>
            <div className="text-sm opacity-70">Highest priority first</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr className="opacity-70">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {coachingQueue.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 opacity-70" colSpan={4}>
                      No scores yet. Run scoring first.
                    </td>
                  </tr>
                ) : (
                  coachingQueue.map((x) => {
                    const risk = Number(x.score!.riskScore);
                    return (
                      <tr key={x.agent.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <AgentCell id={x.agent.id} />
                            <RiskBadge risk={risk} />
                          </div>
                        </td>
                        <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.coachingPriority)}</td>
                        <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.overallScore)}</td>
                        <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.riskScore)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold">High Risk</div>
            <div className="text-sm opacity-70">Risk ≥ 70</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr className="opacity-70">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Priority</th>
                </tr>
              </thead>
              <tbody>
                {highRisk.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 opacity-70" colSpan={4}>
                      No high-risk agents detected (yet).
                    </td>
                  </tr>
                ) : (
                  highRisk.map((x) => (
                    <tr key={x.agent.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <AgentCell id={x.agent.id} />
                          <RiskBadge risk={Number(x.score!.riskScore)} />
                        </div>
                      </td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.riskScore)}</td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.overallScore)}</td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.coachingPriority)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold">Top Performers</div>
            <div className="text-sm opacity-70">Highest overall first</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr className="opacity-70">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Comm</th>
                  <th className="px-4 py-3">Conv</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 opacity-70" colSpan={5}>
                      No scores yet.
                    </td>
                  </tr>
                ) : (
                  topPerformers.map((x) => (
                    <tr key={x.agent.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <AgentCell id={x.agent.id} />
                          <RiskBadge risk={Number(x.score!.riskScore)} />
                        </div>
                      </td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.overallScore)}</td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.communicationScore)}</td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.conversionScore)}</td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.riskScore)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold">Low Performers</div>
            <div className="text-sm opacity-70">Lowest overall first</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr className="opacity-70">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Priority</th>
                </tr>
              </thead>
              <tbody>
                {lowPerformers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 opacity-70" colSpan={4}>
                      No scores yet.
                    </td>
                  </tr>
                ) : (
                  lowPerformers.map((x) => (
                    <tr key={x.agent.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <AgentCell id={x.agent.id} />
                          <RiskBadge risk={Number(x.score!.riskScore)} />
                        </div>
                      </td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.overallScore)}</td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.riskScore)}</td>
                      <td className={cx("px-4 py-3", numCell)}>{fmtNum(x.score!.coachingPriority)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-10 opacity-60 text-sm">
        Tip: all agent rows are clickable. If team/org are blank, it means seeding didn’t attach agents to teams - UI
        still shows agent names.
      </div>
    </div>
  );
}
