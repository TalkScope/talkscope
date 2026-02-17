"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AgentResp = {
  ok: boolean;
  agent?: {
    id: string;
    name: string;
    email?: string | null;
    createdAt?: string;
    team?: { id: string; name: string; organization?: { id: string; name: string } } | null;
  };
  lastScore?: any | null;
  trend?: { createdAt: string; score: number; windowSize: number }[] | null;
  conversations?: { id: string; createdAt: string; excerpt?: string; transcript?: string; score?: number | null }[];
  lastPattern?: { id: string; createdAt: string; windowSize: number } | null;
  error?: string;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function pill(label: string) {
  return <span className="rounded-full border px-3 py-1 text-xs text-neutral-600">{label}</span>;
}

async function safeJson<T>(r: Response): Promise<T> {
  const txt = await r.text();
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${txt.slice(0, 200)}`);
  }
}

export default function AgentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const agentId = useMemo(() => decodeURIComponent(String(params?.id || "")), [params]);

  const [data, setData] = useState<AgentResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [windowSize, setWindowSize] = useState<number>(30);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  async function load() {
    if (!agentId) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, { cache: "no-store" });
      const j = await safeJson<AgentResp>(r);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `Agent API failed (${r.status})`);
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load agent");
    } finally {
      setLoading(false);
    }
  }

  async function generateScore() {
    setActionBusy(true);
    setActionErr(null);
    setActionOk(null);
    try {
      const r = await fetch(`/api/agents/score/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize }),
      });
      const j = await safeJson<any>(r);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `Score failed (${r.status})`);
      setActionOk("Score generated.");
      await load();
    } catch (e: any) {
      setActionErr(e?.message || "Failed to generate score");
    } finally {
      setActionBusy(false);
    }
  }

  async function generatePatterns() {
    setActionBusy(true);
    setActionErr(null);
    setActionOk(null);
    try {
      const r = await fetch(`/api/patterns/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: "agent", refId: agentId, windowSize }),
      });
      const j = await safeJson<any>(r);
      if (!r.ok) throw new Error(j?.error || `Patterns failed (${r.status})`);
      setActionOk("Pattern report generated.");
      // перекидываем на patterns страницу уже с refId
      router.push(`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&window=${encodeURIComponent(String(windowSize))}`);
    } catch (e: any) {
      setActionErr(e?.message || "Failed to generate patterns");
    } finally {
      setActionBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const header = useMemo(() => {
    const a = data?.agent;
    const team = a?.team?.name;
    const org = a?.team?.organization?.name;
    return {
      name: a?.name || agentId,
      sub: [team, org].filter(Boolean).join(" — "),
    };
  }, [data, agentId]);

  const lastScore = data?.lastScore;
  const lastPattern = data?.lastPattern;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Intelligence</h1>
          <p className="text-sm text-neutral-500">Profile, scores, risks, coaching priority, and pattern insights.</p>
        </div>

        <div className="flex gap-2">
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
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold">{header.name}</div>
            <div className="text-sm text-neutral-500">{header.sub || `Agent ID: ${agentId}`}</div>
            {header.sub ? <div className="mt-1 font-mono text-xs text-neutral-500">{agentId}</div> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {pill(`Window: ${windowSize}`)}
            {pill(`Last overall: ${fmt(lastScore?.overallScore)}`)}
            {pill(`Risk: ${fmt(lastScore?.riskScore)}`)}
            {pill(`Priority: ${fmt(lastScore?.coachingPriority)}`)}
            {pill(lastPattern ? `Patterns: yes` : `No patterns yet`)}
          </div>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
      )}

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
                <option key={n} value={n}>
                  last {n}
                </option>
              ))}
            </select>

            <button
              onClick={generateScore}
              disabled={actionBusy || !agentId}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {actionBusy ? "Working..." : "Generate Score"}
            </button>

            <button
              onClick={generatePatterns}
              disabled={actionBusy || !agentId}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {actionBusy ? "Working..." : "Generate Patterns (Agent)"}
            </button>
          </div>
        </div>

        {actionErr && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionErr}</div>
        )}
        {actionOk && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{actionOk}</div>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Latest Score Snapshot</h2>
          {!lastScore ? (
            <p className="mt-2 text-sm text-neutral-600">No scores yet. Click Generate Score.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Overall</span>
                <span className="font-semibold">{fmt(lastScore.overallScore)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Communication</span>
                <span className="font-semibold">{fmt(lastScore.communicationScore)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Conversion</span>
                <span className="font-semibold">{fmt(lastScore.conversionScore)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Risk</span>
                <span className="font-semibold">{fmt(lastScore.riskScore)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Coaching Priority</span>
                <span className="font-semibold">{fmt(lastScore.coachingPriority)}</span>
              </div>

              <div className="mt-3 rounded-xl border p-3">
                <div className="text-xs font-semibold text-neutral-600">Key patterns</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
                  {(Array.isArray(lastScore.keyPatterns) ? lastScore.keyPatterns : safeArr(lastScore.keyPatterns)).slice(0, 6).map((x: any, i: number) => (
                    <li key={i}>{String(x)}</li>
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
              <div className="rounded-xl border p-3 text-sm text-neutral-600">No conversations yet.</div>
            ) : (
              (data?.conversations ?? []).slice(0, 15).map((c) => (
                <div key={c.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs text-neutral-600">{c.id}</div>
                    <div className="text-xs text-neutral-500">{String(c.createdAt).slice(0, 19).replace("T", " ")}</div>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">
                    {String(c.excerpt || c.transcript || "").slice(0, 360)}
                    {String(c.excerpt || c.transcript || "").length > 360 ? "…" : ""}
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

function safeArr(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const j = JSON.parse(v);
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  return [];
}
