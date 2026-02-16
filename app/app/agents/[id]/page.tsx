"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type TrendResp = {
  ok: boolean;
  agentId: string;
  count: number;
  last: number | null;
  prev: number | null;
  delta: number | null;
  direction: "up" | "down" | "flat";
  windowDelta: number | null;
  windowDirection: "up" | "down" | "flat";
  points: { t: string; score: number; windowSize: number }[];
};

type ScoreResp = {
  ok: boolean;
  savedId?: string;
  score?: {
    agent_id: string;
    window_size: number;
    overall_score: number;
    communication_score: number;
    conversion_score: number;
    risk_score: number;
    coaching_priority: number;
    strengths: string[];
    weaknesses: string[];
    key_patterns: string[];
  };
  error?: string;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  // поддержка , в PowerShell — но тут JS
  return Number(n).toFixed(1);
}

function badge(direction: "up" | "down" | "flat", delta: number | null) {
  if (direction === "up") return `▲ +${fmt(delta)}`;
  if (direction === "down") return `▼ ${fmt(delta)}`;
  return "—";
}

export default function AgentPage() {
  const params = useParams<{ id: string }>();
  const agentId = params?.id;

  const [windowSize, setWindowSize] = useState<number>(30);

  const [trend, setTrend] = useState<TrendResp | null>(null);
  const [latestScore, setLatestScore] = useState<ScoreResp["score"] | null>(null);

  const [loadingTrend, setLoadingTrend] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lastPoint = useMemo(() => trend?.points?.at(-1) ?? null, [trend]);

  async function loadTrend() {
    if (!agentId) return;
    setLoadingTrend(true);
    setErr(null);
    try {
      const r = await fetch(`/api/agents/score/history?agentId=${encodeURIComponent(agentId)}&limit=60`, {
        cache: "no-store",
      });
      const data = (await r.json()) as TrendResp;
      if (!data.ok) throw new Error("Trend API returned ok:false");
      setTrend(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load trend");
    } finally {
      setLoadingTrend(false);
    }
  }

  async function generateScore() {
    if (!agentId) return;
    setLoadingScore(true);
    setErr(null);
    try {
      const r = await fetch(`/api/agents/score/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize }),
      });
      const data = (await r.json()) as ScoreResp;
      if (!data.ok) throw new Error(data.error || "Failed to score agent");
      setLatestScore(data.score ?? null);
      // перезагрузим тренд, чтобы появилась новая точка
      await loadTrend();
    } catch (e: any) {
      setErr(e?.message || "Failed to generate score");
    } finally {
      setLoadingScore(false);
    }
  }

  useEffect(() => {
    loadTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Intelligence</h1>
          <p className="text-sm text-neutral-500">
            Agent ID: <span className="font-mono text-neutral-700">{agentId}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Window</span>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
            >
              {[20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateScore}
            disabled={loadingScore || !agentId}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loadingScore ? "Scoring..." : "Re-score"}
          </button>

          <button
            onClick={loadTrend}
            disabled={loadingTrend || !agentId}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loadingTrend ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-500">Overall</div>
            <div className="text-sm font-semibold">{trend ? badge(trend.direction, trend.delta) : "—"}</div>
          </div>
          <div className="mt-2 text-4xl font-semibold">{trend?.last ?? "—"}</div>
          <div className="mt-2 text-xs text-neutral-500">
            Last point: {lastPoint ? new Date(lastPoint.t).toLocaleString() : "—"}
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-neutral-500">Trend window</div>
          <div className="mt-2 text-2xl font-semibold">
            {trend?.windowDirection === "up" ? "Improving" : trend?.windowDirection === "down" ? "Declining" : "Stable"}
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Window delta: <span className="font-semibold">{fmt(trend?.windowDelta)}</span>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Points: <span className="font-mono">{trend?.count ?? 0}</span>
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-neutral-500">Quick actions</div>
          <div className="mt-3 space-y-2">
            <a
              href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId || "")}&windowSize=50`}
              className="block rounded-lg border px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Generate Patterns (Agent)
            </a>
            <a
              href="/app"
              className="block rounded-lg border px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Latest Scoring Snapshot</h2>
            <p className="text-sm text-neutral-500">Scores + signals from the last run (if executed on this page).</p>
          </div>
        </div>

        {!latestScore ? (
          <div className="mt-4 text-sm text-neutral-600">
            No local snapshot loaded yet. Click <span className="font-semibold">Re-score</span> to generate and display it
            here.
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Overall</div>
                <div className="mt-1 text-xl font-semibold">{fmt(latestScore.overall_score)}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Communication</div>
                <div className="mt-1 text-xl font-semibold">{fmt(latestScore.communication_score)}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Conversion</div>
                <div className="mt-1 text-xl font-semibold">{fmt(latestScore.conversion_score)}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Risk</div>
                <div className="mt-1 text-xl font-semibold">{fmt(latestScore.risk_score)}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Coaching Priority</div>
                <div className="mt-1 text-xl font-semibold">{fmt(latestScore.coaching_priority)}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border p-4">
                <div className="text-sm font-semibold">Strengths</div>
                <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                  {latestScore.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-neutral-400">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-sm font-semibold">Weaknesses</div>
                <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                  {latestScore.weaknesses.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-neutral-400">!</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-sm font-semibold">Key Patterns</div>
                <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                  {latestScore.key_patterns.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-neutral-400">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Trend points</h2>
        <p className="text-sm text-neutral-500">Raw points (for charts later). Now it helps validate the engine.</p>

        <div className="mt-3 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Score</th>
                <th className="px-3 py-2 text-left">Window</th>
              </tr>
            </thead>
            <tbody>
              {(trend?.points ?? []).map((p, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{new Date(p.t).toLocaleString()}</td>
                  <td className="px-3 py-2 font-semibold">{fmt(p.score)}</td>
                  <td className="px-3 py-2">{p.windowSize}</td>
                </tr>
              ))}
              {(!trend || trend.points.length === 0) && (
                <tr>
                  <td className="px-3 py-3 text-neutral-600" colSpan={3}>
                    No points yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
