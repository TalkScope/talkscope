"use client";

import { useEffect, useMemo, useState } from "react";

type MetaAgentResponse = {
  ok: boolean;
  agent?: {
    id: string;
    name: string;
    email?: string | null;
    createdAt: string;
    team?: {
      id: string;
      name: string;
      organization?: { id: string; name: string } | null;
    } | null;
    _count?: any;
  };
  lastScore?: any | null;
  trend?: { createdAt: string; score: number; windowSize: number }[] | null;
  conversations?: {
    id: string;
    createdAt: string;
    score?: number | null;
    excerpt?: string;
    transcript?: string;
  }[];
  lastPattern?: { id: string; createdAt: string; windowSize: number } | null;
  error?: string;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function pill(label: string) {
  return (
    <span className="rounded-full border px-3 py-1 text-xs text-neutral-700">
      {label}
    </span>
  );
}

async function safeJson(res: Response) {
  const txt = await res.text();
  try {
    return { ok: res.ok, json: JSON.parse(txt), raw: txt };
  } catch {
    return { ok: res.ok, json: null, raw: txt };
  }
}

export default function AgentPage({ params }: { params: { id: string } }) {
  const agentId = decodeURIComponent(params.id || "").trim();

  const [data, setData] = useState<MetaAgentResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [windowSize, setWindowSize] = useState<number>(30);

  const [actionLoading, setActionLoading] = useState<"score" | "patterns" | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  async function load() {
    if (!agentId) return;
    setLoading(true);
    setActionErr(null);
    try {
      const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, { cache: "no-store" });
      const { ok, json, raw } = await safeJson(r);
      if (!ok) throw new Error(`HTTP ${r.status}: ${raw.slice(0, 200)}`);
      if (!json?.ok) throw new Error(json?.error || "Agent meta returned ok:false");
      setData(json as MetaAgentResponse);
    } catch (e: any) {
      setData(null);
      setActionErr(e?.message || "Failed to load agent");
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
    const teamName = a?.team?.name;
    const orgName = a?.team?.organization?.name;
    return {
      name: a?.name || "Agent Intelligence",
      sub: [teamName, orgName].filter(Boolean).join(" — "),
    };
  }, [data]);

  const lastScore = data?.lastScore ?? null;
  const lastPattern = data?.lastPattern ?? null;
  const convs = data?.conversations ?? [];

  async function copyAgentId() {
    try {
      await navigator.clipboard.writeText(agentId);
      setActionOk("Agent ID copied");
      setTimeout(() => setActionOk(null), 1200);
    } catch {
      setActionErr("Clipboard blocked by browser");
    }
  }

  async function generateScore() {
    setActionErr(null);
    setActionOk(null);

    if (!agentId) {
      setActionErr("Missing agentId (route param is empty)");
      return;
    }

    setActionLoading("score");
    try {
      const r = await fetch(`/api/agents/score/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize }),
      });

      const { ok, json, raw } = await safeJson(r);
      if (!ok) throw new Error(`Score failed ${r.status}: ${raw.slice(0, 200)}`);
      if (!json?.ok) throw new Error(json?.error || "Score failed");

      setActionOk("Score generated");
      await load();
    } catch (e: any) {
      setActionErr(e?.message || "Score failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function generatePatterns() {
    setActionErr(null);
    setActionOk(null);

    if (!agentId) {
      setActionErr("Missing agentId (route param is empty)");
      return;
    }

    setActionLoading("patterns");
    try {
      const r = await fetch(`/api/patterns/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: "agent", refId: agentId, windowSize }),
      });

      const { ok, json, raw } = await safeJson(r);
      if (!ok) throw new Error(`Patterns failed ${r.status}: ${raw.slice(0, 200)}`);
      if (!json) throw new Error("Patterns failed: server returned non-JSON");
      // patterns endpoint returns the report JSON itself (not {ok:true}).
      setActionOk("Patterns generated");
      await load();
    } catch (e: any) {
      setActionErr(e?.message || "Patterns failed");
    } finally {
      setActionLoading(null);
    }
  }

  const patternsHref = `/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&window=${encodeURIComponent(
    String(windowSize)
  )}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{header.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {header.sub || "Profile, scores, risks, coaching priority, and pattern insights."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href="/app/dashboard" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-50">
            Dashboard
          </a>
          <a href={patternsHref} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-50">
            Pattern Intelligence
          </a>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {pill(`Window: ${windowSize}`)}
        {pill(`Last overall: ${fmt(lastScore?.overallScore)}`)}
        {pill(`Risk: ${fmt(lastScore?.riskScore)}`)}
        {pill(`Priority: ${fmt(lastScore?.coachingPriority)}`)}
        {pill(lastPattern ? `Patterns: yes` : `No patterns yet`)}
        <button
          onClick={copyAgentId}
          className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-neutral-50"
          title={agentId}
        >
          Copy Agent ID
        </button>
      </div>

      {(actionErr || actionOk) && (
        <div
          className={[
            "mt-4 rounded-xl border p-4 text-sm",
            actionErr ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800",
          ].join(" ")}
        >
          {actionErr || actionOk}
        </div>
      )}

      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Actions</h2>
            <p className="text-sm text-neutral-500">
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
              disabled={actionLoading !== null || !agentId}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              {actionLoading === "score" ? "Scoring..." : "Generate Score"}
            </button>

            <button
              onClick={generatePatterns}
              disabled={actionLoading !== null || !agentId}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {actionLoading === "patterns" ? "Generating..." : "Generate Patterns (Agent)"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Latest Score Snapshot</h2>
          {!lastScore ? (
            <p className="mt-2 text-sm text-neutral-600">No scores yet. Click Generate Score.</p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Overall</div>
                  <div className="mt-1 text-xl font-semibold">{fmt(lastScore.overallScore)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Risk</div>
                  <div className="mt-1 text-xl font-semibold">{fmt(lastScore.riskScore)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Communication</div>
                  <div className="mt-1 text-xl font-semibold">{fmt(lastScore.communicationScore)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Conversion</div>
                  <div className="mt-1 text-xl font-semibold">{fmt(lastScore.conversionScore)}</div>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-xs text-neutral-500">Coaching priority</div>
                <div className="mt-1 text-xl font-semibold">{fmt(lastScore.coachingPriority)}</div>
              </div>

              {Array.isArray(lastScore?.strengths) && lastScore.strengths.length > 0 && (
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Strengths</div>
                  <ul className="mt-2 list-disc pl-5 text-neutral-800">
                    {lastScore.strengths.slice(0, 6).map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(lastScore?.weaknesses) && lastScore.weaknesses.length > 0 && (
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Weaknesses</div>
                  <ul className="mt-2 list-disc pl-5 text-neutral-800">
                    {lastScore.weaknesses.slice(0, 6).map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Conversations</h2>
            <span className="text-xs text-neutral-500">Last {convs.length} transcripts (excerpt)</span>
          </div>

          {convs.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">No conversations yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {convs.slice(0, 15).map((c, i) => {
                const text = (c.excerpt || c.transcript || "").trim();
                const created = c.createdAt ? new Date(c.createdAt) : null;
                return (
                  <div key={c.id || i} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-neutral-500">
                        {created ? created.toISOString().slice(0, 19).replace("T", " ") : "—"}
                      </div>
                      {c.score !== null && c.score !== undefined ? (
                        <div className="text-xs text-neutral-500">score: {fmt(c.score)}</div>
                      ) : null}
                    </div>

                    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-900">
                      {text || "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <div className="text-xs text-neutral-500">Agent route id:</div>
        <div className="mt-1 font-mono text-xs">{agentId || "—"}</div>
      </div>
    </div>
  );
}
