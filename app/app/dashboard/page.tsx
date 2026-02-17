"use client";

import { useEffect, useMemo, useState } from "react";

type OverviewRow = {
  agentId: string;
  agentName?: string | null;
  teamName?: string | null;
  orgName?: string | null;
  overall: number;
  communication?: number;
  conversion?: number;
  risk: number;
  coachingPriority?: number;
  at?: string;
};

type Overview = {
  ok: boolean;
  stats: {
    totalAgents: number;
    conversationsCount: number;
    patternReportsCount: number;
    agentScoresCount: number;
  };
  highRisk: OverviewRow[];
  coachingQueue: OverviewRow[];
  topPerformers: OverviewRow[];
  lowPerformers: OverviewRow[];
};

type OrgItem = {
  id: string;
  name: string;
  createdAt?: string;
  _count?: { teams?: number };
};

type TeamItem = {
  id: string;
  name: string;
  organizationId: string;
  createdAt?: string;
  _count?: { agents?: number };
};

type BatchStatus = {
  ok: boolean;
  job?: {
    id: string;
    scope: string;
    refId: string;
    windowSize: number;
    status: string;
    progress?: number;
    total?: number;
    percent?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  counts?: { done?: number; queued?: number; failed?: number; total?: number };
  lastFailed?: { agentId?: string; error?: string }[];
  error?: string;
};

function fmt(n: number | null | undefined, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(digits);
}

function pill(label: string) {
  return (
    <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">
      {label}
    </span>
  );
}

function ScoreCell({ value }: { value: number | null | undefined }) {
  return <span className="font-semibold">{fmt(value)}</span>;
}

function agentLabel(r: { agentId: string; agentName?: string | null; teamName?: string | null }) {
  const name = (r.agentName || "").trim();
  const team = (r.teamName || "").trim();
  if (name && team) return `${name} - ${team}`;
  if (name) return name;
  return r.agentId;
}

function humanizeFailure(msg: string) {
  const raw = msg || "";
  const s = raw.toLowerCase();

  if (s.includes("not enough conversations")) return "Not enough conversations for this window";
  if (s.includes("missing agentid")) return "Internal: agentId was not passed (UI bug)";
  if (s.includes("missing refid")) return "Internal: refId was not passed (UI bug)";
  if (s.includes("unexpected token") && s.includes("<!doctype")) return "Upstream returned HTML (server error/404)";
  if (s.includes("is not valid json")) return "Model returned invalid JSON (needs stricter parsing / retry)";
  if (s.includes("timeout")) return "Timeout while scoring";
  if (raw.length > 140) return raw.slice(0, 140) + "…";
  return raw;
}

async function safeJson<T = any>(r: Response): Promise<{ ok: boolean; json?: T; text: string; error?: string }> {
  const text = await r.text();
  try {
    const json = JSON.parse(text) as T;
    return { ok: true, json, text };
  } catch {
    // html / plaintext
    const trimmed = text.trim();
    if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
      return { ok: false, text, error: "Upstream returned HTML (likely 404/500)" };
    }
    return { ok: false, text, error: "Response is not valid JSON" };
  }
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function DashboardPage() {
  // overview
  const [limit, setLimit] = useState(12);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // scope meta
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaErr, setMetaErr] = useState<string | null>(null);

  // batch
  const [batchScope, setBatchScope] = useState<"team" | "org">("team");
  const [batchWindow, setBatchWindow] = useState<number>(30);

  const [jobId, setJobId] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<BatchStatus | null>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobErr, setJobErr] = useState<string | null>(null);

  const stats = useMemo(() => data?.stats, [data]);

  // derived refId
  const activeRefId = useMemo(() => {
    if (batchScope === "org") return orgId || "";
    return teamId || "";
  }, [batchScope, orgId, teamId]);

  async function loadOverview() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/dashboard/overview?limit=${limit}`, { cache: "no-store" });
      const parsed = await safeJson<Overview>(r);
      if (!r.ok) throw new Error(`Overview failed ${r.status}: ${parsed.error || parsed.text.slice(0, 160)}`);
      const j = parsed.json as Overview;
      if (!j?.ok) throw new Error("Dashboard API returned ok:false");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadMeta(initial = false) {
    setMetaLoading(true);
    setMetaErr(null);
    try {
      const r1 = await fetch(`/api/meta/orgs`, { cache: "no-store" });
      const p1 = await safeJson<{ ok: boolean; orgs: OrgItem[]; error?: string }>(r1);
      if (!r1.ok || !p1.ok || !p1.json?.ok) {
        throw new Error(`Orgs failed ${r1.status}: ${p1.error || p1.text.slice(0, 160)}`);
      }
      const listOrgs = p1.json.orgs || [];
      setOrgs(listOrgs);

      // choose org if none
      let nextOrgId = orgId;
      if (!nextOrgId && listOrgs.length) nextOrgId = listOrgs[0].id;

      // keep if still exists
      if (nextOrgId && !listOrgs.some((o) => o.id === nextOrgId)) {
        nextOrgId = listOrgs.length ? listOrgs[0].id : "";
      }
      if (nextOrgId !== orgId) setOrgId(nextOrgId);

      if (nextOrgId) {
        const r2 = await fetch(`/api/meta/teams?orgId=${encodeURIComponent(nextOrgId)}`, { cache: "no-store" });
        const p2 = await safeJson<{ ok: boolean; teams: TeamItem[]; error?: string }>(r2);
        if (!r2.ok || !p2.ok || !p2.json?.ok) {
          throw new Error(`Teams failed ${r2.status}: ${p2.error || p2.text.slice(0, 160)}`);
        }
        const listTeams = p2.json.teams || [];
        setTeams(listTeams);

        let nextTeamId = teamId;
        if (!nextTeamId && listTeams.length) nextTeamId = listTeams[0].id;
        if (nextTeamId && !listTeams.some((t) => t.id === nextTeamId)) {
          nextTeamId = listTeams.length ? listTeams[0].id : "";
        }
        if (nextTeamId !== teamId) setTeamId(nextTeamId);
      } else {
        setTeams([]);
        setTeamId("");
      }

      if (initial) {
        // restore last job id
        const last = typeof window !== "undefined" ? localStorage.getItem("talkscope_last_job_id") : "";
        if (last) {
          setJobId(last);
          // no await here, let UI mount first
          fetchJobStatus(last);
        }
      }
    } catch (e: any) {
      setMetaErr(e?.message || "Failed to load orgs/teams");
    } finally {
      setMetaLoading(false);
    }
  }

  async function onOrgChange(next: string) {
    setOrgId(next);
    setTeamId("");
    setTeams([]);
    setMetaErr(null);
    try {
      const r2 = await fetch(`/api/meta/teams?orgId=${encodeURIComponent(next)}`, { cache: "no-store" });
      const p2 = await safeJson<{ ok: boolean; teams: TeamItem[]; error?: string }>(r2);
      if (!r2.ok || !p2.ok || !p2.json?.ok) {
        throw new Error(`Teams failed ${r2.status}: ${p2.error || p2.text.slice(0, 160)}`);
      }
      const listTeams = p2.json.teams || [];
      setTeams(listTeams);
      if (listTeams.length) setTeamId(listTeams[0].id);
    } catch (e: any) {
      setMetaErr(e?.message || "Failed to load teams");
    }
  }

  async function createBatch() {
    setJobLoading(true);
    setJobErr(null);
    try {
      const refId = activeRefId.trim();
      if (!refId) throw new Error("Select org/team first (refId is empty)");

      const r = await fetch(`/api/batch/score/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: batchScope, refId, windowSize: batchWindow }),
      });

      const parsed = await safeJson<{ ok: boolean; jobId: string; error?: string }>(r);
      if (!r.ok || !parsed.ok) throw new Error(`Create job failed ${r.status}: ${parsed.error || parsed.text.slice(0, 160)}`);
      const j = parsed.json!;
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
      const parsed = await safeJson<BatchStatus>(r);
      if (!r.ok || !parsed.ok) throw new Error(`Status failed ${r.status}: ${parsed.error || parsed.text.slice(0, 160)}`);
      const j = parsed.json!;
      if (!j.ok) throw new Error(j.error || "Status failed");
      setJobStatus(j);
    } catch (e: any) {
      setJobErr(e?.message || "Failed to load batch status");
    }
  }

  async function runWorkerOnce(take = 6) {
    const jid = jobId.trim();
    if (!jid) return;

    setJobLoading(true);
    setJobErr(null);
    try {
      const r = await fetch(`/api/batch/score/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: jid, take }),
      });

      const parsed = await safeJson<{ ok: boolean; error?: string }>(r);
      if (!r.ok || !parsed.ok) throw new Error(`Worker failed ${r.status}: ${parsed.error || parsed.text.slice(0, 160)}`);
      if (!parsed.json?.ok) throw new Error(parsed.json?.error || "Worker failed");

      await fetchJobStatus(jid);
      await loadOverview();
    } catch (e: any) {
      setJobErr(e?.message || "Failed to run worker");
    } finally {
      setJobLoading(false);
    }
  }

  // main demo button: run until done / timeout
  async function runTo100() {
    const jid = jobId.trim();
    if (!jid) return;

    setJobLoading(true);
    setJobErr(null);

    const startedAt = Date.now();
    const maxMs = 90_000; // демо: 90 сек
    const take = 8; // быстрее, но не слишком

    try {
      // ensure we have fresh status before loop
      await fetchJobStatus(jid);

      while (Date.now() - startedAt < maxMs) {
        // read current snapshot from state is unreliable inside loop,
        // so re-fetch status each iteration and decide
        const rStatus = await fetch(`/api/batch/score/status?jobId=${encodeURIComponent(jid)}`, { cache: "no-store" });
        const pStatus = await safeJson<BatchStatus>(rStatus);
        if (!rStatus.ok || !pStatus.ok) throw new Error(`Status failed ${rStatus.status}: ${pStatus.error || pStatus.text.slice(0, 160)}`);
        const st = pStatus.json!;
        if (!st.ok) throw new Error(st.error || "Status failed");
        setJobStatus(st);

        const status = (st.job?.status || "").toLowerCase();
        const queued = Number(st.counts?.queued ?? 0);
        const total = Number(st.counts?.total ?? st.job?.total ?? 0);
        const done = Number(st.counts?.done ?? 0);
        const failed = Number(st.counts?.failed ?? 0);

        const isDone = status === "done" || (total > 0 && done + failed >= total) || queued === 0;
        if (isDone) break;

        // run worker
        const rRun = await fetch(`/api/batch/score/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: jid, take }),
        });
        const pRun = await safeJson<{ ok: boolean; error?: string }>(rRun);
        if (!rRun.ok || !pRun.ok) throw new Error(`Worker failed ${rRun.status}: ${pRun.error || pRun.text.slice(0, 160)}`);
        if (!pRun.json?.ok) throw new Error(pRun.json?.error || "Worker failed");

        await sleep(650);
      }

      await fetchJobStatus(jid);
      await loadOverview();
    } catch (e: any) {
      setJobErr(e?.message || "Failed to run to 100%");
    } finally {
      setJobLoading(false);
    }
  }

  useEffect(() => {
    loadMeta(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const progressPercent = useMemo(() => {
    const p = jobStatus?.job?.percent;
    if (typeof p === "number") return Math.max(0, Math.min(100, Math.round(p)));
    const done = Number(jobStatus?.counts?.done ?? 0);
    const failed = Number(jobStatus?.counts?.failed ?? 0);
    const total = Number(jobStatus?.counts?.total ?? jobStatus?.job?.total ?? 0);
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round(((done + failed) / total) * 100)));
  }, [jobStatus]);

  const countsLine = useMemo(() => {
    const done = Number(jobStatus?.counts?.done ?? 0);
    const queued = Number(jobStatus?.counts?.queued ?? 0);
    const failed = Number(jobStatus?.counts?.failed ?? 0);
    return `${done} done - ${queued} queued - ${failed} failed`;
  }, [jobStatus]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
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

      {/* Errors */}
      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
      )}

      {/* Stats */}
      <div className="mt-6 flex flex-wrap gap-2">
        {pill(`Agents: ${stats?.totalAgents ?? "—"}`)}
        {pill(`Conversations: ${stats?.conversationsCount ?? "—"}`)}
        {pill(`Pattern reports: ${stats?.patternReportsCount ?? "—"}`)}
        {pill(`Score snapshots: ${stats?.agentScoresCount ?? "—"}`)}
      </div>

      {/* Scope */}
      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Scope</h2>
            <p className="text-sm text-neutral-500">Select organization and team. Used by Batch Scoring below.</p>
          </div>

          <button
            onClick={() => loadMeta(false)}
            disabled={metaLoading}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
            title="Reload orgs and teams from DB"
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
              value={orgId}
              onChange={(e) => onOrgChange(e.target.value)}
              disabled={metaLoading || orgs.length === 0}
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
              disabled={metaLoading || teams.length === 0}
            >
              {teams.length === 0 ? (
                <option value="">No teams</option>
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
          Active refId for batch: <span className="font-mono">{activeRefId || "—"}</span>
        </div>
      </div>

      {/* Batch Scoring */}
      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Batch Scoring</h2>
            <p className="text-sm text-neutral-500">Create a job for selected scope - then run worker to completion.</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={batchScope}
              onChange={(e) => setBatchScope(e.target.value as any)}
              title="Scope determines which refId will be used: orgId or teamId"
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
              disabled={jobLoading || !activeRefId}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              title={!activeRefId ? "Select org/team first" : "Create a batch job"}
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

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => runTo100()}
                disabled={jobLoading || !jobId}
                className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                title="Run worker in steps until done (or timeout)"
              >
                {jobLoading ? "Running..." : "Run to 100%"}
              </button>

              <button
                onClick={() => runWorkerOnce(6)}
                disabled={jobLoading || !jobId}
                className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
                title="Advanced: run one worker step"
              >
                Run once (x6)
              </button>

              <button
                onClick={() => fetchJobStatus()}
                disabled={jobLoading || !jobId}
                className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
                title="Advanced: refresh status"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Progress</div>
            <div className="mt-2 text-2xl font-semibold">{progressPercent}%</div>
            <div className="mt-1 text-sm text-neutral-600">{countsLine}</div>
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
                    <div className="font-mono text-xs">{x.agentId || "—"}</div>
                    <div className="mt-1 text-xs text-neutral-600">{humanizeFailure(String(x.error || ""))}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main tables */}
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
                    <td className="px-3 py-2">
                      <a className="hover:underline" href={`/app/agents/${encodeURIComponent(r.agentId)}`}>
                        {agentLabel(r)}
                      </a>
                      <div className="text-xs text-neutral-500">{r.orgName ? `${r.orgName}${r.teamName ? ` - ${r.teamName}` : ""}` : ""}</div>
                    </td>
                    <td className="px-3 py-2"><ScoreCell value={r.coachingPriority ?? null} /></td>
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
                    <td className="px-3 py-2">
                      <a className="hover:underline" href={`/app/agents/${encodeURIComponent(r.agentId)}`}>
                        {agentLabel(r)}
                      </a>
                      <div className="text-xs text-neutral-500">{r.orgName ? `${r.orgName}${r.teamName ? ` - ${r.teamName}` : ""}` : ""}</div>
                    </td>
                    <td className="px-3 py-2"><ScoreCell value={r.risk} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.coachingPriority ?? null} /></td>
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
                    <td className="px-3 py-2">
                      <a className="hover:underline" href={`/app/agents/${encodeURIComponent(r.agentId)}`}>
                        {agentLabel(r)}
                      </a>
                      <div className="text-xs text-neutral-500">{r.orgName ? `${r.orgName}${r.teamName ? ` - ${r.teamName}` : ""}` : ""}</div>
                    </td>
                    <td className="px-3 py-2"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.communication ?? null} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.conversion ?? null} /></td>
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
                    <td className="px-3 py-2">
                      <a className="hover:underline" href={`/app/agents/${encodeURIComponent(r.agentId)}`}>
                        {agentLabel(r)}
                      </a>
                      <div className="text-xs text-neutral-500">{r.orgName ? `${r.orgName}${r.teamName ? ` - ${r.teamName}` : ""}` : ""}</div>
                    </td>
                    <td className="px-3 py-2"><ScoreCell value={r.overall} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.risk} /></td>
                    <td className="px-3 py-2"><ScoreCell value={r.coachingPriority ?? null} /></td>
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

      {/* Footer hint */}
      <div className="mt-6 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Next layer</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Дальше логично: авто-run для batch по расписанию + нормальные human-readable ошибки из воркера,
          чтобы “Last failures” был не стыдный даже в демо.
        </p>
      </div>
    </div>
  );
}
