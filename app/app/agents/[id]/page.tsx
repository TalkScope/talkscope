"use client";

import { useEffect, useMemo, useState } from "react";

type AgentMeta = {
  ok: boolean;
  agent: {
    id: string;
    name: string;
    email: string | null;
    createdAt: string;
    team: {
      id: string;
      name: string;
      organization: { id: string; name: string };
    };
    _count: { conversations: number };
  };
  lastScore: null | {
    createdAt: string;
    windowSize: number;
    overallScore: number;
    communicationScore: number;
    conversionScore: number;
    riskScore: number;
    coachingPriority: number;
    strengths: string;
    weaknesses: string;
    keyPatterns: string;
  };
  trend: { createdAt: string; score: number; windowSize: number }[];
  conversations: { id: string; createdAt: string; score: number | null; excerpt: string }[];
  lastPattern: null | { id: string; createdAt: string; windowSize: number };
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return Number(n).toFixed(1);
}

function badge(text: string) {
  return (
    <span className="rounded-full border px-3 py-1 text-xs text-neutral-600">
      {text}
    </span>
  );
}

function parseMaybeJson(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const j = JSON.parse(s);
    if (Array.isArray(j)) return j.map((x) => String(x));
    return [];
  } catch {
    return [];
  }
}

export default function AgentPage({ params }: { params: { id: string } }) {
  const agentId = decodeURIComponent(params.id);

  const [data, setData] = useState<AgentMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [windowSize, setWindowSize] = useState<number>(30);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, { cache: "no-store" });
      const j = (await r.json()) as AgentMeta;
      if (!j.ok) throw new Error((j as any).error || "Agent meta failed");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load agent");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const header = useMemo(() => {
    const a = data?.agent;
    if (!a) return null;
    return {
      name: a.name,
      team: a.team.name,
      org: a.team.organization.name,
      email: a.email,
      convCount: a._count.conversations,
    };
  }, [data]);

  const strengths = useMemo(() => parseMaybeJson(data?.lastScore?.strengths), [data]);
  const weaknesses = useMemo(() => parseMaybeJson(data?.lastScore?.weaknesses), [data]);
  const keyPatterns = useMemo(() => parseMaybeJson(data?.lastScore?.keyPatterns), [data]);

  async function generateScore() {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const r = await fetch(`/api/agents/score/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Score failed ${r.status}: ${txt.slice(0, 200)}`);
      setActionMsg("Score generated. Refreshing…");
      await load();
      setActionMsg("Done.");
    } catch (e: any) {
      setActionMsg(e?.message || "Failed to generate score");
    } finally {
      setActionLoading(false);
    }
  }

  function openPatterns() {
    window.location.href = `/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&window=${encodeURIComponent(String(windowSize))}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Intelligence</h1>
          <p className="text-sm text-neutral-500">
            Profile, score signals, conversation evidence, and coaching focus.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <a href="/app/dashboard" className="rounded-lg border px-4 py-2 text-sm font-medium">
            Back to Dashboard
          </a>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Header card */}
      <div className="mt-6 rounded-2xl border p-5">
        {!header ? (
          <div className="text-sm text-neutral-600">Loading…</div>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xl font-semibold">{header.name}</div>
              <div className="mt-1 text-sm text-neutral-600">
                {header.team} — {header.org}
              </div>
              {header.email && (
                <div className="mt-1 text-xs text-neutral-500">{header.email}</div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {badge(`Agent ID: ${agentId}`)}
                {badge(`Conversations: ${header.convCount}`)}
                {data?.lastScore ? badge(`Last score window: ${data.lastScore.windowSize}`) : badge("No score yet")}
                {data?.lastPattern ? badge(`Last pattern window: ${data.lastPattern.windowSize}`) : badge("No patterns yet")}
              </div>
            </div>

            <div className="flex flex-col gap-2 md:items-end">
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

              <div className="flex gap-2">
                <button
                  onClick={generateScore}
                  disabled={actionLoading}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {actionLoading ? "Working..." : "Generate Score"}
                </button>
                <button
                  onClick={openPatterns}
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                >
                  Generate Patterns
                </button>
              </div>

              {actionMsg && <div className="text-xs text-neutral-600">{actionMsg}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Score snapshot */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Latest Score Snapshot</h2>
          {!data?.lastScore ? (
            <div className="mt-2 text-sm text-neutral-600">No score yet. Click “Generate Score”.</div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Overall</div>
                <div className="mt-1 text-2xl font-semibold">{fmt(data.lastScore.overallScore)}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Coaching Priority</div>
                <div className="mt-1 text-2xl font-semibold">{fmt(data.lastScore.coachingPriority)}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Communication</div>
                <div className="mt-1 text-2xl font-semibold">{fmt(data.lastScore.communicationScore)}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Conversion</div>
                <div className="mt-1 text-2xl font-semibold">{fmt(data.lastScore.conversionScore)}</div>
              </div>
              <div className="rounded-xl border p-3 col-span-2">
                <div className="text-xs text-neutral-500">Risk</div>
                <div className="mt-1 text-2xl font-semibold">{fmt(data.lastScore.riskScore)}</div>
                <div className="mt-2 text-xs text-neutral-500">
                  Snapshot at: {new Date(data.lastScore.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Coaching Focus</h2>

          <div className="mt-4 grid gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-sm font-semibold">Strengths</div>
              <div className="mt-2 space-y-1 text-sm text-neutral-700">
                {strengths.length === 0 ? (
                  <div className="text-neutral-600">—</div>
                ) : (
                  strengths.slice(0, 6).map((x, i) => <div key={i}>• {x}</div>)
                )}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm font-semibold">Weaknesses</div>
              <div className="mt-2 space-y-1 text-sm text-neutral-700">
                {weaknesses.length === 0 ? (
                  <div className="text-neutral-600">—</div>
                ) : (
                  weaknesses.slice(0, 6).map((x, i) => <div key={i}>• {x}</div>)
                )}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm font-semibold">Key Patterns</div>
              <div className="mt-2 space-y-1 text-sm text-neutral-700">
                {keyPatterns.length === 0 ? (
                  <div className="text-neutral-600">—</div>
                ) : (
                  keyPatterns.slice(0, 6).map((x, i) => <div key={i}>• {x}</div>)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent conversations */}
      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Conversations</h2>
          <span className="text-xs text-neutral-500">Latest 15</span>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Conversation</th>
                <th className="px-3 py-2 text-left">Score</th>
                <th className="px-3 py-2 text-left">Excerpt</th>
              </tr>
            </thead>
            <tbody>
              {(data?.conversations ?? []).map((c) => (
                <tr key={c.id} className="border-t align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-neutral-500">
                    {new Date(c.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                  <td className="px-3 py-2 font-semibold">{fmt(c.score)}</td>
                  <td className="px-3 py-2 text-neutral-700">
                    {c.excerpt}
                    {c.excerpt.length >= 220 ? "…" : ""}
                  </td>
                </tr>
              ))}
              {!data || (data.conversations ?? []).length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-neutral-600" colSpan={4}>
                    No conversations yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-neutral-500">
          Это “доказательная база”: менеджер видит реальные фрагменты разговоров и понимает, почему система дала такой score и какие паттерны повторяются.
        </div>
      </div>
    </div>
  );
}
