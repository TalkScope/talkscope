"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function riskClass(v: number) {
  if (!Number.isFinite(v)) return "";
  if (v >= 70) return "risk-high";
  if (v >= 50) return "risk-mid";
  return "risk-low";
}

export default function DashboardPage() {
  // scope selectors
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // data
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [agentScores, setAgentScores] = useState<Record<string, Score | null>>({});

  // batch controls
  const [scopeType, setScopeType] = useState<"team" | "org">("team");
  const [windowSize, setWindowSize] = useState<number>(30);

  const [jobId, setJobId] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<BatchStatusResponse | null>(null);

  // UI state
  const [loadingScope, setLoadingScope] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [runningJob, setRunningJob] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // guard to stop old loops
  const runTokenRef = useRef(0);

  const activeRefId = useMemo(() => {
    if (scopeType === "org") return selectedOrgId || "";
    return selectedTeamId || "";
  }, [scopeType, selectedOrgId, selectedTeamId]);

  const totals = useMemo(() => {
    const conversations = agents.reduce((acc, a) => acc + (a.conversationsCount ?? 0), 0);
    const scoreSnapshots = agents.reduce((acc, a) => acc + (a.scoresCount ?? 0), 0);
    return { agents: agents.length, conversations, scoreSnapshots };
  }, [agents]);

  const agentById = useMemo(() => {
    const m = new Map<string, AgentRow>();
    for (const a of agents) m.set(a.id, a);
    return m;
  }, [agents]);

  async function loadScope() {
    setLoadingScope(true);
    setErr(null);
    setInfo(null);

    try {
      const orgRes = await fetch("/api/meta/orgs", { cache: "no-store" });
      const orgParsed = await safeJson(orgRes);
      if (!orgRes.ok || !orgParsed.ok || !orgParsed.json?.ok) throw new Error(orgParsed.text || "Failed to load orgs");

      const orgsList: Org[] = orgParsed.json.orgs ?? [];
      setOrgs(orgsList);

      let orgId = selectedOrgId;
      if (!orgId || !orgsList.some((o) => o.id === orgId)) orgId = orgsList[0]?.id ?? "";
      setSelectedOrgId(orgId);

      if (orgId) {
        const teamRes = await fetch(`/api/meta/teams?orgId=${encodeURIComponent(orgId)}`, { cache: "no-store" });
        const teamParsed = await safeJson(teamRes);
        if (!teamRes.ok || !teamParsed.ok || !teamParsed.json?.ok) throw new Error(teamParsed.text || "Failed to load teams");

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
      if (!res.ok || !parsed.ok || !parsed.json?.ok) throw new Error(parsed.text || "Failed to load agents");

      const list: AgentRow[] = parsed.json.agents ?? [];
      setAgents(list);

      // fetch lastScore per agent (small pool)
      const pool = 6;
      const queue = [...list];
      const scores: Record<string, Score | null> = {};

      async function worker() {
        while (queue.length) {
          const a = queue.shift();
          if (!a) break;
          try {
            const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(a.id)}`, { cache: "no-store" });
            const p = await safeJson(r);
            if (r.ok && p.ok && p.json?.ok) scores[a.id] = (p.json.lastScore ?? null) as Score | null;
            else scores[a.id] = null;
          } catch {
            scores[a.id] = null;
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(pool, list.length) }, () => worker()));
      setAgentScores(scores);

      setInfo("Dashboard data loaded.");
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard data");
    } finally {
      setLoadingMeta(false);
    }
  }

  async function refreshJobStatus(currentJobId: string) : Promise<BatchStatusResponse | null> {
    if (!currentJobId) return null;
    try {
      const res = await fetch(`/api/batch/score/status?jobId=${encodeURIComponent(currentJobId)}`, { cache: "no-store" });
      const parsed = await safeJson(res);
      if (!res.ok || !parsed.ok || !parsed.json?.ok) throw new Error(parsed.text || "Failed to load job status");

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
      if (!res.ok || !parsed.ok || !parsed.json?.ok) throw new Error(parsed.text || "Create job failed");

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

    // invalidate previous runs
    runTokenRef.current += 1;
    const token = runTokenRef.current;

    setRunningJob(true);
    setErr(null);
    setInfo(null);

    try {
      // Hard cap to avoid endless loop
      for (let i = 0; i < 80; i++) {
        if (runTokenRef.current !== token) break; // cancelled by new run

        // 1) run worker chunk
        const runRes = await fetch("/api/batch/score/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, take: 3 }),
        });

        // 2) always refresh status to drive UI + exit condition
        const st = await refreshJobStatus(jobId);

        // 3) done condition
        if (st?.job?.status === "done" || st?.job?.percent === 100) break;

        // If API returned error page/html, show it early
        if (!runRes.ok) {
          const txt = await runRes.text().catch(() => "");
          throw new Error(`Worker failed ${runRes.status}: ${txt.slice(0, 160)}`);
        }

        await sleep(650);
      }

      const stFinal = await refreshJobStatus(jobId);
      if (stFinal?.job?.status === "done" || stFinal?.job?.percent === 100) {
        setInfo("Completed: 100%.");
      } else {
        setInfo("Stopped (max steps reached). You can press Run to 100% again.");
      }

      await loadAgentsAndScores();
    } catch (e: any) {
      setErr(e?.message || "Run worker failed");
    } finally {
      setRunningJob(false);
    }
  }

  // initial load
  useEffect(() => {
    loadScope();
    loadAgentsAndScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload teams when org changes
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
        if (!list.some((t) => t.id === selectedTeamId)) setSelectedTeamId(list[0]?.id ?? "");
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId]);

  const rowsWithScore = useMemo(() => {
    return agents
      .map((a) => ({ agent: a, score: agentScores[a.id] ?? null }))
      .filter((x) => x.score);
  }, [agents, agentScores]);

  const coachingQueue = useMemo(() => {
    return [...rowsWithScore].sort((a, b) => Number(b.score!.coachingPriority) - Number(a.score!.coachingPriority)).slice(0, 12);
  }, [rowsWithScore]);

  const highRisk = useMemo(() => {
    return [...rowsWithScore].filter((x) => Number(x.score!.riskScore) >= 70).sort((a, b) => Number(b.score!.riskScore) - Number(a.score!.riskScore)).slice(0, 8);
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
        <div className="agent-name">{name}</div>
      </a>
    );
  }

  const progressPct = jobStatus?.job?.percent ?? 0;
  const progressDone = jobStatus?.counts?.done ?? 0;
  const progressQueued = jobStatus?.counts?.queued ?? 0;
  const progressFailed = jobStatus?.counts?.failed ?? 0;
  const isComplete = jobStatus?.job?.status === "done" || progressPct === 100;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold ts-ink">Operations Dashboard</h1>
          <div className="mt-2 ts-muted">Coaching queue, risk signals, and performance overview.</div>
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

      {/* KPI chips */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="ts-badge">
          <strong>{totals.agents || "—"}</strong> Agents
        </div>
        <div className="ts-badge">
          <strong>{totals.conversations || "—"}</strong> Conversations
        </div>
        <div className="ts-badge">
          <strong>{totals.scoreSnapshots || "—"}</strong> Score snapshots
        </div>
        <div className="ts-badge">
          <strong>{rowsWithScore.length || 0}</strong> Agents scored
        </div>
      </div>

      {/* messages */}
      {err ? <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-red-700">{err}</div> : null}
      {info ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">{info}</div> : null}

      {/* Scope */}
      <div className="mt-8 rounded-3xl border p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold ts-ink">Scope</div>
            <div className="mt-1 ts-muted">Select organization and team. Used by Batch Scoring below.</div>
          </div>

          <button onClick={loadScope} className="rounded-xl border px-4 py-2" disabled={loadingScope}>
            {loadingScope ? "Loading…" : "Reload orgs/teams"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <div className="mb-2 text-sm ts-muted">Organization</div>
            <select className="w-full rounded-xl border px-3 py-3" value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}>
              <option value="">Select org</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="mb-2 text-sm ts-muted">Team</div>
            <select
              className="w-full rounded-xl border px-3 py-3"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={!selectedOrgId}
            >
              <option value="">Select team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm ts-muted">
          Active refId for batch: <span className="font-mono ts-ink">{activeRefId ? activeRefId : "—"}</span>
        </div>
      </div>

      {/* Batch Scoring */}
      <div className="mt-8 rounded-3xl border p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold ts-ink">Batch Scoring</div>
            <div className="mt-1 ts-muted">Create a job for selected scope — then run worker to 100%.</div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <select className="rounded-xl border px-3 py-2" value={scopeType} onChange={(e) => setScopeType(e.target.value as any)}>
              <option value="team">team</option>
              <option value="org">org</option>
            </select>

            <select className="rounded-xl border px-3 py-2" value={windowSize} onChange={(e) => setWindowSize(Number(e.target.value))}>
              {[20, 30, 50].map((w) => (
                <option key={w} value={w}>
                  window {w}
                </option>
              ))}
            </select>

            <button
              onClick={createJob}
              disabled={creatingJob || !activeRefId}
              className={cx("rounded-xl px-4 py-2", !activeRefId ? "bg-gray-300 text-gray-600" : "bg-black text-white")}
              title={!activeRefId ? "Select org/team first" : "Create job"}
            >
              {creatingJob ? "Creating…" : "Create Job"}
            </button>

            {/* One main action */}
            <button
              onClick={runToCompletion}
              disabled={!jobId || runningJob}
              className={cx("rounded-xl px-4 py-2", !jobId ? "bg-gray-300 text-gray-600" : "bg-black text-white")}
              title={!jobId ? "Create job first" : "Run worker until done"}
            >
              {runningJob ? "Running…" : isComplete ? "Done ✓" : "Run to 100%"}
            </button>
          </div>
        </div>

        <div className="ts-divider mt-6" />

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <div className="text-sm ts-muted">Job</div>
            <div className="mt-2 font-mono text-sm ts-ink">{jobId || "—"}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => jobId && refreshJobStatus(jobId)} className="rounded-xl border px-4 py-2" disabled={!jobId}>
                Refresh status
              </button>
              <button
                onClick={() => {
                  setJobId("");
                  setJobStatus(null);
                  setInfo("Job cleared (UI only).");
                }}
                className="rounded-xl border px-4 py-2"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-sm ts-muted">Progress</div>
            <div className="mt-2 text-4xl font-semibold ts-ink">
              <span className="metric-number">{jobStatus?.job ? `${progressPct}%` : "—"}</span>
            </div>

            <div className="mt-3 ts-progress">
              <div style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }} />
            </div>

            <div className="mt-3 text-sm ts-muted">
              <span className="metric-number ts-ink">{progressDone}</span> done •{" "}
              <span className="metric-number ts-ink">{progressQueued}</span> queued •{" "}
              <span className={cx("metric-number", progressFailed > 0 ? "risk-high" : "ts-ink")}>{progressFailed}</span> failed
            </div>

            <div className="mt-1 text-sm ts-muted">
              Status: <span className="font-semibold ts-ink">{jobStatus?.job?.status ?? "—"}</span>
            </div>

            {jobStatus?.job?.error ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {jobStatus.job.error}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-sm ts-muted">Last failures</div>
            <div className="mt-3 space-y-2">
              {(jobStatus?.lastFailed ?? []).length === 0 ? (
                <div className="ts-muted text-sm">No failures.</div>
              ) : (
                (jobStatus?.lastFailed ?? []).slice(0, 5).map((f, idx) => (
                  <div key={idx} className="rounded-xl border px-3 py-2">
                    <div className="font-semibold ts-ink">{f.agentName || f.agentId}</div>
                    <div className="mt-1 text-sm ts-muted">{f.error ? clip(f.error, 150) : "Failed"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Coaching Queue */}
        <div className="rounded-3xl border p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold ts-ink">Coaching Queue</div>
            <div className="text-sm ts-muted">Highest priority first</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-left table-hover">
              <thead className="border-b">
                <tr className="ts-muted">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {coachingQueue.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 ts-muted" colSpan={4}>
                      No scores yet. Run scoring first.
                    </td>
                  </tr>
                ) : (
                  coachingQueue.map((x) => (
                    <tr key={x.agent.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <AgentCell id={x.agent.id} />
                      </td>
                      <td className="px-4 py-3 metric-number ts-ink">{fmtNum(x.score!.coachingPriority)}</td>
                      <td className="px-4 py-3 metric-number ts-ink">{fmtNum(x.score!.overallScore)}</td>
                      <td className={cx("px-4 py-3 metric-number", riskClass(Number(x.score!.riskScore)))}>{fmtNum(x.score!.riskScore)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* High Risk */}
        <div className="rounded-3xl border p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold ts-ink">High Risk</div>
            <div className="text-sm ts-muted">Risk ≥ 70</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-left table-hover">
              <thead className="border-b">
                <tr className="ts-muted">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Priority</th>
                </tr>
              </thead>
              <tbody>
                {highRisk.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 ts-muted" colSpan={4}>
                      No high-risk agents detected (yet).
                    </td>
                  </tr>
                ) : (
                  highRisk.map((x) => (
                    <tr key={x.agent.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <AgentCell id={x.agent.id} />
                      </td>
                      <td className={cx("px-4 py-3 metric-number", riskClass(Number(x.score!.riskScore)))}>{fmtNum(x.score!.riskScore)}</td>
                      <td className="px-4 py-3 metric-number ts-ink">{fmtNum(x.score!.overallScore)}</td>
                      <td className="px-4 py-3 metric-number ts-ink">{fmtNum(x.score!.coachingPriority)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performers */}
        <div className="rounded-3xl border p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold ts-ink">Top Performers</div>
            <div className="text-sm ts-muted">Highest overall first</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-left table-hover">
              <thead className="border-b">
                <tr className="ts-muted">
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
                    <td className="px-4 py-4 ts-muted" colSpan={5}>
                      No scores yet.
                    </td>
                  </tr>
                ) : (
                  topPerformers.map((x) => (
                    <tr key={x.agent.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <AgentCell id={x.agent.id} />
                      </td>
                      <td className="px-4 py-3 metric-number ts-ink">{fmtNum(x.score!.overallScore)}</td>
                      <td className="px-4 py-3 metric-number ts-ink">{fmtNum(x.score!.communicationScore)}</td>
                      <td className="px-4 py-3 metric-number ts-ink">{fmtNum(x.score!.conversionScore)}</td>
                      <td className={cx("px-4 py-3 metric-number", riskClass(Number(x.score!.riskScore)))}>{fmtNum(x.score!.riskScore)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Performers */}
        <div className="rounded-3xl border p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold ts-ink">Low Performers</div>
            <div className="text-sm ts-muted">Lowest overall first</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-left table-hover">
              <thead className="border-b">
                <tr className="ts-muted">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Priority</th>
                </tr>
              </thead>
              <tbody>
                {lowPerformers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 ts-muted" colSpan={4}>
                      No scores yet.
                    </td>
                  </tr>
                ) : (
                  lowPerformers.map((x) => (
                    <tr key={x.agent.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <AgentCell id={x.agent.id} />
                      </td>
                      <td className="px-4 py-3 metric-number ts-ink">{fmtNum(x.score!.overallScore)}</td>
                      <td className={cx("px-4 py-3 metric-number", riskClass(Number(x.score!.riskScore)))}>{fmtNum(x.score!.riskScore)}</td>
                      <td className="px-4 py-3 metric-number ts-ink">{fmtNum(x.score!.coachingPriority)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Help Accordion */}
      <div className="mt-10">
        <div className="text-2xl font-semibold ts-ink">How to use this dashboard</div>
        <div className="mt-2 ts-muted">
          Think of it as an air-traffic control room: you’re not “reading calls”, you’re spotting patterns and deciding where coaching pays back fastest.
        </div>

        <div className="mt-5 ts-accordion">
          <details open>
            <summary>1) What should I do first?</summary>
            <div className="ts-acc-body">
              Choose the <b>Scope</b> (org or team), then click <b>Create Job</b>, then <b>Run to 100%</b>.
              When it reaches 100%, refresh tables automatically updates and agents get score snapshots.
            </div>
          </details>

          <details>
            <summary>2) What do the numbers mean?</summary>
            <div className="ts-acc-body">
              <b>Overall</b> - general performance score (0..100).<br/>
              <b>Comm</b> - clarity, empathy timing, structure of communication.<br/>
              <b>Conv</b> - conversion mechanics: discovery, objections, closing, next steps.<br/>
              <b>Risk</b> - churn / escalation / trust loss probability signals.<br/>
              <b>Priority</b> - coaching ROI indicator: who to coach first.
            </div>
          </details>

          <details>
            <summary>3) How to read Coaching Queue vs High Risk?</summary>
            <div className="ts-acc-body">
              <b>Coaching Queue</b> is a “where coaching will move the needle” list.
              <b>High Risk</b> is a “stop the bleeding” list. If Risk is high, fix it even if Overall is okay.
            </div>
          </details>

          <details>
            <summary>4) What is “Last failures”?</summary>
            <div className="ts-acc-body">
              This is technical visibility: if an agent failed to score, you see the last 5 failures with human names.
              In production we usually hide raw errors behind “Retry / View details” for admins only — we’ll do that next.
            </div>
          </details>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 ts-muted text-sm">
        Tip: all agent rows are clickable. If team/org are blank, it means seeding didn’t attach agents to teams — UI still shows agent names.
      </div>
    </div>
  );
}
