"use client";

import { useEffect, useMemo, useState } from "react";

type AgentMeta = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  teamName: string;
  orgName: string;
  team: null | {
    id: string;
    name: string;
    organization: null | { id: string; name: string };
  };
};

type AgentScore = {
  createdAt: string;
  windowSize: number;
  overallScore: number;
  communicationScore: number;
  conversionScore: number;
  riskScore: number;
  coachingPriority: number;
  strengths: string[];
  weaknesses: string[];
  keyPatterns: string[];
};

type TrendPoint = { createdAt: string; score: number; windowSize: number };

type Conv = {
  id: string;
  createdAt: string;
  score: number | null;
  excerpt: string;
  transcript: string;
};

type AgentPayload = {
  ok: boolean;
  agent: AgentMeta;
  lastScore: AgentScore | null;
  trend: TrendPoint[];
  conversations: Conv[];
  lastPattern: null | { id: string; createdAt: string; windowSize: number };
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return Number(n).toFixed(0);
}

function badge(text: string) {
  return (
    <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">
      {text}
    </span>
  );
}

export default function AgentPage({ params }: { params: { id: string } }) {
  const agentId = decodeURIComponent(params.id);

  const [data, setData] = useState<AgentPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [win, setWin] = useState(30);
  const [runLoading, setRunLoading] = useState(false);
  const [runErr, setRunErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, {
        cache: "no-store",
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 200)}`);
      const j = JSON.parse(txt) as AgentPayload;
      if (!j.ok) throw new Error("API returned ok:false");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load agent");
    } finally {
      setLoading(false);
    }
  }

  // Generate score snapshot for this agent
  async function generateScore() {
    setRunLoading(true);
    setRunErr(null);
    try {
      const r = await fetch(`/api/agents/score/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize: win }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Score failed ${r.status}: ${txt.slice(0, 200)}`);
      const j = JSON.parse(txt);
      if (!j.ok) throw new Error(j.error || "Score failed");
      await load();
    } catch (e: any) {
      setRunErr(e?.message || "Failed to generate score");
    } finally {
      setRunLoading(false);
    }
  }

  // Generate patterns for this agent (stores PatternReport in DB)
  async function generatePatterns() {
    setRunLoading(true);
    setRunErr(null);
    try {
      const r = await fetch(`/api/patterns/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: "agent", refId: agentId, windowSize: win }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Patterns failed ${r.status}: ${txt.slice(0, 200)}`);
      const j = JSON.parse(txt);
      if (!j.ok) throw new Error(j.error || "Patterns failed");

      // Go to patterns page with params (so no manual refId)
      window.location.href = `/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}`;
    } catch (e: any) {
      setRunErr(e?.message || "Failed to generate patterns");
    } finally {
      setRunLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const header = useMemo(() => {
    const a = data?.agent;
    if (!a) return { title: "Agent Intelligence", sub: agentId };
    const team = a.teamName ? ` — ${a.teamName}` : "";
    const org = a.orgName ? ` (${a.orgName})` : "";
    return {
      title: `${a.name}${team}${org}`,
      sub: `Agent ID: ${a.id}`,
    };
  }, [data, agentId]);

  const s = data?.lastScore;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{header.title}</h1>
          <p className="text-sm text-neutral-500">{header.sub}</p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <a href="/app/dashboard" className="rounded-lg border px-4 py-2 text-sm font-medium">
            Dashboard
          </a>
          <a href="/app/patterns" className="rounded-lg border px-4 py-2 text-sm font-medium">
            Pattern Intelligence
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

      <div className="mt-6 flex flex-wrap gap-2">
        {badge(`Window: ${win}`)}
        {badge(`Last score: ${s ? fmt(s.overallScore) : "—"}`)}
        {badge(`Risk: ${s ? fmt(s.riskScore) : "—"}`)}
        {badge(`Priority: ${s ? fmt(s.coachingPriority) : "—"}`)}
        {data?.lastPattern ? badge(`Last patterns: ${new Date(data.lastPattern.createdAt).toLocaleString()}`) : badge("No patterns yet")}
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Actions</h2>
            <p className="text-sm text-neutral-500">
              Generate fresh score snapshot and pattern report without re-entering IDs.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={win}
              onChange={(e) => setWin(Number(e.target.value))}
            >
              {[20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  last {n}
                </option>
              ))}
            </select>

            <button
              onClick={generateScore}
              disabled={runLoading}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {runLoading ? "Working..." : "Generate Score"}
            </button>

            <button
              onClick={generatePatterns}
              disabled={runLoading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {runLoading ? "Working..." : "Generate Patterns (Agent)"}
            </button>
          </div>
        </div>

        {runErr && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {runErr}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Latest Score Snapshot</h2>
          {!s ? (
            <p className="mt-2 text-sm text-neutral-600">No scores yet. Click Generate Score.</p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                {badge(`Overall: ${fmt(s.overallScore)}`)}
                {badge(`Communication: ${fmt(s.communicationScore)}`)}
                {badge(`Conversion: ${fmt(s.conversionScore)}`)}
                {badge(`Risk: ${fmt(s.riskScore)}`)}
                {badge(`Coaching priority: ${fmt(s.coachingPriority)}`)}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-neutral-500">Strengths</div>
                  <ul className="mt-2 list-disc pl-5">
                    {(s.strengths ?? []).slice(0, 6).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-neutral-500">Weaknesses</div>
                  <ul className="mt-2 list-disc pl-5">
                    {(s.weaknesses ?? []).slice(0, 6).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-neutral-500">Key Patterns</div>
                <ul className="mt-2 list-disc pl-5">
                  {(s.keyPatterns ?? []).slice(0, 6).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Recent Conversations</h2>
          <p className="mt-1 text-sm text-neutral-500">Last 15 transcripts (excerpt).</p>

          <div className="mt-3 space-y-3">
            {(data?.conversations ?? []).length === 0 ? (
              <div className="text-sm text-neutral-600">No conversations yet.</div>
            ) : (
              (data?.conversations ?? []).map((c) => (
                <div key={c.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs text-neutral-600">{c.id}</div>
                    <div className="text-xs text-neutral-500">
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-neutral-800">{c.excerpt}...</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
