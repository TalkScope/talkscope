"use client";

import { useEffect, useMemo, useState } from "react";

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

type AgentMeta = {
  id: string;
  name: string;
  role: string | null;
  team: { id: string; name: string; organization: { id: string; name: string } } | null;
  _count?: { conversations?: number; scores?: number };
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return Number(n).toFixed(1);
}

function pill(label: string) {
  return <span className="rounded-full border px-3 py-1 text-xs text-neutral-600">{label}</span>;
}

function ScoreCell({ value }: { value: number }) {
  return <span className="font-semibold">{fmt(value)}</span>;
}

function AgentLabel({ agentId, agentMap }: { agentId: string; agentMap: Record<string, AgentMeta> }) {
  const a = agentMap[agentId];
  if (!a) return <span className="font-mono text-xs">{agentId}</span>;

  const teamName = a.team?.name;
  const orgName = a.team?.organization?.name;

  return (
    <div className="min-w-[240px]">
      <div className="font-medium">{a.name || agentId}</div>
      <div className="text-xs text-neutral-500">
        {(teamName || "—") + " — " + (orgName || "—")}
      </div>
      <div className="mt-1 font-mono text-[11px] text-neutral-400">{agentId}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [limit, setLimit] = useState(12);

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  // Batch controls (as you already had)
  const [batchScope, setBatchScope] = useState<"team" | "org">("team");
  const [batchRefId, setBatchRefId] = useState<string>("");
  const [batchWindow, setBatchWindow] = useState<number>(30);

  const [jobId, setJobId] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobErr, setJobErr] = useState<string | null>(null);

  const agentMap = useMemo(() => {
    const m: Record<string, AgentMeta> = {};
    for (const a of agents) m[a.id] = a;
    return m;
  }, [agents]);

  async function loadOverview() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/dashboard/overview?limit=${limit}`, { cache: "no-store" });
      const j = (await r.json()) as Overview;
      if (!j.ok) throw new Error("Dashboard API returned ok:false");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadAgentsMeta() {
    setMetaLoading(true);
    try {
      const r = await fetch(`/api/meta/agents`, { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "meta/agents ok:false");
      setAgents(j.agents || []);
    } catch (e: any) {
      // meta не критично, но лучше показать
      setErr((prev) => prev || (e?.message || "Failed to load agents meta"));
    } finally {
      setMetaLoading(false);
    }
  }

  async function createBatch() {
    setJobLoading(true);
    setJobErr(null);
    try {
      const r = await fetch(`/api/batch/score/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: batchScope, refId: batchRefId.trim(), windowSize: batchWindow }),
      });

      const txt = await r.text();
      if (!r.ok) throw new Error(`Create job failed ${r.status}: ${txt.slice(0, 200)}`);

      const j = JSON.parse(txt);
      if (!j.ok) throw new Error(j.error || "Create job failed");

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

    try {
      const r = await fetch(`/api/batch/score/status?jobId=${encodeURIComponent(jid)}`, { cache: "no-store" });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Status failed ${r.status}: ${txt.slice(0, 200)}`);
      const j = JSON.parse(txt);
      if (!j.ok) throw new Error(j.error || "Status failed");
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

      const txt = await r.text();
      if (!r.ok) throw new Error(`Worker failed ${r.status}: ${txt.slice(0, 200)}`);

      const j = JSON.parse(txt);
      if (!j.ok) throw new Error(j.error || "Worker failed");

      await fetchJobStatus(jid);
      await loadOverview();
    } catch (e: any) {
      setJobErr(e?.message || "Failed to run worker");
    } finally {
      setJobLoading(false);
    }
  }

  useEffect(() => {
    const last = typeof window !== "undefined" ? localStorage.getItem("talkscope_last_job_id") : "";
    if (last) {
      setJobId(last);
      fetchJobStatus(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOverview();
    loadAgentsMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const stats = data?.stats;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-neutral-500">
            Coaching queue, risk signals, and performance overview.
          </p>
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
            onClick={() => {
              loadOverview();
              loadAgentsMeta();
            }}
            disabled={loading || metaLoading}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading || metaLoading ? "Refreshing..." : "Refresh"}
          </button>

          <a href="/app" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
            Home
          </a>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {pill(`Agents: ${stats?.totalAgents ?? 0}`)}
        {pill(`Conversations: ${stats?.conversationsCount ?? 0}`)}
        {pill(`Pattern reports: ${stats?.patternReportsCount ?? 0}`)}
        {pill(`Score snapshots: ${stats?.agentScoresCount ?? 0}`)}
      </div>

      {/* Batch Scoring */}
      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Batch Scoring</h2>
            <p className="text-sm text-neutral-500">
              Create a job for team/org - then run worker in controlled steps.
            </p>
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

            <input
              className="w-full rounded-lg border px-3 py-2 text-sm md:w-[420px]"
              placeholder="refId (teamId or orgId)"
              value={batchRefId}
              onChange={(e) => setBatchRefId(e.target.value)}
            />

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
              disabled={jobLoading || !batchRefId.trim()}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {jobLoading ? "Working..." : "Create Job"}
            </button>
          </div>
        </div>

        {jobErr && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {jobErr}
          </div>
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
              {jobStatus?.counts?.done ?? 0} done - {jobStatus?.counts?.queued ?? 0} queued -{" "}
              {jobStatus?.counts?.failed ?? 0} failed
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
                (jobStatus?.lastFailed ?? []).map((x: any, i: number) => (
                  <div key={i} className="rounded-lg border p-2">
                    <div className="font-mono text-xs">{x.agentId}</div>
                    <div className="mt-1 text-xs text-neutral-600">{x.error}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
                {(data?.coachingQueue ?? []).map((r, i) => (
                  <tr key={i} className="border-t align-top">
                    <td className="px-3 py-3">
                      <a className="hover:underline" href={`/app/agents/${encodeURIComponent(r.agentId)}`}>
                        <AgentLabel agentId={r.agentId} agentMap={agentMap} />
                      </a>
                    </td>
                    <td className="px-3 py-3"><ScoreCell value={r.coachingPriority} /></td>
                    <td className="px-3 py-3"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-3"><ScoreCell value={r.risk} /></td>
                  </tr>
                ))}
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
                {(data?.highRisk ?? []).map((r, i) => (
                  <tr key={i} className="border-t align-top">
                    <td className="px-3 py-3">
                      <a className="hover:underline" href={`/app/agents/${encodeURIComponent(r.agentId)}`}>
                        <AgentLabel agentId={r.agentId} agentMap={agentMap} />
                      </a>
                    </td>
                    <td className="px-3 py-3"><ScoreCell value={r.risk} /></td>
                    <td className="px-3 py-3"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-3"><ScoreCell value={r.coachingPriority} /></td>
                  </tr>
                ))}
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
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
                {(data?.topPerformers ?? []).map((r, i) => (
                  <tr key={i} className="border-t align-top">
                    <td className="px-3 py-3">
                      <a className="hover:underline" href={`/app/agents/${encodeURIComponent(r.agentId)}`}>
                        <AgentLabel agentId={r.agentId} agentMap={agentMap} />
                      </a>
                    </td>
                    <td className="px-3 py-3"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-3"><ScoreCell value={r.communication} /></td>
                    <td className="px-3 py-3"><ScoreCell value={r.conversion} /></td>
                    <td className="px-3 py-3"><ScoreCell value={r.risk} /></td>
                  </tr>
                ))}
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
                {(data?.lowPerformers ?? []).map((r, i) => (
                  <tr key={i} className="border-t align-top">
                    <td className="px-3 py-3">
                      <a className="hover:underline" href={`/app/agents/${encodeURIComponent(r.agentId)}`}>
                        <AgentLabel agentId={r.agentId} agentMap={agentMap} />
                      </a>
                    </td>
                    <td className="px-3 py-3"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-3"><ScoreCell value={r.risk} /></td>
                    <td className="px-3 py-3"><ScoreCell value={r.coachingPriority} /></td>
                  </tr>
                ))}
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
        <h2 className="text-lg font-semibold">How to use</h2>
        <div className="mt-2 text-sm text-neutral-600 space-y-2">
          <div>1) Сначала смотри <span className="font-semibold">Coaching Queue</span> - это кому идти на 1:1 и что горит.</div>
          <div>2) Нажми на агента - откроется <span className="font-semibold">Agent Intelligence</span> со скором/рисками/паттернами.</div>
          <div>3) Если нужно прогнать сразу команду/организацию: <span className="font-semibold">Batch Scoring</span> → Create Job → Run worker (x3) несколько раз, пока не станет 100%.</div>
        </div>
      </div>
    </div>
  );
}
