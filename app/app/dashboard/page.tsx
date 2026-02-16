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
  highRisk: any[];
  coachingQueue: any[];
  topPerformers: any[];
  lowPerformers: any[];
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return Number(n).toFixed(1);
}

export default function DashboardPage() {
  const [limit, setLimit] = useState(12);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [batchScope, setBatchScope] = useState<"team" | "org">("team");
  const [batchRefId, setBatchRefId] = useState("");
  const [batchWindow, setBatchWindow] = useState(30);

  const [jobId, setJobId] = useState("");
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobErr, setJobErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/dashboard/overview?limit=${limit}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!j.ok) throw new Error("Dashboard API error");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function createBatch() {
    setJobLoading(true);
    setJobErr(null);
    try {
      const r = await fetch(`/api/batch/score/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: batchScope,
          refId: batchRefId.trim(),
          windowSize: batchWindow,
        }),
      });

      const txt = await r.text();
      if (!r.ok) throw new Error(txt.slice(0, 200));

      const j = JSON.parse(txt);
      if (!j.ok) throw new Error(j.error || "Create job failed");

      setJobId(j.jobId);
      localStorage.setItem("talkscope_last_job_id", j.jobId);
      await fetchJobStatus(j.jobId);
    } catch (e: any) {
      setJobErr(e?.message || "Batch failed");
    } finally {
      setJobLoading(false);
    }
  }

  async function fetchJobStatus(id?: string) {
    const jid = id ?? jobId;
    if (!jid) return;

    try {
      const r = await fetch(
        `/api/batch/score/status?jobId=${encodeURIComponent(jid)}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Status failed");
      setJobStatus(j);
    } catch (e: any) {
      setJobErr(e?.message || "Status error");
    }
  }

  async function runWorkerOnce() {
    if (!jobId) return;

    setJobLoading(true);
    setJobErr(null);

    try {
      const r = await fetch(`/api/batch/score/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, take: 3 }),
      });

      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Worker failed");

      await fetchJobStatus(jobId);
      await load();
    } catch (e: any) {
      setJobErr(e?.message || "Worker error");
    } finally {
      setJobLoading(false);
    }
  }

  useEffect(() => {
    const last = localStorage.getItem("talkscope_last_job_id");
    if (last) {
      setJobId(last);
      fetchJobStatus(last);
    }
    load();
  }, [limit]);

  const stats = useMemo(() => data?.stats, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Operations Dashboard</h1>

      {err && <div className="mt-4 text-red-600">{err}</div>}

      {/* STATS */}
      <div className="mt-4 flex gap-3 text-sm">
        <span>Agents: {stats?.totalAgents ?? 0}</span>
        <span>Conversations: {stats?.conversationsCount ?? 0}</span>
        <span>Pattern reports: {stats?.patternReportsCount ?? 0}</span>
        <span>Score snapshots: {stats?.agentScoresCount ?? 0}</span>
      </div>

      {/* BATCH PANEL */}
      <div className="mt-6 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Batch Scoring</h2>

        <div className="mt-4 flex flex-wrap gap-3 relative">

          {/* SCOPE */}
          <select
            className="relative z-10 cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm"
            value={batchScope}
            onChange={(e) => setBatchScope(e.target.value as any)}
          >
            <option value="team">team</option>
            <option value="org">org</option>
          </select>

          {/* REF ID */}
          <input
            className="relative z-10 rounded-lg border bg-white px-3 py-2 text-sm w-[360px]"
            placeholder="teamId or orgId"
            value={batchRefId}
            onChange={(e) => setBatchRefId(e.target.value)}
          />

          {/* WINDOW */}
          <select
            className="relative z-10 cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm"
            value={batchWindow}
            onChange={(e) => setBatchWindow(Number(e.target.value))}
          >
            <option value={20}>window 20</option>
            <option value={30}>window 30</option>
            <option value={50}>window 50</option>
          </select>

          <button
            onClick={createBatch}
            disabled={jobLoading || !batchRefId}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {jobLoading ? "Working..." : "Create Job"}
          </button>
        </div>

        {jobErr && <div className="mt-3 text-red-600">{jobErr}</div>}

        {/* JOB STATUS */}
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <div className="text-xs text-neutral-500">Job ID</div>
            <div className="font-mono text-xs">{jobId || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-neutral-500">Progress</div>
            <div className="text-lg font-semibold">
              {jobStatus?.job?.percent ?? 0}%
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchJobStatus()}
              className="rounded border px-3 py-1"
            >
              Refresh
            </button>

            <button
              onClick={runWorkerOnce}
              className="rounded border px-3 py-1"
            >
              Run worker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
