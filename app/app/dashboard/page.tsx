"use client";

import { useEffect, useState } from "react";

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

async function safeJson(res: Response) {
  const txt = await res.text();
  try {
    return { ok: res.ok, json: JSON.parse(txt), raw: txt };
  } catch {
    return { ok: res.ok, json: null, raw: txt };
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [orgId, setOrgId] = useState("");
  const [teamId, setTeamId] = useState("");

  const [windowSize, setWindowSize] = useState(30);
  const [job, setJob] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- LOAD DASHBOARD ----------
  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const r = await fetch(`/api/dashboard/overview`, { cache: "no-store" });
      const { ok, json, raw } = await safeJson(r);
      if (!ok) throw new Error(raw.slice(0, 200));
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------- LOAD ORGS ----------
  async function loadOrgs() {
    const r = await fetch(`/api/meta/orgs`, { cache: "no-store" });
    const { json } = await safeJson(r);
    setOrgs(json?.orgs || []);
  }

  // ---------- LOAD TEAMS ----------
  async function loadTeams(id: string) {
    if (!id) return;
    const r = await fetch(`/api/meta/teams?orgId=${id}`, { cache: "no-store" });
    const { json } = await safeJson(r);
    setTeams(json?.teams || []);
  }

  // ---------- CREATE JOB ----------
  async function createJob() {
    if (!teamId) return;

    setError(null);

    try {
      const r = await fetch(`/api/batch/score/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "team", refId: teamId, windowSize }),
      });

      const { ok, json, raw } = await safeJson(r);
      if (!ok) throw new Error(raw.slice(0, 200));

      setJob(json);
    } catch (e: any) {
      setError(e.message);
    }
  }

  // ---------- RUN WORKER ----------
  async function runWorker() {
    if (!job?.jobId) return;

    const r = await fetch(`/api/batch/score/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.jobId }),
    });

    const { json } = await safeJson(r);
    setJob(json);
    loadDashboard();
  }

  useEffect(() => {
    loadDashboard();
    loadOrgs();
  }, []);

  useEffect(() => {
    loadTeams(orgId);
  }, [orgId]);

  return (
    <div className="mx-auto max-w-6xl p-6">

      <h1 className="text-2xl font-semibold">Operations Dashboard</h1>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ---------- STATS ---------- */}
      <div className="mt-4 flex gap-3 text-sm">
        <div className="border rounded-full px-3 py-1">Agents: {data?.stats?.agents ?? "—"}</div>
        <div className="border rounded-full px-3 py-1">Conversations: {data?.stats?.conversations ?? "—"}</div>
        <div className="border rounded-full px-3 py-1">Pattern reports: {data?.stats?.patterns ?? "—"}</div>
        <div className="border rounded-full px-3 py-1">Score snapshots: {data?.stats?.scores ?? "—"}</div>
      </div>

      {/* ---------- SCOPE ---------- */}
      <div className="mt-6 border rounded-xl p-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Scope</h2>

          <button
            onClick={() => {
              loadOrgs();
              loadTeams(orgId);
            }}
            className="border rounded-lg px-3 py-1 text-sm"
          >
            Reload orgs/teams
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">

          <select
            className="border rounded-lg p-2"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          >
            <option value="">Select org</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg p-2"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
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

      {/* ---------- BATCH ---------- */}
      <div className="mt-6 border rounded-xl p-4">

        <div className="flex gap-3 items-center justify-between">

          <h2 className="font-semibold">Batch Scoring</h2>

          <div className="flex gap-2">
            <select
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              className="border rounded-lg px-2 py-1"
            >
              <option value={20}>window 20</option>
              <option value={30}>window 30</option>
              <option value={50}>window 50</option>
            </select>

            <button
              disabled={!teamId}
              onClick={createJob}
              className="bg-black text-white rounded-lg px-4 py-1 disabled:opacity-40"
            >
              Create Job
            </button>
          </div>
        </div>

        {job && (
          <div className="mt-4 text-sm">
            <div>Job: {job.jobId}</div>
            <div>Status: {job.status}</div>

            <button
              onClick={runWorker}
              className="mt-2 border rounded-lg px-3 py-1"
            >
              Run worker
            </button>
          </div>
        )}
      </div>

      {/* ---------- COACHING QUEUE ---------- */}
      <div className="mt-6 border rounded-xl p-4">
        <h2 className="font-semibold">Coaching Queue</h2>

        <div className="mt-3 space-y-2">
          {data?.queue?.map((a: any) => (
            <div key={a.agentId} className="border rounded-lg p-3 flex justify-between">

              <a href={`/app/agents/${a.agentId}`} className="font-medium hover:underline">
                {a.agentName || a.agentId}
              </a>

              <div className="flex gap-4 text-sm">
                <div>Priority: {fmt(a.priority)}</div>
                <div>Overall: {fmt(a.overall)}</div>
                <div>Risk: {fmt(a.risk)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- HIGH RISK ---------- */}
      <div className="mt-6 border rounded-xl p-4">
        <h2 className="font-semibold">High Risk</h2>

        <div className="mt-3 space-y-2">
          {data?.highRisk?.map((a: any) => (
            <div key={a.agentId} className="border rounded-lg p-3 flex justify-between">

              <a href={`/app/agents/${a.agentId}`} className="font-medium hover:underline">
                {a.agentName || a.agentId}
              </a>

              <div className="flex gap-4 text-sm">
                <div>Risk: {fmt(a.risk)}</div>
                <div>Overall: {fmt(a.overall)}</div>
                <div>Priority: {fmt(a.priority)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
