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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const stats = useMemo(() => data?.stats, [data]);

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
            onClick={load}
            disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <a
            href="/app"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
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
        <h2 className="text-lg font-semibold">Next layer</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Далі ми зробимо batch-кнопку: <span className="font-semibold">Score All Agents</span> (team/org),
          і “heatmap” по патернах: де саме система втрачає конверсію.
        </p>
      </div>
    </div>
  );
}
