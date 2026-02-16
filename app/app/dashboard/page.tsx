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
  lowPerformers: { agentId: string; overall: number; communication: number; conversion: number; risk: number; coachingPriority: number; at: string }[];
};

type Org = { id: string; name: string; createdAt?: string; teamsCount?: number };
type Team = { id: string; name: string; organizationId: string; createdAt?: string; agentsCount?: number };

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

function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="hover:underline">
      {children}
    </a>
  );
}

async function readJsonSafe(r: Response) {
  const txt = await r.text();
  // частая проблема: сервер вернул HTML (error page) вместо JSON
  if (txt.trim().startsWith("<!DOCTYPE") || txt.trim().startsWith("<html")) {
    throw new Error(`Server returned HTML instead of JSON (status ${r.status}). Check route / deployment.`);
  }
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error(`Invalid JSON from server (status ${r.status}): ${txt.slice(0, 220)}`);
  }
}

export default function DashboardPage() {
  const [limit, setLimit] = useState(12);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Meta: orgs/teams
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaErr, setMetaErr] = useState<string | null>(null);

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Batch
  const [batchScope, setBatchScope] = useState<"team" | "org">("team");
  const [batchWindow, setBatchWindow] = useState<number>(30);

  const [jobId, setJobId] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobErr, setJobErr] = useState<string | null>(null);

  async function loadOverview() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/dashboard/overview?limit=${limit}`, { cache: "no-store" });
      const j = (await readJsonSafe(r)) as Overview;
      if (!j.ok) throw new Error("Dashboard API returned ok:false");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadOrgs() {
    setMetaLoading(true);
    setMetaErr(null);
    try {
      const r = await fetch(`/api/meta/orgs`, { cache: "no-store" });
      const j = await readJsonSafe(r);
      if (!j.ok) throw new Error(j.error || "meta/orgs returned ok:false");

      // нормализуем counts
      const list: Org[] = (j.orgs ?? []).map((x: any) => ({
        id: x.id,
        name: x.name,
        createdAt: x.createdAt,
        teamsCount: x?._count?.teams ?? x.teamsCount ?? 0,
      }));

      setOrgs(list);

      // автоселект 1-й org если пусто
      if (!selectedOrgId && list.length > 0) setSelectedOrgId(list[0].id);
    } catch (e: any) {
      setMetaErr(e?.message || "Failed to load orgs");
    } finally {
      setMetaLoading(false);
    }
  }

  async function loadTeams(orgId: string) {
    if (!orgId) {
      setTeams([]);
      setSelectedTeamId("");
      return;
    }

    setMetaLoading(true);
    setMetaErr(null);
    try {
      const r = await fetch(`/api/meta/teams?orgId=${encodeURIComponent(orgId)}`, { cache: "no-store" });
      const j = await readJsonSafe(r);
      if (!j.ok) throw new Error(j.error || "meta/teams returned ok:false");

      const list: Team[] = (j.teams ?? []).map((x: any) => ({
        id: x.id,
        name: x.name,
        organizationId: x.organizationId,
        createdAt: x.createdAt,
        agentsCount: x?._count?.agents ?? x.agentsCount ?? 0,
      }));

      setTeams(list);

      // если выбранная team не принадлежит org или пустая — выберем первую
      if (list.length === 0) {
        setSelectedTeamId("");
      } else if (!list.find((t) => t.id === selectedTeamId)) {
        setSelectedTeamId(list[0].id);
      }
    } catch (e: any) {
      setMetaErr(e?.message || "Failed to load teams");
    } finally {
      setMetaLoading(false);
    }
  }

  function getRefIdForBatch() {
    if (batchScope === "org") return selectedOrgId;
    return selectedTeamId;
  }

  async function createBatch() {
    const refId = getRefIdForBatch();
    if (!refId) {
      setJobErr("Pick organization/team first");
      return;
    }

    setJobLoading(true);
    setJobErr(null);
    try {
      const r = await fetch(`/api/batch/score/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: batchScope, refId, windowSize: batchWindow }),
      });

      const j = await readJsonSafe(r);
      if (!r.ok || !j.ok) throw new Error(j?.error || `Create job failed (${r.status})`);

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

  async function fetchJobStatus(id?: string) {
    const jid = (id ?? jobId).trim();
    if (!jid) return;

    setJobErr(null);
    try {
      const r = await fetch(`/api/batch/score/status?jobId=${encodeURIComponent(jid)}`, { cache: "no-store" });
      const j = await readJsonSafe(r);
      if (!r.ok || !j.ok) throw new Error(j?.error || `Status failed (${r.status})`);
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

      const j = await readJsonSafe(r);
      if (!r.ok || !j.ok) throw new Error(j?.error || `Worker failed (${r.status})`);

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
    if (last) setJobId(last);
  }, []);

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  useEffect(() => {
    loadOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTeams(selectedOrgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId]);

  useEffect(() => {
    if (jobId) fetchJobStatus(jobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const stats = useMemo(() => data?.stats, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-neutral-500">
            Coaching queue, risk signals, batch scoring, and performance overview.
          </p>
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

      {(err || metaErr) && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err ? <div>{err}</div> : null}
          {metaErr ? <div className={err ? "mt-2" : ""}>{metaErr}</div> : null}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {pill(`Agents: ${stats?.totalAgents ?? 0}`)}
        {pill(`Conversations: ${stats?.conversationsCount ?? 0}`)}
        {pill(`Pattern reports: ${stats?.patternReportsCount ?? 0}`)}
        {pill(`Score snapshots: ${stats?.agentScoresCount ?? 0}`)}
      </div>

      {/* Scope picker */}
      <div className="mt-6 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Scope</h2>
        <p className="mt-1 text-sm text-neutral-500">Choose org/team. Batch tools will use selected ids automatically.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Organization</div>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              disabled={metaLoading || orgs.length === 0}
            >
              {orgs.length === 0 ? <option value="">No orgs</option> : null}
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} - {o.id.slice(0, 8)}…
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-neutral-500">OrgId: <span className="font-mono">{selectedOrgId || "—"}</span></div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Team</div>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={metaLoading || teams.length === 0}
            >
              {teams.length === 0 ? <option value="">No teams in org</option> : null}
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} - {t.id.slice(0, 8)}…
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-neutral-500">TeamId: <span className="font-mono">{selectedTeamId || "—"}</span></div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              loadOrgs();
              if (selectedOrgId) loadTeams(selectedOrgId);
            }}
            className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
            disabled={metaLoading}
          >
            {metaLoading ? "Loading..." : "Reload orgs/teams"}
          </button>
        </div>
      </div>

      {/* Batch Scoring */}
      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Batch Scoring</h2>
            <p className="text-sm text-neutral-500">Create a job for selected scope. Then run worker in controlled steps.</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select className="rounded-lg border px-3 py-2 text-sm" value={batchScope} onChange={(e) => setBatchScope(e.target.value as any)}>
              <option value="team">team</option>
              <option value="org">org</option>
            </select>

            <select className="rounded-lg border px-3 py-2 text-sm" value={batchWindow} onChange={(e) => setBatchWindow(Number(e.target.value))}>
              {[20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  window {n}
                </option>
              ))}
            </select>

            <button
              onClick={createBatch}
              disabled={jobLoading || (batchScope === "org" ? !selectedOrgId : !selectedTeamId)}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {jobLoading ? "Working..." : "Create Job"}
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-neutral-500">
          Using refId:
          <span className="ml-2 rounded-md border bg-neutral-50 px-2 py-1 font-mono text-xs">
            {getRefIdForBatch() || "—"}
          </span>
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
            <div className="mt-2 flex flex-wrap gap-2">
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
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">
                      <RowLink href={`/app/agents/${encodeURIComponent(r.agentId)}`}>{r.agentId}</RowLink>
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
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">
                      <RowLink href={`/app/agents/${encodeURIComponent(r.agentId)}`}>{r.agentId}</RowLink>
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
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">
                      <RowLink href={`/app/agents/${encodeURIComponent(r.agentId)}`}>{r.agentId}</RowLink>
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
        <h2 className="text-lg font-semibold">Why this page matters</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Это операционный пульт: он не “рисует графики”, он запускает движок (batch scoring), показывает риск и очередь
          на коучинг. Следующий слой - автоматизация: “Run until done”, расписание, и роли (org/team access).
        </p>
      </div>
    </div>
  );
}
