"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type ScopeListResponse = {
  ok: boolean;
  orgs?: {
    id: string;
    name: string | null;
    createdAt: string;
    teams: { id: string; name: string | null; createdAt: string }[];
  }[];
  teams?: { id: string; name: string | null; organizationId: string | null; createdAt: string }[];
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

function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="hover:underline">
      {children}
    </a>
  );
}

export default function DashboardPage() {
  const [limit, setLimit] = useState(12);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ---- scope picker state (new) ----
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeErr, setScopeErr] = useState<string | null>(null);

  const [orgs, setOrgs] = useState<NonNullable<ScopeListResponse["orgs"]>>([]);
  const [batchScope, setBatchScope] = useState<"team" | "org">("team");

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const [batchRefId, setBatchRefId] = useState<string>(""); // set automatically
  const [batchWindow, setBatchWindow] = useState<number>(30);

  // ---- job state ----
  const [jobId, setJobId] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobErr, setJobErr] = useState<string | null>(null);

  const pollTimer = useRef<any>(null);

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

  async function loadScopes() {
    setScopeLoading(true);
    setScopeErr(null);
    try {
      const r = await fetch("/api/scope/list", { cache: "no-store" });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Scope list failed ${r.status}: ${txt.slice(0, 200)}`);

      const j = JSON.parse(txt) as ScopeListResponse;
      if (!j.ok) throw new Error("Scope list returned ok:false");

      // Primary path: orgs with teams
      if (j.orgs && j.orgs.length > 0) {
        setOrgs(j.orgs);

        // restore selection
        const savedOrg = localStorage.getItem("talkscope_selected_org") || "";
        const savedTeam = localStorage.getItem("talkscope_selected_team") || "";
        const savedScope = (localStorage.getItem("talkscope_batch_scope") as any) || "team";
        const savedWindow = Number(localStorage.getItem("talkscope_batch_window") || "30");

        if (savedScope === "org" || savedScope === "team") setBatchScope(savedScope);
        if ([20, 30, 50].includes(savedWindow)) setBatchWindow(savedWindow);

        const orgId = savedOrg && j.orgs.some((o) => o.id === savedOrg) ? savedOrg : j.orgs[0].id;
        setSelectedOrgId(orgId);

        const teams = (j.orgs.find((o) => o.id === orgId)?.teams ?? []);
        const teamId =
          savedTeam && teams.some((t) => t.id === savedTeam)
            ? savedTeam
            : teams[0]?.id || "";
        setSelectedTeamId(teamId);

        return;
      }

      // Fallback: teams only (older schema)
      if (j.teams && j.teams.length > 0) {
        // Convert to pseudo-org groups by organizationId
        const group = new Map<string, { id: string; name: string | null; createdAt: string; teams: any[] }>();
        for (const t of j.teams) {
          const oid = t.organizationId || "no-org";
          if (!group.has(oid)) {
            group.set(oid, { id: oid, name: oid === "no-org" ? "No organization" : oid, createdAt: t.createdAt, teams: [] });
          }
          group.get(oid)!.teams.push({ id: t.id, name: t.name, createdAt: t.createdAt });
        }
        const pseudo = Array.from(group.values());
        setOrgs(pseudo);

        const savedOrg = localStorage.getItem("talkscope_selected_org") || "";
        const savedTeam = localStorage.getItem("talkscope_selected_team") || "";
        const savedScope = (localStorage.getItem("talkscope_batch_scope") as any) || "team";
        const savedWindow = Number(localStorage.getItem("talkscope_batch_window") || "30");

        if (savedScope === "org" || savedScope === "team") setBatchScope(savedScope);
        if ([20, 30, 50].includes(savedWindow)) setBatchWindow(savedWindow);

        const orgId = savedOrg && pseudo.some((o) => o.id === savedOrg) ? savedOrg : pseudo[0].id;
        setSelectedOrgId(orgId);

        const teams = (pseudo.find((o) => o.id === orgId)?.teams ?? []);
        const teamId =
          savedTeam && teams.some((t) => t.id === savedTeam)
            ? savedTeam
            : teams[0]?.id || "";
        setSelectedTeamId(teamId);

        return;
      }

      setOrgs([]);
      setSelectedOrgId("");
      setSelectedTeamId("");
    } catch (e: any) {
      setScopeErr(e?.message || "Failed to load scopes");
    } finally {
      setScopeLoading(false);
    }
  }

  function clearPoll() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
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

      const st = String(j?.job?.status ?? "");
      if (st === "done" || st === "failed") clearPoll();
    } catch (e: any) {
      setJobErr(e?.message || "Failed to load batch status");
      clearPoll();
    }
  }

  function startPolling(jid: string) {
    clearPoll();
    pollTimer.current = setInterval(() => {
      fetchJobStatus(jid);
    }, 3000);
  }

  async function createBatch() {
    setJobLoading(true);
    setJobErr(null);
    try {
      const refId = batchScope === "org" ? selectedOrgId : selectedTeamId;
      if (!refId) throw new Error("Select a valid scope (org/team) first.");

      const r = await fetch(`/api/batch/score/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: batchScope, refId, windowSize: batchWindow }),
      });

      const txt = await r.text();
      if (!r.ok) throw new Error(`Create job failed ${r.status}: ${txt.slice(0, 200)}`);

      const j = JSON.parse(txt);
      if (!j.ok) throw new Error(j.error || "Create job failed");

      setJobId(j.jobId);
      localStorage.setItem("talkscope_last_job_id", j.jobId);

      await fetchJobStatus(j.jobId);
      startPolling(j.jobId);
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
      startPolling(jid);
      await loadOverview();
    } catch (e: any) {
      setJobErr(e?.message || "Failed to run worker");
    } finally {
      setJobLoading(false);
    }
  }

  // ---- initial load ----
  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  useEffect(() => {
    loadScopes();

    const last = typeof window !== "undefined" ? localStorage.getItem("talkscope_last_job_id") : "";
    if (last) {
      setJobId(last);
      fetchJobStatus(last);
      startPolling(last);
    }

    return () => clearPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- keep refId synced & persist selection ----
  useEffect(() => {
    if (!orgs || orgs.length === 0) return;

    localStorage.setItem("talkscope_batch_scope", batchScope);
    localStorage.setItem("talkscope_batch_window", String(batchWindow));
    if (selectedOrgId) localStorage.setItem("talkscope_selected_org", selectedOrgId);
    if (selectedTeamId) localStorage.setItem("talkscope_selected_team", selectedTeamId);

    const refId = batchScope === "org" ? selectedOrgId : selectedTeamId;
    setBatchRefId(refId || "");
  }, [batchScope, batchWindow, selectedOrgId, selectedTeamId, orgs]);

  // ---- if org changes, auto-pick first team ----
  useEffect(() => {
    if (!selectedOrgId) return;
    const teams = orgs.find((o) => o.id === selectedOrgId)?.teams ?? [];
    if (teams.length === 0) {
      setSelectedTeamId("");
      return;
    }
    if (!teams.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    }
  }, [selectedOrgId, orgs, selectedTeamId]);

  const stats = useMemo(() => data?.stats, [data]);
  const selectedOrg = useMemo(() => orgs.find((o) => o.id === selectedOrgId) || null, [orgs, selectedOrgId]);
  const teamsForOrg = selectedOrg?.teams ?? [];

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
            <p className="text-sm text-neutral-500">Run scoring for a whole team or org with controlled throughput.</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={batchScope}
              onChange={(e) => setBatchScope(e.target.value as any)}
              disabled={scopeLoading}
            >
              <option value="team">team</option>
              <option value="org">org</option>
            </select>

            <select
              className="rounded-lg border px-3 py-2 text-sm md:w-[320px]"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              disabled={scopeLoading || orgs.length === 0}
              title="Organization"
            >
              {orgs.length === 0 ? (
                <option value="">No orgs</option>
              ) : (
                orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {(o.name || "Organization") + " - " + o.id.slice(0, 8)}
                  </option>
                ))
              )}
            </select>

            <select
              className="rounded-lg border px-3 py-2 text-sm md:w-[320px]"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={scopeLoading || batchScope !== "team" || teamsForOrg.length === 0}
              title="Team"
            >
              {teamsForOrg.length === 0 ? (
                <option value="">{batchScope === "team" ? "No teams" : "Team disabled for org mode"}</option>
              ) : (
                teamsForOrg.map((t) => (
                  <option key={t.id} value={t.id}>
                    {(t.name || "Team") + " - " + t.id.slice(0, 8)}
                  </option>
                ))
              )}
            </select>

            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={batchWindow}
              onChange={(e) => setBatchWindow(Number(e.target.value))}
              disabled={scopeLoading}
            >
              {[20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  window {n}
                </option>
              ))}
            </select>

            <button
              onClick={createBatch}
              disabled={jobLoading || scopeLoading || !batchRefId}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {jobLoading ? "Working..." : "Create Job"}
            </button>
          </div>
        </div>

        {(scopeErr || jobErr) && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {scopeErr || jobErr}
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-neutral-500">Ref ID</div>
            <div className="mt-1 break-all font-mono text-xs">{batchRefId || "—"}</div>
            <div className="mt-3 text-xs text-neutral-500">Job ID</div>
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
        <h2 className="text-lg font-semibold">Next layer</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Далі зробимо автопрохід batch без ручного worker і “heatmap” по патернах: де саме система втрачає конверсію.
          <span className="font-semibold"> Після цього повернемось до Neon Auth або Clerk (multi-tenant ізоляція).</span>
        </p>
      </div>
    </div>
  );
}
