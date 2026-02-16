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

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return Number(n).toFixed(1);
}

function pill(label: string) {
  return (
    <span className="rounded-full border px-3 py-1 text-xs text-neutral-600">
      {label}
    </span>
  );
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

  const [batchScope, setBatchScope] = useState<"team" | "org">("team");
  const [batchRefId, setBatchRefId] = useState<string>("");
  const [batchWindow, setBatchWindow] = useState<number>(30);

  const [jobId, setJobId] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobErr, setJobErr] = useState<string | null>(null);

  const [autopilot, setAutopilot] = useState(true);

  async function load() {
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
      await load();
    } catch (e: any) {
      setJobErr(e?.message || "Failed to run worker");
    } finally {
      setJobLoading(false);
    }
  }

  useEffect(() => {
    const last = localStorage.getItem("talkscope_last_job_id");
    const ap = localStorage.getItem("talkscope_autopilot");
    if (last) {
      setJobId(last);
      fetchJobStatus(last);
    }
    if (ap === "0") setAutopilot(false);
  }, []);

  useEffect(() => {
    if (!autopilot) return;
    if (!jobId) return;

    const status = String(jobStatus?.job?.status ?? "");
    const queued = Number(jobStatus?.counts?.queued ?? 0);
    const done = Number(jobStatus?.counts?.done ?? 0);
    const total = Number(jobStatus?.counts?.total ?? 0);

    if (!(status === "queued" || status === "running")) return;
    if (queued <= 0) return;
    if (total > 0 && done >= total) return;
    if (jobLoading) return;

    const t = setTimeout(() => runWorkerOnce(), 2500);
    return () => clearTimeout(t);
  }, [autopilot, jobId, jobStatus, jobLoading]);

  useEffect(() => {
    load();
  }, [limit]);

  const stats = useMemo(() => data?.stats, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Operations Dashboard</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {pill(`Agents: ${stats?.totalAgents ?? 0}`)}
        {pill(`Conversations: ${stats?.conversationsCount ?? 0}`)}
        {pill(`Pattern reports: ${stats?.patternReportsCount ?? 0}`)}
        {pill(`Score snapshots: ${stats?.agentScoresCount ?? 0}`)}
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Batch Scoring</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <select value={batchScope} onChange={(e) => setBatchScope(e.target.value as any)} className="border rounded px-3 py-2">
            <option value="team">team</option>
            <option value="org">org</option>
          </select>

          <input
            className="border rounded px-3 py-2 w-[420px]"
            placeholder="refId"
            value={batchRefId}
            onChange={(e) => setBatchRefId(e.target.value)}
          />

          <select value={batchWindow} onChange={(e) => setBatchWindow(Number(e.target.value))} className="border rounded px-3 py-2">
            {[20, 30, 50].map((n) => (
              <option key={n} value={n}>window {n}</option>
            ))}
          </select>

          <button onClick={createBatch} disabled={jobLoading || !batchRefId.trim()} className="bg-black text-white px-4 py-2 rounded">
            {jobLoading ? "Working..." : "Create Job"}
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autopilot}
              onChange={(e) => {
                setAutopilot(e.target.checked);
                localStorage.setItem("talkscope_autopilot", e.target.checked ? "1" : "0");
              }}
            />
            Autopilot
          </label>
        </div>

        {jobStatus && (
          <div className="mt-4">
            <p>Status: {jobStatus?.job?.status}</p>
            <p>Progress: {jobStatus?.counts?.done} / {jobStatus?.counts?.total}</p>
          </div>
        )}
      </div>
    </div>
  );
}
