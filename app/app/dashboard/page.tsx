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
  lowPerformers: { agentId: string; overall: number; communication?: number; conversion?: number; risk: number; coachingPriority: number; at: string }[];
};

type Org = {
  id: string;
  name: string;
  createdAt: string;
  teamsCount?: number;
};

type Team = {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  agentsCount?: number;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function pill(label: string) {
  return <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">{label}</span>;
}

function ScoreCell({ value }: { value: number }) {
  return <span className="font-semibold">{fmt(value)}</span>;
}

function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="hover:underline">
      {children}
    </a>
  );
}

// IMPORTANT: всегда absolute "/api/..." чтобы не получить HTML 404 (Unexpected token '<')
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...init });
  const txt = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 200)}`);
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${txt.slice(0, 120)}`);
  }
}

export default function DashboardPage() {
  const [limit, setLimit] = useState(12);

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ---- scope selectors ----
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");

  const [batchScope, setBatchScope] = useState<"team" | "org">("team");
  const [batchWindow, setBatchWindow] = useState<number>(30);

  const effectiveRefId = useMemo(() => {
    return batchScope === "org" ? orgId : teamId;
  }, [batchScope, orgId, teamId]);

  // ---- job state ----
  const [jobId, setJobId] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobErr, setJobErr] = useState<string | null>(null);

  async function loadOverview() {
    setLoading(true);
    setErr(null);
    try {
      const j = await fetchJson<Overview>(`/api/dashboard/overview?limit=${limit}`);
      if (!j.ok) throw new Error("Dashboard API returned ok:false");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadMetaOrgs() {
    const j = await fetchJson<{ ok: boolean; orgs: Org[] }>(`/api/meta/orgs`);
    if (!j.ok) throw new Error("meta/orgs returned ok:false");
    setOrgs(j.orgs || []);
    // если orgId пуст - выберем первый
    if (!orgId && (j.orgs || []).length > 0) {
      setOrgId(j.orgs[0].id);
    }
  }

  async function loadMetaTeams(forOrgId?: string) {
    const oid = (forOrgId ?? orgId).trim();
    const url = oid ? `/api/meta/teams?orgId=${encodeURIComponent(oid)}` : `/api/meta/teams`;
    const j = await fetchJson<{ ok: boolean; teams: Team[] }>(url);
    if (!j.ok) throw new Error("meta/teams returned ok:false");
    const list = j.teams || [];
    setTeams(list);

    // если teamId пуст - выберем первый для org
    if (batchScope === "team") {
      if (list.length > 0) {
        setTeamId((prev) => (prev ? prev : list[0].id));
      } else {
        setTeamId("");
      }
    }
  }

  async function fetchJobStatus(id?: string) {
    const jid = (id ?? jobId).trim();
    if (!jid) return;

    setJobErr(null);
    try {
      const j = await fetchJson<any>(`/api/batch/score/status?jobId=${encodeURIComponent(jid)}`);
      if (!j.ok) throw new Error(j.error || "Status failed");
      setJobStatus(j);
    } catch (e: any) {
      setJobErr(e?.message || "Failed to load batch status");
    }
  }

  async function createBatch() {
    setJobLoading(true);
    setJobErr(null);
    try {
      if (!effectiveRefId?.trim()) throw new Error("Select org/team first");

      const j = await fetchJson<any>(`/api/batch/score/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: batchScope, refId: effectiveRefId.trim(), windowSize: batchWindow }),
      });

      if (!j.ok) throw new Error(j.error || "Create job failed");

      setJobId(j.jobId);
      localStorage.setItem("talkscope_last_job_id", j.jobId);

      await fetchJobStatus(j.jobId);
      await loadOverview();
    } catch (e: any) {
      setJobErr(e?.message || "Failed to create batch job");
    } finally {
      setJobLoading(false);
    }
  }

  async function runWorkerOnce() {
    const jid = jobId.trim();
    if (!jid) return;

    setJobLoading(true);
    setJobErr(null);
    try {
      const j = await fetchJson<any>(`/api/batch/score/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: jid, take: 3 }),
      });

      if (!j.ok) throw new Error(j.error || "Worker failed");

      await fetchJobStatus(jid);
      await loadOverview();
    } catch (e: any) {
      setJobErr(e?.message || "Failed to run worker");
    } finally {
      setJobLoading(false);
    }
  }

  // init: last job id
  useEffect(() => {
    const last = typeof window !== "undefined" ? localStorage.getItem("talkscope_last_job_id") : "";
    if (last) {
      setJobId(last);
      fetchJobStatus(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // init: load overview + orgs
  useEffect(() => {
    loadOverview();
    loadMetaOrgs().catch((e) => setErr(e?.message || "Failed to load orgs"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // when org changes - reload teams
  useEffect(() => {
    if (!orgId) return;
    loadMetaTeams(orgId).catch((e) => setErr(e?.message || "Failed to load teams"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // when switching scope - ensure refId exists
  useEffect(() => {
    if (batchScope === "org") {
      // если org не выбран - выберем первый
      if (!orgId && orgs.length > 0) setOrgId(orgs[0].id);
    } else {
      // team scope
      if (!teamId && teams.length > 0) setTeamId(teams[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchScope]);

  const stats = useMemo(() => data?.stats, [data]);

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
            <select className="rounded-lg border px-3 py-2 text-sm" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {[8, 12, 20, 40].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button onClick={loadOverview} disabled={loading} className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50">
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <a href="/app" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
            Home
          </a>
        </div>
      </div>

      {err && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>}

      <div className="mt-6 flex flex-wrap gap-2">
        {pill(`Agents: ${stats?.totalAgents ?? 0}`)}
        {pill(`Conversations: ${stats?.conversationsCount ?? 0}`)}
        {pill(`Pattern reports: ${stats?.patternReportsCount ?? 0}`)}
        {pill(`Score snapshots: ${stats?.agentScoresCount ?? 0}`)}
      </div>

      {/* Org / Team selectors */}
      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Scope</h2>
            <p className="text-sm text-neutral-500">Select organization and team. Used by Batch Scoring below.</p>
          </div>

          <button
            onClick={async () => {
              try {
                setErr(null);
                await loadMetaOrgs();
                await loadMetaTeams(orgId);
              } catch (e: any) {
                setErr(e?.message || "Failed to reload orgs/teams");
              }
            }}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Reload orgs/teams
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Organization</div>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            >
              {orgs.length === 0 ? (
                <option value="">No orgs</option>
              ) : (
                orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Team</div>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={teams.length === 0}
            >
              {teams.length === 0 ? (
                <option value="">No teams for this org</option>
              ) : (
                teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-neutral-500">
          Active refId for batch:{" "}
          <span className="font-mono text-xs text-neutral-700">{effectiveRefId || "—"}</span>
        </div>
      </div>

      {/* Batch scoring */}
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
              disabled={jobLoading || !effectiveRefId?.trim()}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              title={!effectiveRefId?.trim() ? "Select org/team first" : ""}
            >
              {jobLoading ? "Working..." : "Create Job"}
            </button>
          </div>
        </div>

        {jobErr && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{jobErr}</div>}

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
                {(data?.coachingQueue ?? []).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">
                      <RowLink href={`/app/agents/${encodeURIComponent(r.agentId)}`}>{r.agentId}</RowLink>
                    </td>
                    <td className="px-3 py-2"><ScoreCell value={r.coachingPriority} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.risk} /></td>
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
                {(data?.highRisk ?? []).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">
                      <RowLink href={`/app/agents/${encodeURIComponent(r.agentId)}`}>{r.agentId}</RowLink>
                    </td>
                    <td className="px-3 py-2"><ScoreCell value={r.risk} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.coachingPriority} /></td>
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
                {(data?.topPerformers ?? []).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">
                      <RowLink href={`/app/agents/${encodeURIComponent(r.agentId)}`}>{r.agentId}</RowLink>
                    </td>
                    <td className="px-3 py-2"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.communication} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.conversion} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.risk} /></td>
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
                {(data?.lowPerformers ?? []).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">
                      <RowLink href={`/app/agents/${encodeURIComponent(r.agentId)}`}>{r.agentId}</RowLink>
                    </td>
                    <td className="px-3 py-2"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.risk} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.coachingPriority} /></td>
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
          <p>1) Выбери Organization, затем Team (если scope=team).</p>
          <p>2) В Batch Scoring выбери scope (team/org) и window (20/30/50).</p>
          <p>3) Нажми Create Job - появится Job ID и прогресс.</p>
          <p>4) Нажми Run worker (x3) несколько раз - он обработает задания порциями.</p>
          <p>5) Refresh - обновит таблицы коучинга/рисков и прогресс job.</p>
        </div>
      </div>
    </div>
  );
}
