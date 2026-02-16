"use client";

import { useMemo, useState } from "react";

type Level = "agent" | "team" | "org";

type PatternReport = {
  window_size: number;
  level: string;
  ref_id: string;
  executive_summary: string;
  top_recurring_issues: Array<{
    issue: string;
    frequency_estimate: string;
    impact: string;
    evidence_examples: Array<{
      conversation_id: string;
      quote_or_moment: string;
      why_it_matters: string;
    }>;
    root_cause_hypotheses: string[];
    coaching_actions: string[];
    training_recommendations: string[];
  }>;
  quick_wins_next_7_days: string[];
  metrics_to_track: string[];
};

export default function PatternsPage() {
  const [level, setLevel] = useState<Level>("agent");
  const [refId, setRefId] = useState("");
  const [windowSize, setWindowSize] = useState(50);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PatternReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const canRun = useMemo(() => refId.trim().length > 5, [refId]);

  async function generate() {
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const r = await fetch("/api/patterns/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, refId: refId.trim(), windowSize }),
      });

      if (!r.ok) throw new Error(await r.text());
      const json = await r.json();
      setResult(json);
    } catch (e: any) {
      setError(e?.message || "Failed to generate patterns");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (level) qs.set("level", level);
      if (refId.trim()) qs.set("refId", refId.trim());
      qs.set("take", "20");

      const r = await fetch(`/api/patterns/list?${qs.toString()}`);
      if (!r.ok) throw new Error(await r.text());
      const rows = await r.json();
      setHistory(rows);
    } catch (e: any) {
      setError(e?.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Pattern Intelligence</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Generate recurring-issues report from a window of conversations. Evidence-first. Actionable coaching.
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Level</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
              >
                <option value="agent">Agent</option>
                <option value="team">Team</option>
                <option value="org">Organization</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">refId (Agent/Team/Org ID)</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                placeholder="Paste the id from Neon/Prisma Studio"
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Tip: start with Agent level and paste Agent.id. Window 20–50 works best for first signal.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Window size</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
              >
                <option value={20}>20 (fast)</option>
                <option value={50}>50 (balanced)</option>
                <option value={100}>100 (deep)</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end gap-3">
              <button
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={generate}
                disabled={!canRun || loading}
              >
                {loading ? "Generating..." : "Generate report"}
              </button>

              <button
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium"
                onClick={loadHistory}
                disabled={historyLoading}
              >
                {historyLoading ? "Loading..." : "Load saved reports"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm">
              <div className="text-xs text-zinc-500">
                Level: <span className="font-medium">{result.level}</span> · ref:{" "}
                <span className="font-medium">{result.ref_id}</span> · window:{" "}
                <span className="font-medium">{result.window_size}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold">Executive summary</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-800">{result.executive_summary}</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Top recurring issues</h2>

              <div className="mt-4 space-y-5">
                {result.top_recurring_issues.map((x, idx) => (
                  <div key={idx} className="rounded-2xl border border-zinc-200 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold">{x.issue}</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                        freq: {x.frequency_estimate}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                        impact: {x.impact}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-medium text-zinc-600">Evidence examples</div>
                        <div className="mt-2 space-y-2">
                          {x.evidence_examples.map((e, j) => (
                            <div key={j} className="rounded-xl bg-zinc-50 p-3">
                              <div className="text-xs text-zinc-500">Conversation: {e.conversation_id}</div>
                              <div className="mt-1 text-sm">{e.quote_or_moment}</div>
                              <div className="mt-1 text-xs text-zinc-600">{e.why_it_matters}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-zinc-600">Root cause hypotheses</div>
                          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-800">
                            {x.root_cause_hypotheses.map((h, j) => (
                              <li key={j}>{h}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-zinc-600">Coaching actions</div>
                          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-800">
                            {x.coaching_actions.map((a, j) => (
                              <li key={j}>{a}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-zinc-600">Training recommendations</div>
                          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-800">
                            {x.training_recommendations.map((t, j) => (
                              <li key={j}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Quick wins (7 days)</h2>
                <ul className="mt-3 list-disc pl-5 text-sm text-zinc-800">
                  {result.quick_wins_next_7_days.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Metrics to track</h2>
                <ul className="mt-3 list-disc pl-5 text-sm text-zinc-800">
                  {result.metrics_to_track.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-10 rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Saved reports</h2>
            <div className="mt-3 space-y-2 text-sm">
              {history.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2">
                  <div className="text-zinc-700">
                    <span className="font-medium">{r.level}</span> · {r.refId} · window {r.windowSize}
                  </div>
                  <div className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 text-xs text-zinc-500">
          Next: agent scoring + org roles + billing. We build layer-by-layer, but everything connects to the same data spine.
        </div>
      </div>
    </div>
  );
}
