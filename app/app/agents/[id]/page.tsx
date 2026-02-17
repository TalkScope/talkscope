"use client";

import { useEffect, useMemo, useState } from "react";

type AgentMeta = {
  id: string;
  name: string;
  email?: string | null;
  createdAt: string;
  team?: { id: string; name: string; organization?: { id: string; name: string } } | null;
};

type AgentScore = {
  createdAt: string;
  windowSize: number;
  overallScore: number;
  communicationScore: number;
  conversionScore: number;
  riskScore: number;
  coachingPriority: number;
  strengths: string; // JSON string or array stringified
  weaknesses: string;
  keyPatterns: string;
};

type ConversationItem = {
  id: string;
  createdAt: string;
  score?: number | null;
  excerpt?: string;
  transcript?: string;
};

type AgentApiResponse = {
  ok: boolean;
  agent?: AgentMeta;
  lastScore?: AgentScore | null;
  trend?: { createdAt: string; score: number; windowSize: number }[] | null;
  conversations?: ConversationItem[];
  lastPattern?: { id: string; createdAt: string; windowSize: number } | null;
  error?: string;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function safeJsonArray(v: any): string[] {
  try {
    const parsed = typeof v === "string" ? JSON.parse(v) : v;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function AgentPage({ params }: { params: { id: string } }) {
  const agentId = params?.id;

  const [windowSize, setWindowSize] = useState<number>(30);
  const [data, setData] = useState<AgentApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    if (!agentId) return;
    setLoading(true);
    setErr(null);
    try {
      // IMPORTANT: absolute /api
      const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, { cache: "no-store" });
      const txt = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 200)}`);

      const j = JSON.parse(txt) as AgentApiResponse;
      if (!j.ok) throw new Error(j.error || "Agent API returned ok:false");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load agent");
    } finally {
      setLoading(false);
    }
  }

  async function generateScore() {
    if (!agentId) return;
    setActionLoading(true);
    setActionMsg(null);
    setActionErr(null);
    try {
      const r = await fetch(`/api/agents/score/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Score failed ${r.status}: ${txt.slice(0, 200)}`);
      const j = JSON.parse(txt);
      if (!j.ok) throw new Error(j.error || "Score failed");
      setActionMsg("Score generated.");
      await load();
    } catch (e: any) {
      setActionErr(e?.message || "Failed to generate score");
    } finally {
      setActionLoading(false);
    }
  }

  async function generatePatterns() {
    if (!agentId) return;
    setActionLoading(true);
    setActionMsg(null);
    setActionErr(null);
    try {
      const r = await fetch(`/api/patterns/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: "agent", refId: agentId, windowSize }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Patterns failed ${r.status}: ${txt.slice(0, 200)}`);
      const j = JSON.parse(txt);
      if (!j.ok) throw new Error(j.error || "Patterns failed");
      setActionMsg("Pattern report generated.");
      // открыть Pattern Intelligence сразу с refId
      window.location.href = `/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=${encodeURIComponent(String(windowSize))}`;
    } catch (e: any) {
      setActionErr(e?.message || "Failed to generate patterns");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const header = useMemo(() => {
    const a = data?.agent;
    if (!a) return { title: "Agent Intelligence", sub: "" };
    const teamName = a.team?.name ? ` - ${a.team.name}` : "";
    const orgName = a.team?.organization?.name ? ` - ${a.team.organization.name}` : "";
    return { title: a.name || a.id, sub: `${a.id}${teamName}${orgName}` };
  }, [data]);

  const last = data?.lastScore;
  const strengths = safeJsonArray(last?.strengths);
  const weaknesses = safeJsonArray(last?.weaknesses);
  const keyPatterns = safeJsonArray(last?.keyPatterns);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{header.title}</h1>
          <p className="text-sm text-neutral-500">{header.sub}</p>
        </div>

        <div className="flex gap-2">
          <a href="/app/dashboard" className="rounded-lg border px-4 py-2 text-sm font-medium">Dashboard</a>
          <a href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=${encodeURIComponent(String(windowSize))}`}
             className="rounded-lg border px-4 py-2 text-sm font-medium">
            Pattern Intelligence
          </a>
          <button onClick={load} disabled={loading} className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">Window: {windowSize}</span>
        <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">Last overall: {fmt(last?.overallScore)}</span>
        <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">Risk: {fmt(last?.riskScore)}</span>
        <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">Priority: {fmt(last?.coachingPriority)}</span>
        <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">{data?.lastPattern ? "Has patterns" : "No patterns yet"}</span>
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Actions</h2>
            <p className="text-sm text-neutral-500">Generate fresh score snapshot or patterns without re-entering IDs.</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
            >
              {[20, 30, 50].map((n) => (
                <option key={n} value={n}>last {n}</option>
              ))}
            </select>

            <button
              onClick={generateScore}
              disabled={actionLoading}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Generate Score
            </button>

            <button
              onClick={generatePatterns}
              disabled={actionLoading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Generate Patterns (Agent)
            </button>
          </div>
        </div>

        {actionMsg && <div className="mt-4 rounded-xl border bg-neutral-50 p-3 text-sm text-neutral-800">{actionMsg}</div>}
        {actionErr && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionErr}</div>}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Latest Score Snapshot</h2>
          {!last ? (
            <p className="mt-2 text-sm text-neutral-600">No scores yet. Click Generate Score.</p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3"><div className="text-xs text-neutral-500">Overall</div><div className="text-xl font-semibold">{fmt(last.overallScore)}</div></div>
                <div className="rounded-xl border p-3"><div className="text-xs text-neutral-500">Risk</div><div className="text-xl font-semibold">{fmt(last.riskScore)}</div></div>
                <div className="rounded-xl border p-3"><div className="text-xs text-neutral-500">Communication</div><div className="text-xl font-semibold">{fmt(last.communicationScore)}</div></div>
                <div className="rounded-xl border p-3"><div className="text-xs text-neutral-500">Conversion</div><div className="text-xl font-semibold">{fmt(last.conversionScore)}</div></div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Strengths</div>
                <ul className="mt-2 list-disc pl-5">{strengths.slice(0, 6).map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Weaknesses</div>
                <ul className="mt-2 list-disc pl-5">{weaknesses.slice(0, 6).map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Key patterns</div>
                <ul className="mt-2 list-disc pl-5">{keyPatterns.slice(0, 6).map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Recent Conversations</h2>
          <p className="mt-1 text-sm text-neutral-500">Last 15 transcripts (excerpt).</p>

          <div className="mt-3 space-y-3">
            {(data?.conversations ?? []).length === 0 ? (
              <div className="rounded-xl border p-3 text-sm text-neutral-600">No conversations yet.</div>
            ) : (
              (data?.conversations ?? []).slice(0, 15).map((c) => (
                <div key={c.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-neutral-600">{c.id}</div>
                    <div className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 text-sm text-neutral-800 whitespace-pre-wrap">
                    {(c.excerpt || c.transcript || "").slice(0, 600)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
