"use client";

import { useEffect, useMemo, useState } from "react";

type Org = { id: string; name: string; createdAt?: string; _count?: any };
type Team = { id: string; name: string; organizationId: string; createdAt?: string; _count?: any };
type AgentMeta = {
  id: string;
  name: string;
  email?: string | null;
  teamId?: string | null;
  team?: { id: string; name: string; organization?: { id: string; name: string } } | null;
  conversationsCount?: number;
  scoresCount?: number;
};

type Overview = {
  ok: boolean;
  stats: {
    totalAgents: number;
    conversationsCount: number;
    patternReportsCount: number;
    agentScoresCount: number;
  };
  highRisk: { agentId: string; risk: number; overall: number; coachingPriority: number; at: string }[];
  coachingQueue: { agentId: string; coachingPriority: number; overall: number; risk: number; at: string }[];
  topPerformers: { agentId: string; overall: number; communication: number; conversion: number; risk: number; at: string }[];
  lowPerformers: { agentId: string; overall: number; risk: number; coachingPriority: number; at: string }[];
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function pill(label: string) {
  return <span className="rounded-full border px-3 py-1 text-xs text-neutral-600">{label}</span>;
}

function ScoreCell({ value }: { value: number }) {
  return <span className="font-semibold">{fmt(value)}</span>;
}

function AgentLink({
  agentId,
  label,
  sub,
}: {
  agentId: string;
  label: string;
  sub?: string;
}) {
  return (
    <a href={`/app/agents/${encodeURIComponent(agentId)}`} className="hover:underline">
      <div className="font-medium">{label}</div>
      {sub ? <div className="text-xs text-neutral-500">{sub}</div> : null}
    </a>
  );
}

async function safeJson<T>(r: Response): Promise<T> {
  const txt = await r.text();
  try {
    return JSON.parse(txt) as T;
  } catch {
    // Если API вдруг вернул HTML или текст — покажем первые 200 символов
    throw new Error(`Invalid JSON response: ${txt.slice(0, 200)}`);
  }
}

export default function DashboardPage() {
  const [limit, setLimit] = useState(12);

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // meta
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaErr, setMetaErr] = useState<string | null>(null);

  // scope selection (for batch)
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // batch
  const [batchScope, setBatchScope] = useState<"team" | "org">("team");
  const [batchWindow, setBatchWindow] = useState<number>(30);

  const [jobId, setJobId] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobErr, setJobErr] = useState<string | null>(null);

  const stats = useMemo(() => data?.stats, [data]);

  const orgById = useMemo(() => {
    const m = new Map<string, Org>();
    for (const o of orgs) m.set(o.id, o);
    return m;
  }, [orgs]);

  const teamById = useMemo(() => {
    const m = new Map<string, Team>();
    for (const t of teams) m.set(t.id, t);
    return m;
  }, [teams]);

  const agentById = useMemo(() => {
    const m = new Map<string, AgentMeta>();
    for (const a of agents) m.set(a.id, a);
    return m;
  }, [agents]);

  const teamsForSelectedOrg = useMemo(() => {
    if (!selectedOrgId) return teams;
    return teams.filter((t) => t.organizationId === selectedOrgId);
  }, [teams, selectedOrgId]);

  const activeBatchRefId = useMemo(() => {
    if (batchScope === "org") return selectedOrgId || "";
    return selectedTeamId || "";
  }, [batchScope, selectedOrgId, selectedTeamId]);

  function agentLabel(agentId: string) {
    const a = agentById.get(agentId);
    if (!a) return { title: agentId, sub: "" };
    const teamName = a.team?.name || (a.teamId ? teamById.get(a.teamId)?.name : "");
    const orgName =
      a.team?.organization?.name ||
      (a.teamId ? orgById.get(teamById.get(a.teamId || "")?.organizationId || "")?.name : "");
    const sub = [teamName, orgName].filter(Boolean).join(" — ");
    return { title: a.name || agentId, sub };
  }

  async function loadOverview() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/dashboard/overview?limit=${limit}`, { cache: "no-store" });
      const j = await safeJson<Overview>(r);
      if (!j.ok) throw new Error("Dashboard API returned ok:false");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadMeta() {
    setMetaLoading(true);
    setMetaErr(null);
    try {
      const [rOrgs, rTeams, rAgents] = await Promise.all([
        fetch(`/api/meta/orgs`, { cache: "no-store" }),
        fetch(`/api/meta/teams`, { cache: "no-store" }),
        fetch(`/api/meta/agents`, { cache: "no-store" }),
      ]);

      const jOrgs = await safeJson<{ ok: boolean; orgs: Org[] }>(rOrgs);
      const jTeams = await safeJson<{ ok: boolean; teams: Team[] }>(rTeams);
      const jAgents = await safeJson<{ ok: boolean; agents: AgentMeta[] }>(rAgents);

      if (!jOrgs.ok) throw new Error("meta/orgs returned ok:false");
      if (!jTeams.ok) throw new Error("meta/teams returned ok:false");
      if (!jAgents.ok) throw new Error("meta/agents returned ok:false");

      setOrgs(jOrgs.orgs || []);
      setTeams(jTeams.teams || []);
      setAgents(jAgents.agents || []);

      // pick defaults (first org + first team)
      const firstOrg = (jOrgs.orgs || [])[0]?.id || "";
      setSelectedOrgId((prev) => prev || firstOrg);

      const teamsForOrg = (jTeams.teams || []).filter((t) => t.organizationId === (prevOr(firstOrg, selectedOrgId)));
      const firstTeam = teamsForOrg[0]?.id || (jTeams.teams || [])[0]?.id || "";
      setSelectedTeamId((prev) => prev || firstTeam);
    } catch (e: any) {
      setMetaErr(e?.message || "Failed to load meta");
    } finally {
      setMetaLoading(false);
    }
  }

  function prevOr(a: string, b: string) {
    return b || a;
  }

  async function createBatch() {
    setJobLoading(true);
    setJobErr(null);
    try {
      const refId = activeBatchRefId.trim();
      if (!refId) throw new Error("Select org/team first (refId is empty)");

      const r = await fetch(`/api/batch/score/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: batchScope, refId, windowSize: batchWindow }),
      });

      const j = await safeJson<any>(r);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `Create job failed (${r.status})`);

      setJobId(j.jobId);
      localStorage.setItem("talkscope_last_job_id", j.jobId);
      await fetchJobStatus(j.jobId);
    } catch (e: any) {
      setJobErr(e?.message || "Failed to create batch job");
    } finally {
      setJobLoading(false);
    }
  }

  async function fetchJobStatus(id?: string) {
    const jid = (id ?? jobId).trim();
    if (!jid) return;

    setJobErr(null);
    try {
      const r = await fetch(`/api/batch/score/status?jobId=${encodeURIComponent(jid)}`, { cache: "no-store" });
      const j = await safeJson<any>(r);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `Status failed (${r.status})`);
      setJobStatus(j);
    } catch (e: any) {
      setJobErr(e?.message || "Failed to load batch status");
    }
  }

  async function runWorkerOnce() {
    const jid = jobId.trim();
    if (!jid) return;

    setJobLoading(true);
    setJobErr(null);
    try {
      const r = await fetch(`/api/batch/score/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: jid, take: 3 }),
      });
      const j = await safeJson<any>(r);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `Worker failed (${r.status})`);

      await fetchJobStatus(jid);
      await loadOverview();
    } catch (e: any) {
      setJobErr(e?.message || "Failed to run worker");
    } finally {
      setJobLoading(false);
    }
  }

  // init
  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  useEffect(() => {
    const last = typeof window !== "undefined" ? localStorage.getItem("talkscope_last_job_id") : "";
    if (last) {
      setJobId(last);
      fetchJobStatus(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when org changes, auto-select first team from this org (if batchScope=team)
  useEffect(() => {
    if (!selectedOrgId) return;
    const list = teams.filter((t) => t.organizationId === selectedOrgId);
    if (list.length === 0) return;
    if (!selectedTeamId || !list.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(list[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId, teams]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-neutral-500">Coaching queue, risk signals, and performance overview.</p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Rows</span>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[8, 12, 20, 40].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadOverview}
            disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <a href="/app" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
            Home
          </a>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {pill(`Agents: ${stats?.totalAgents ?? 0}`)}
        {pill(`Conversations: ${stats?.conversationsCount ?? 0}`)}
        {pill(`Pattern reports: ${stats?.patternReportsCount ?? 0}`)}
        {pill(`Score snapshots: ${stats?.agentScoresCount ?? 0}`)}
      </div>

      {/* Scope */}
      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Scope</h2>
            <p className="text-sm text-neutral-500">Select organization and team. Used by Batch Scoring below.</p>
          </div>

          <button
            onClick={loadMeta}
            disabled={metaLoading}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {metaLoading ? "Loading..." : "Reload orgs/teams"}
          </button>
        </div>

        {metaErr && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{metaErr}</div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Organization</div>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.id})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Team</div>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teamsForSelectedOrg.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-neutral-500">
          Active refId for batch:{" "}
          <span className="font-mono text-neutral-700">
            {batchScope === "org" ? selectedOrgId || "—" : selectedTeamId || "—"}
          </span>
        </div>
      </div>

      {/* Batch Scoring */}
      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Batch Scoring</h2>
            <p className="text-sm text-neutral-500">Create a job for selected scope - then run worker in controlled steps.</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={batchScope}
              onChange={(e) => setBatchScope(e.target.value as any)}
            >
              <option value="team">team</option>
              <option value="org">org</option>
            </select>

            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={batchWindow}
              onChange={(e) => setBatchWindow(Number(e.target.value))}
            >
              {[20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  window {n}
                </option>
              ))}
            </select>

            <button
              onClick={createBatch}
              disabled={jobLoading || !activeBatchRefId.trim()}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {jobLoading ? "Working..." : "Create Job"}
            </button>
          </div>
        </div>

        {jobErr && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{jobErr}</div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Job ID</div>
            <div className="mt-1 break-all font-mono text-xs">{jobId || "—"}</div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => fetchJobStatus()}
                disabled={jobLoading || !jobId}
                className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Refresh status
              </button>
              <button
                onClick={runWorkerOnce}
                disabled={jobLoading || !jobId}
                className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Run worker (x3)
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Progress</div>
            <div className="mt-2 text-2xl font-semibold">{jobStatus?.job?.percent ?? 0}%</div>
            <div className="mt-1 text-sm text-neutral-600">
              {jobStatus?.counts?.done ?? 0} done - {jobStatus?.counts?.queued ?? 0} queued - {jobStatus?.counts?.failed ?? 0} failed
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Status: <span className="font-semibold">{jobStatus?.job?.status ?? "—"}</span>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Last failures</div>
            <div className="mt-2 space-y-2 text-sm text-neutral-700">
              {(jobStatus?.lastFailed ?? []).length === 0 ? (
                <div className="text-neutral-600">No failures.</div>
              ) : (
                (jobStatus?.lastFailed ?? []).map((x: any, i: number) => {
                  const a = agentLabel(x.agentId);
                  return (
                    <div key={i} className="rounded-lg border p-2">
                      <div className="text-xs font-semibold">{a.title}</div>
                      {a.sub ? <div className="text-xs text-neutral-500">{a.sub}</div> : null}
                      <div className="mt-1 font-mono text-[11px] text-neutral-700">{x.agentId}</div>
                      <div className="mt-1 text-xs text-red-700">{String(x.error || "").slice(0, 240)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Coaching Queue */}
        <section className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Coaching Queue</h2>
            <span className="text-xs text-neutral-500">Highest priority first</span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 text-left">Agent</th>
                  <th className="px-3 py-2 text-left">Priority</th>
                  <th className="px-3 py-2 text-left">Overall</th>
                  <th className="px-3 py-2 text-left">Risk</th>
                </tr>
              </thead>
              <tbody>
                {(data?.coachingQueue ?? []).map((r, i) => {
                  const a = agentLabel(r.agentId);
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">
                        <AgentLink agentId={r.agentId} label={a.title} sub={a.sub} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.coachingPriority} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.overall} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.risk} />
                      </td>
                    </tr>
                  );
                })}
                {(!data || data.coachingQueue.length === 0) && (
                  <tr>
                    <td className="px-3 py-3 text-neutral-600" colSpan={4}>
                      No data yet. Generate scores for more agents.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* High Risk */}
        <section className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">High Risk</h2>
            <span className="text-xs text-neutral-500">Risk ≥ 70</span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 text-left">Agent</th>
                  <th className="px-3 py-2 text-left">Risk</th>
                  <th className="px-3 py-2 text-left">Overall</th>
                  <th className="px-3 py-2 text-left">Priority</th>
                </tr>
              </thead>
              <tbody>
                {(data?.highRisk ?? []).map((r, i) => {
                  const a = agentLabel(r.agentId);
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">
                        <AgentLink agentId={r.agentId} label={a.title} sub={a.sub} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.risk} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.overall} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.coachingPriority} />
                      </td>
                    </tr>
                  );
                })}
                {(!data || data.highRisk.length === 0) && (
                  <tr>
                    <td className="px-3 py-3 text-neutral-600" colSpan={4}>
                      No high-risk agents detected (yet).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top Performers */}
        <section className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top Performers</h2>
            <span className="text-xs text-neutral-500">Highest overall first</span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 text-left">Agent</th>
                  <th className="px-3 py-2 text-left">Overall</th>
                  <th className="px-3 py-2 text-left">Comm</th>
                  <th className="px-3 py-2 text-left">Conv</th>
                  <th className="px-3 py-2 text-left">Risk</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topPerformers ?? []).map((r, i) => {
                  const a = agentLabel(r.agentId);
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">
                        <AgentLink agentId={r.agentId} label={a.title} sub={a.sub} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.overall} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.communication} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.conversion} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.risk} />
                      </td>
                    </tr>
                  );
                })}
                {(!data || data.topPerformers.length === 0) && (
                  <tr>
                    <td className="px-3 py-3 text-neutral-600" colSpan={5}>
                      No scores yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low Performers */}
        <section className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Low Performers</h2>
            <span className="text-xs text-neutral-500">Lowest overall first</span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 text-left">Agent</th>
                  <th className="px-3 py-2 text-left">Overall</th>
                  <th className="px-3 py-2 text-left">Risk</th>
                  <th className="px-3 py-2 text-left">Priority</th>
                </tr>
              </thead>
              <tbody>
                {(data?.lowPerformers ?? []).map((r, i) => {
                  const a = agentLabel(r.agentId);
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">
                        <AgentLink agentId={r.agentId} label={a.title} sub={a.sub} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.overall} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.risk} />
                      </td>
                      <td className="px-3 py-2">
                        <ScoreCell value={r.coachingPriority} />
                      </td>
                    </tr>
                  );
                })}
                {(!data || data.lowPerformers.length === 0) && (
                  <tr>
                    <td className="px-3 py-3 text-neutral-600" colSpan={4}>
                      No scores yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Next layer</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Дальше сделаем: авто-скоринг по расписанию, стабильный “pattern heatmap”, и нормальную роль-модель доступа (org/team/agent).
        </p>
      </div>
    </div>
  );
}
