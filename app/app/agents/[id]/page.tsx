"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type AgentResponse = {
  ok: boolean;
  agent?: {
    id: string;
    name: string;
    email?: string | null;
    createdAt?: string;
    team?: {
      id: string;
      name: string;
      organizationId: string;
      organization?: { id: string; name: string };
    } | null;
  };
  lastScore?: any;
  trend?: any[];
  conversations?: {
    id: string;
    createdAt: string;
    transcript: string;
    excerpt?: string;
    score?: number | null;
  }[];
  lastPattern?: { id: string; createdAt: string; windowSize: number } | null;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function safeJsonParse(txt: string) {
  try {
    return { ok: true as const, json: JSON.parse(txt) };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || "Invalid JSON", head: txt.slice(0, 220) };
  }
}

function pill(label: string) {
  return <span className="ts-chip">{label}</span>;
}

function clipTranscript(text: string, max = 420) {
  const t = (text || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

export default function AgentPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();

  // route id = настоящий Agent.id (например agent_1)
  const agentId = useMemo(() => {
    const raw = params?.id ? String(params.id) : "";
    return decodeURIComponent(raw);
  }, [params]);

  const [windowSize, setWindowSize] = useState<number>(30);

  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [msgErr, setMsgErr] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const agentName = data?.agent?.name || "Agent";
  const teamName = data?.agent?.team?.name || "";
  const orgName = data?.agent?.team?.organization?.name || "";

  const last = data?.lastScore || null;

  async function load() {
    setLoading(true);
    setMsgErr(null);
   try {
  if (!agentId) throw new Error("Missing route param: agent id");

  const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, { cache: "no-store" });
  const txt = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 220)}`);

  const parsed = safeJsonParse(txt);
  if (!parsed.ok) throw new Error(`JSON error: ${parsed.error}. Head: ${parsed.head}`);

  const j = parsed.json as AgentResponse;
  if (!j.ok) throw new Error((j as any)?.error || "Agent API returned ok:false");

  setData(j);
} catch (e: any) {
  setMsgErr(e?.message || "Failed to load agent");
  setData(null);
} finally {
  setLoading(false);
}

  }

  async function generateScore() {
    setActionLoading(true);
    setActionErr(null);
    setActionOk(null);
    try {
      if (!agentId) throw new Error("Missing agentId");

      const r = await fetch(`/api/agents/score/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize }),
      });

      const txt = await r.text();
      if (!r.ok) throw new Error(`Score failed ${r.status}: ${txt.slice(0, 220)}`);

      const parsed = safeJsonParse(txt);
      if (!parsed.ok) throw new Error(`Score JSON error: ${parsed.error}. Head: ${parsed.head}`);

      const j = parsed.json;
      if (!j.ok) throw new Error(j.error || "Score returned ok:false");

      setActionOk("Score generated.");
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
    setActionOk(null);
    try {
      if (!agentId) throw new Error("Missing refId (agentId)");

      const r = await fetch(`/api/patterns/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: "agent", refId: agentId, windowSize }),
      });

      const txt = await r.text();
      if (!r.ok) throw new Error(`Patterns failed ${r.status}: ${txt.slice(0, 220)}`);

      const parsed = safeJsonParse(txt);
      if (!parsed.ok) throw new Error(`Patterns JSON error: ${parsed.error}. Head: ${parsed.head}`);

      const j = parsed.json;
      if (!j.ok) throw new Error(j.error || "Patterns returned ok:false");

      setActionOk("Patterns generated.");
      // переходим в Pattern Intelligence с автоподстановкой
      window.location.href = `/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=${encodeURIComponent(
        String(windowSize)
      )}`;
    } catch (e: any) {
      setActionErr(e?.message || "Failed to generate patterns");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    // allow preselect from query ?window=50
    const w = search?.get("window");
    if (w) {
      const n = Number(w);
      if (!Number.isNaN(n) && n > 0) setWindowSize(n);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  return (
    <div className="ts-container">
      <div className="ts-pagehead">
        <div>
          <div className="ts-breadcrumbs">
            <a href="/app/dashboard">Dashboard</a> <span>·</span> <span className="ts-accent">Agent</span>
          </div>
          <h1 className="ts-title">Agent Intelligence</h1>
          <div className="ts-subtitle">
            <span className="agent-name">{agentName}</span>
            <span className="mx-2">·</span>
            <span>{teamName && orgName ? `${teamName} — ${orgName}` : teamName || orgName || "—"}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href="/app/dashboard" className="ts-btn">
            Dashboard
          </a>
          <a
            href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=${encodeURIComponent(
              String(windowSize)
            )}`}
            className="ts-btn"
          >
            Pattern Intelligence
          </a>
          <button onClick={load} disabled={loading} className="ts-btn">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {(msgErr || actionErr) && <div className="mt-6 ts-alert ts-alert-error">{msgErr || actionErr}</div>}

      {actionOk && <div className="mt-6 ts-alert ts-alert-ok">{actionOk}</div>}

      <div className="mt-6 flex flex-wrap gap-2">
        {pill(`Window: ${windowSize}`)}
        {pill(`Last overall: ${last?.overallScore !== undefined ? fmt(last.overallScore) : "—"}`)}
        {pill(`Risk: ${last?.riskScore !== undefined ? fmt(last.riskScore) : "—"}`)}
        {pill(`Priority: ${last?.coachingPriority !== undefined ? fmt(last.coachingPriority) : "—"}`)}
        {pill(data?.lastPattern ? `Patterns: yes` : "No patterns yet")}
        <button onClick={() => navigator.clipboard.writeText(agentId)} className="ts-btn" title="Copy agent id">
          Copy Agent ID
        </button>
      </div>

      {/* Actions */}
      <div className="mt-6 ts-card ts-card-pad">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="ts-card-title">Actions</h2>
            <p className="ts-card-meta">
              Generate fresh score snapshot or patterns without re-entering IDs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="ts-select"
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
              disabled={actionLoading || !agentId}
              className="ts-btn"
            >
              {actionLoading ? "Working..." : "Generate Score"}
            </button>

            <button
              onClick={generatePatternsAgent}
              disabled={actionLoading || !agentId}
              className="ts-btn ts-btn-primary"
            >
              {actionLoading ? "Working..." : "Generate Patterns (Agent)"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="ts-card ts-card-pad">
          <div className="ts-kpi">
            <div className="k">Overall score</div>
            <div className="v metric-number">{data?.lastScore?.overallScore !== undefined ? fmt(data?.lastScore?.overallScore) : "—"}</div>
            <div className="hint">Latest snapshot</div>
          </div>
        </div>
        <div className="ts-card ts-card-pad">
          <div className="ts-kpi">
            <div className="k">Risk</div>
            <div className={`v metric-number ${data?.lastScore?.riskScore !== undefined ? (Number(data?.lastScore?.riskScore) >= 70 ? "risk-high" : Number(data?.lastScore?.riskScore) >= 50 ? "risk-mid" : "risk-low") : ""}`}
            >
              {data?.lastScore?.riskScore !== undefined ? fmt(data?.lastScore?.riskScore) : "—"}
            </div>
            <div className="hint">Revenue / compliance risk</div>
          </div>
        </div>
        <div className="ts-card ts-card-pad">
          <div className="ts-kpi">
            <div className="k">Coaching priority</div>
            <div className="v metric-number">{data?.lastScore?.coachingPriority !== undefined ? fmt(data?.lastScore?.coachingPriority) : "—"}</div>
            <div className="hint">Higher = coach sooner</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="ts-card ts-card-pad">
          <h2 className="ts-card-title">Latest Score Snapshot</h2>

          {!data?.lastScore ? (
            <p className="mt-2 text-sm ts-muted">No scores yet. Click Generate Score.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                {pill(`Overall: ${fmt(data.lastScore.overallScore)}`)}
                {pill(`Comm: ${fmt(data.lastScore.communicationScore)}`)}
                {pill(`Conv: ${fmt(data.lastScore.conversionScore)}`)}
                {pill(`Risk: ${fmt(data.lastScore.riskScore)}`)}
                {pill(`Priority: ${fmt(data.lastScore.coachingPriority)}`)}
              </div>

              <div className="rounded-xl border border-[var(--ts-border-soft)] bg-[var(--ts-bg-soft)] p-4">
                <div className="text-xs ts-muted">Strengths</div>
                <ul className="mt-2 list-disc pl-5 text-[13px]">
                  {(data.lastScore.strengths || []).slice(0, 6).map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[var(--ts-border-soft)] bg-[var(--ts-bg-soft)] p-4">
                <div className="text-xs ts-muted">Weaknesses</div>
                <ul className="mt-2 list-disc pl-5 text-[13px]">
                  {(data.lastScore.weaknesses || []).slice(0, 6).map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <section className="ts-card ts-card-pad">
          <div className="flex items-center justify-between">
            <h2 className="ts-card-title">Recent Conversations</h2>
            <span className="text-xs ts-muted">Last {data?.conversations?.length ?? 0} transcripts (excerpt)</span>
          </div>

          <div className="mt-4 space-y-3">
            {(data?.conversations ?? []).length === 0 ? (
              <div className="rounded-xl border border-[var(--ts-border-soft)] bg-[var(--ts-bg-soft)] p-4 text-sm ts-muted">
                No conversations yet.
              </div>
            ) : (
              (data?.conversations ?? []).slice(0, 15).map((c) => (
                <div key={c.id} className="rounded-2xl border border-[var(--ts-border)] bg-[var(--ts-surface)] p-4">
                  {/* УБРАЛИ c.id сверху, чтобы не портил вид */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs ts-muted">
                      {new Date(c.createdAt).toISOString().slice(0, 19).replace("T", " ")}
                    </div>
                    {c.score !== null && c.score !== undefined ? (
                      <div className="text-xs font-semibold">score: {fmt(c.score)}</div>
                    ) : null}
                  </div>

                  <div className="mt-3 text-sm font-semibold">Chat transcript (simulation):</div>

                  <div
                    className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-[var(--ts-bg-soft)] p-3 text-sm text-neutral-800"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {clipTranscript(c.transcript || c.excerpt || "", 900)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-8 ts-card ts-card-pad">
        <div className="text-xs ts-muted">Agent id</div>
        <div className="mt-1 font-mono text-xs text-neutral-700">{agentId || "—"}</div>
      </div>
    </div>
  );
}
