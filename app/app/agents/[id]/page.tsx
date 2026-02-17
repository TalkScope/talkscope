"use client";

import { useEffect, useMemo, useState } from "react";

type AgentMeta = {
  id: string;
  name?: string;
  email?: string | null;
  createdAt?: string;
  team?: { id: string; name: string; organization?: { id: string; name: string } } | null;
};

type ScoreSnapshot = {
  createdAt: string;
  windowSize: number;
  overallScore: number;
  communicationScore: number;
  conversionScore: number;
  riskScore: number;
  coachingPriority: number;
  strengths?: any;
  weaknesses?: any;
  keyPatterns?: any;
};

type TrendPoint = { createdAt: string; score: number; windowSize: number };

type ConversationItem = {
  id: string;
  createdAt: string;
  score?: number | null;
  transcript?: string;
  excerpt?: string;
};

type ApiAgentResp = {
  ok: boolean;
  error?: string;
  agent?: AgentMeta;
  lastScore?: ScoreSnapshot | null;
  trend?: TrendPoint[] | TrendPoint | null;
  conversations?: ConversationItem[];
  lastPattern?: { id: string; createdAt: string; windowSize: number } | null;
};

function fmt(n: number | null | undefined, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(digits);
}

function pill(label: string) {
  return <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">{label}</span>;
}

function safeJsonParse<T = any>(v: any): T | null {
  try {
    if (v === null || v === undefined) return null;
    if (typeof v === "object") return v as T;
    const s = String(v);
    if (!s.trim()) return null;
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function safeArr(v: any): any[] {
  const p = safeJsonParse<any>(v);
  if (Array.isArray(p)) return p;
  if (Array.isArray(v)) return v;
  return [];
}

function smartTrim(s: string, max = 520) {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return { text: t, cut: false };

  let chunk = t.slice(0, max);

  const lastBreak = Math.max(
    chunk.lastIndexOf(". "),
    chunk.lastIndexOf("! "),
    chunk.lastIndexOf("? "),
    chunk.lastIndexOf("\n"),
    chunk.lastIndexOf(" ")
  );

  if (lastBreak > 120) chunk = chunk.slice(0, lastBreak + 1);
  return { text: chunk.trim(), cut: true };
}

async function fetchJsonOrThrow(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  const txt = await r.text();

  // Частая ошибка: сервер/маршрут отдает HTML (<!DOCTYPE...) вместо JSON
  if (txt.trim().startsWith("<")) {
    throw new Error(`Unexpected HTML response from ${url} (route probably not deployed or wrong path)`);
  }

  let j: any = null;
  try {
    j = JSON.parse(txt);
  } catch {
    throw new Error(`Failed to parse JSON from ${url}: ${txt.slice(0, 180)}`);
  }

  if (!r.ok) {
    throw new Error(`HTTP ${r.status}: ${j?.error || txt.slice(0, 180)}`);
  }
  return j;
}

export default function AgentPage({ params }: { params: { id: string } }) {
  const agentId = decodeURIComponent(params.id || "").trim();

  const [data, setData] = useState<ApiAgentResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [windowSize, setWindowSize] = useState<number>(30);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    if (!agentId) return;
    setLoading(true);
    setErr(null);
    setActionMsg(null);
    setActionErr(null);
    try {
      const j = (await fetchJsonOrThrow(`/api/meta/agent?id=${encodeURIComponent(agentId)}`)) as ApiAgentResp;
      if (!j?.ok) throw new Error(j?.error || "Agent API returned ok:false");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load agent");
      setData(null);
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
    const agentName = a?.name?.trim() || agentId;
    const teamName = a?.team?.name?.trim();
    const orgName = a?.team?.organization?.name?.trim();

    return {
      agentName,
      subtitle: [teamName, orgName].filter(Boolean).join(" — "),
    };
  }, [data, agentId]);

  const lastScore = data?.lastScore ?? null;

  async function generateScore() {
  setActionLoading(true);
  setActionErr(null);
  setActionMsg(null);

  try {
    const payload = {
      agentId,          // ✅ основной ключ
      refId: agentId,   // ✅ запасной ключ (если у тебя где-то ожидают refId)
      windowSize,
    };

    const r = await fetch(`/api/agents/score/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const txt = await r.text();
    if (!r.ok) throw new Error(`Score failed ${r.status}: ${txt.slice(0, 220)}`);

    const j = JSON.parse(txt);
    if (!j.ok) throw new Error(j.error || "Score failed");

    setActionMsg(`Score generated (window ${windowSize}).`);
    await load();
  } catch (e: any) {
    setActionErr(e?.message || "Failed to generate score");
  } finally {
    setActionLoading(false);
  }
}


  async function generatePatternsAgent() {
    setActionLoading(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const body = JSON.stringify({ level: "agent", refId: agentId, windowSize });
      const r = await fetch(`/api/patterns/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Patterns failed ${r.status}: ${txt.slice(0, 220)}`);

      // patterns endpoint возвращает JSON schema; иногда оно большое — но это норм
      let j: any = null;
      try {
        j = JSON.parse(txt);
      } catch {
        throw new Error(`Patterns returned non-JSON: ${txt.slice(0, 220)}`);
      }
      if (!j) throw new Error("Patterns returned empty response");

      setActionMsg(`Patterns generated (window ${windowSize}).`);
      await load();
    } catch (e: any) {
      setActionErr(e?.message || "Failed to generate patterns");
    } finally {
      setActionLoading(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setActionMsg("Copied.");
      setTimeout(() => setActionMsg(null), 900);
    } catch {
      setActionErr("Copy failed (browser blocked clipboard).");
    }
  }

  const strengths = useMemo(() => safeArr(lastScore?.strengths), [lastScore]);
  const weaknesses = useMemo(() => safeArr(lastScore?.weaknesses), [lastScore]);
  const keyPatterns = useMemo(() => safeArr(lastScore?.keyPatterns), [lastScore]);

  const conversations = data?.conversations ?? [];
  const lastPattern = data?.lastPattern ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Agent Intelligence</h1>
          <div className="mt-2 text-xl font-semibold">{header.agentName}</div>
          {header.subtitle ? (
            <div className="mt-1 text-sm text-neutral-600">{header.subtitle}</div>
          ) : (
            <div className="mt-1 text-sm text-neutral-500">Profile, scores, risks, coaching priority, and pattern insights.</div>
          )}

          {/* Мы НЕ показываем длинные ids в UI как текст. Но оставим Copy для дебага */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {pill(`Window: ${windowSize}`)}
            {pill(`Last overall: ${fmt(lastScore?.overallScore)}`)}
            {pill(`Risk: ${fmt(lastScore?.riskScore)}`)}
            {pill(`Priority: ${fmt(lastScore?.coachingPriority)}`)}
            {pill(lastPattern ? `Last patterns: ${new Date(lastPattern.createdAt).toLocaleString()}` : "No patterns yet")}
            <button
              className="rounded-full border px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              onClick={() => copy(agentId)}
              title="Copy Agent ID (for support/debug)"
            >
              Copy Agent ID
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <a href="/app/dashboard" className="rounded-lg border px-4 py-2 text-sm font-medium">
            Dashboard
          </a>
          <a
            href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=${encodeURIComponent(
              String(windowSize)
            )}`}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
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

      {(actionErr || actionMsg) && (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
            actionErr ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {actionErr ? actionErr : actionMsg}
        </div>
      )}

      {/* Actions */}
      <section className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Actions</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Generate fresh score snapshot or patterns without re-entering IDs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
            >
              {[20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  last {n}
                </option>
              ))}
            </select>

            <button
              onClick={generateScore}
              disabled={actionLoading}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {actionLoading ? "Working..." : "Generate Score"}
            </button>

            <button
              onClick={generatePatternsAgent}
              disabled={actionLoading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {actionLoading ? "Working..." : "Generate Patterns (Agent)"}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Latest Score Snapshot */}
        <section className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Latest Score Snapshot</h2>
          {!lastScore ? (
            <p className="mt-2 text-sm text-neutral-600">No scores yet. Click Generate Score.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Overall</div>
                  <div className="mt-1 text-2xl font-semibold">{fmt(lastScore.overallScore)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Risk</div>
                  <div className="mt-1 text-2xl font-semibold">{fmt(lastScore.riskScore)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Communication</div>
                  <div className="mt-1 text-2xl font-semibold">{fmt(lastScore.communicationScore)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Conversion</div>
                  <div className="mt-1 text-2xl font-semibold">{fmt(lastScore.conversionScore)}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-3">
                  <div className="text-xs font-medium text-neutral-600">Strengths</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-800">
                    {strengths.length === 0 ? <li className="text-neutral-600">—</li> : strengths.slice(0, 6).map((x, i) => <li key={i}>{String(x)}</li>)}
                  </ul>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-xs font-medium text-neutral-600">Weaknesses</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-800">
                    {weaknesses.length === 0 ? <li className="text-neutral-600">—</li> : weaknesses.slice(0, 6).map((x, i) => <li key={i}>{String(x)}</li>)}
                  </ul>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-xs font-medium text-neutral-600">Key Patterns</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-800">
                    {keyPatterns.length === 0 ? <li className="text-neutral-600">—</li> : keyPatterns.slice(0, 6).map((x, i) => <li key={i}>{String(x)}</li>)}
                  </ul>
                </div>
              </div>

              <div className="mt-3 text-xs text-neutral-500">
                Last updated: {new Date(lastScore.createdAt).toLocaleString()} • window {lastScore.windowSize}
              </div>
            </>
          )}
        </section>

        {/* Recent Conversations */}
        <section className="rounded-2xl border p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Recent Conversations</h2>
            <span className="text-xs text-neutral-500">Last {Math.min(15, conversations.length)} transcripts (excerpt)</span>
          </div>

          {conversations.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">No conversations yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {conversations.slice(0, 15).map((c) => {
                const full = String(c.excerpt || c.transcript || "").trim();
                const isOpen = !!expanded[c.id];
                const { text, cut } = smartTrim(full, 520);
                const shown = isOpen ? full : text;

                return (
                  <div key={c.id} className="rounded-xl border p-3">
                    {/* Верхняя строка: только дата и (опционально) score — без “cmlpvw...”, чтобы не уродовало UI */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleString()}</div>
                      <div className="flex items-center gap-2">
                        {c.score !== null && c.score !== undefined && (
                          <span className="rounded-full border px-2 py-1 text-xs text-neutral-700">score {fmt(c.score)}</span>
                        )}
                        <button
                          className="rounded-full border px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                          onClick={() => copy(c.id)}
                          title="Copy conversation ID"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">
                      {shown}
                      {!isOpen && cut ? "…" : ""}
                    </div>

                    {cut && (
                      <button
                        className="mt-2 text-xs font-medium text-neutral-700 underline"
                        onClick={() => setExpanded((p) => ({ ...p, [c.id]: !p[c.id] }))}
                      >
                        {isOpen ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Debug footer (optional) */}
      <div className="mt-6 text-xs text-neutral-400">
        Agent route id: <span className="font-mono">{agentId}</span>
      </div>
    </div>
  );
}
