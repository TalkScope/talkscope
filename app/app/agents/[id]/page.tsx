"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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



function normalizeList(val: any, limit = 6): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((x) => (typeof x === "string" ? x : String(x)))
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, limit);
  }
  if (typeof val === "string") {
    return val
      .split(/\r?\n|•|\u2022|\-\s+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, limit);
  }
  return [String(val)].map((s) => s.trim()).filter(Boolean).slice(0, limit);
}

function safeJsonParse(txt: string) {
  try {
    return { ok: true as const, json: JSON.parse(txt) };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || "Invalid JSON", head: txt.slice(0, 220) };
  }
}

function clipTranscript(text: string, max = 520) {
  const t = (text || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

function chipStyle(kind: "accent" | "success" | "warn" | "danger" | "muted") {
  if (kind === "danger") return { color: "var(--ts-danger)", borderColor: "rgba(180,35,24,.35)", background: "transparent" } as const;
  if (kind === "warn") return { color: "var(--ts-warn)", borderColor: "rgba(184,106,0,.35)", background: "transparent" } as const;
  if (kind === "success") return { color: "var(--ts-success)", borderColor: "rgba(31,122,58,.35)", background: "transparent" } as const;
  if (kind === "accent") return { color: "var(--ts-accent)", borderColor: "rgba(64,97,132,.35)", background: "transparent" } as const;
  return { color: "var(--ts-muted)", borderColor: "var(--ts-border)", background: "transparent" } as const;
}

function scoreChipClass(kind: "accent" | "success" | "warn" | "danger" | "muted") {
  // keep class simple, style carries the semantic color without loud fills
  return "ts-chip";
}

function classifyRisk(risk: number | null | undefined) {
  if (risk === null || risk === undefined || Number.isNaN(Number(risk))) return "muted" as const;
  if (risk >= 70) return "danger" as const;
  if (risk >= 45) return "warn" as const;
  return "success" as const;
}

function classifyOverall(overall: number | null | undefined) {
  if (overall === null || overall === undefined || Number.isNaN(Number(overall))) return "muted" as const;
  if (overall >= 80) return "success" as const;
  if (overall >= 60) return "accent" as const;
  if (overall >= 40) return "warn" as const;
  return "danger" as const;
}

export default function AgentPage() {
  const params = useParams<{ id: string }>();

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

  async function fetchLatestPatternReport() {
    try {
      if (!agentId) return;
      setPatternLoading(true);
      setPatternErr(null);

      // Try a few likely endpoints (project variants). We gracefully fallback if not present.
      const candidates = [
        `/api/patterns/report?level=agent&refId=${encodeURIComponent(agentId)}`,
        `/api/patterns/latest?level=agent&refId=${encodeURIComponent(agentId)}`,
        `/api/patterns/agent?refId=${encodeURIComponent(agentId)}`,
        `/api/patterns?level=agent&refId=${encodeURIComponent(agentId)}`,
      ];

      let lastErr = "";
      for (const url of candidates) {
        const r = await fetch(url);
        const txt = await r.text();
        if (!r.ok) {
          lastErr = `${r.status}: ${txt.slice(0, 160)}`;
          continue;
        }

        const parsed = safeJsonParse(txt);
        if (!parsed.ok) {
          lastErr = parsed.error || "JSON parse error";
          continue;
        }

        const j: any = parsed.json;

        // Accept either {ok:true, report:{...}} or {ok:true, patterns:[...]} or direct report object
        if (j?.ok === true) {
          const report = j.report ?? j.patternReport ?? j.data ?? j;
          setPatternReport(report);
          setPatternLoading(false);
          return;
        }

        // Some endpoints may return the report directly (no ok flag)
        if (j && (j.patterns || j.coachingFocus || j.riskTriggers || j.summary)) {
          setPatternReport(j);
          setPatternLoading(false);
          return;
        }

        lastErr = j?.error || "No report in response";
      }

      setPatternErr(lastErr || "Pattern report not available on this endpoint.");
    } catch (e: any) {
      setPatternErr(e?.message || "Failed to load pattern report");
    } finally {
      setPatternLoading(false);
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
      await load();
    } catch (e: any) {
      setActionErr(e?.message || "Failed to generate patterns");
    } finally {
      setActionLoading(false);
    }
  }

  // Auto-load once we have an id (kept explicit to avoid useEffect loops in turbopack)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  if (!data && !loading && !msgErr && agentId) load();

  const overallKind = classifyOverall(last?.overallScore);
  const riskKind = classifyRisk(last?.riskScore);
  const priorityKind =
    last?.coachingPriority === null || last?.coachingPriority === undefined
      ? ("muted" as const)
      : last.coachingPriority >= 70
      ? ("danger" as const)
      : last.coachingPriority >= 45
      ? ("warn" as const)
      : ("success" as const);

  return (
    <div className="ts-container">
      <div className="ts-pagehead">
        <div>
          <div className="ts-chip ts-chip-muted" style={{ marginBottom: 10 }}>
            <span>Agent</span>
            <span className="ts-muted">/</span>
            <span>{agentName}</span>
          </div>

          <div className="ts-title">Agent Intelligence</div>
          <div className="ts-subtitle">
            {teamName && orgName ? `${teamName} - ${orgName}` : teamName || orgName || "-"}
          </div>
        </div>
      </div>

      {(msgErr || actionErr) && <div className="ts-alert ts-alert-error">{msgErr || actionErr}</div>}
      {actionOk && <div className="ts-alert ts-alert-ok">{actionOk}</div>}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(12, minmax(0, 1fr))", marginTop: 14 }}>
        <div className="ts-card" style={{ gridColumn: "span 4" }}>
          <div className="ts-card-pad">
            <div className="ts-card-title">Overall</div>
            <div className="ts-metric">{fmt(last?.overallScore)}</div>
            <div style={{ marginTop: 10 }}>
              <span className={scoreChipClass(overallKind)}>{overallKind === "muted" ? "No data" : "Status"}</span>
            </div>
          </div>
        </div>

        <div className="ts-card" style={{ gridColumn: "span 4" }}>
          <div className="ts-card-pad">
            <div className="ts-card-title">Risk</div>
            <div className="ts-metric">{fmt(last?.riskScore)}</div>
            <div style={{ marginTop: 10 }}>
              <span className={scoreChipClass(riskKind)}>
                {riskKind === "danger" ? "High" : riskKind === "warn" ? "Medium" : riskKind === "success" ? "Low" : "No data"}
              </span>
            </div>
          </div>
        </div>

        <div className="ts-card" style={{ gridColumn: "span 4" }}>
          <div className="ts-card-pad">
            <div className="ts-card-title">Coaching priority</div>
            <div className="ts-metric">{fmt(last?.coachingPriority)}</div>
            <div style={{ marginTop: 10 }}>
              <span className={scoreChipClass(priorityKind)}>
                {priorityKind === "danger" ? "Urgent" : priorityKind === "warn" ? "Focus" : priorityKind === "success" ? "Monitor" : "No data"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="ts-card" style={{ marginTop: 14 }}>
        <div className="ts-card-pad">
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <div className="ts-card-title">Actions</div>
              <div className="ts-subtitle" style={{ marginTop: 6 }}>
                Generate a new score snapshot or pattern report for this agent.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select className="ts-select" value={windowSize} onChange={(e) => setWindowSize(Number(e.target.value))}>
                {[20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    last {n}
                  </option>
                ))}
              </select>

              <button className="ts-btn" onClick={generateScore} disabled={actionLoading || !agentId}>
                {actionLoading ? "Working..." : "Generate Score"}
              </button>

              <button className="ts-btn ts-btn-primary" onClick={generatePatternsAgent} disabled={actionLoading || !agentId}>
                {actionLoading ? "Working..." : "Generate Patterns"}
              </button>

              <button
                className="ts-btn"
                onClick={() => navigator.clipboard.writeText(agentId)}
                title="Copy agent id"
                disabled={!agentId}
              >
                Copy ID
              </button>
            </div>
          </div>

          <div className="ts-divider" />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="ts-chip ts-chip-muted">Window: {windowSize}</span>
            <span className="ts-chip ts-chip-muted">Patterns: {data?.lastPattern ? "yes" : "no"}</span>
            <span className={scoreChipClass(overallKind)} style={chipStyle(overallKind)}>Last overall: {fmt(last?.overallScore)}</span>
            <span className={scoreChipClass(riskKind)} style={chipStyle(riskKind)}>Risk: {fmt(last?.riskScore)}</span>
            <span className={scoreChipClass(priorityKind)} style={chipStyle(priorityKind)}>Priority: {fmt(last?.coachingPriority)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(12, minmax(0, 1fr))", marginTop: 14 }}>
        <section className="ts-card" style={{ gridColumn: "span 6" }}>
          <div className="ts-card-pad">
            <div className="ts-sectionhead">
              <div>
                <div className="ts-h2">Pattern Intelligence</div>
                <div className="ts-hint">Repeating signals and coaching focus for this agent.</div>
              </div>
              <a
                className="ts-btn"
                href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=${encodeURIComponent(String(windowSize))}`}
              >
                Open Patterns
              </a>
            </div>

            <div className="ts-divider" />

            {!data?.lastPattern ? (
              <div className="ts-panel" style={{ padding: 16 }}>
                <div style={{ fontWeight: 750 }}>No pattern report yet.</div>
                <div className="ts-muted" style={{ marginTop: 6 }}>
                  Click <b>Generate Patterns</b> above to create the first report.
                </div>
              </div>
            ) : (
              <div className="ts-panel" style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="ts-chip ts-chip-muted">Last generated</span>
                  <span className="ts-chip" style={chipStyle("accent")}>
                    window {data.lastPattern.windowSize}
                  </span>
                  <span className="ts-muted">
                    {new Date(data.lastPattern.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="ts-muted" style={{ marginTop: 10 }}>
                  Open Pattern Intelligence to review clusters, risk triggers, and coaching recommendations.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="ts-card" style={{ marginTop: 14 }}>
        <div className="ts-card-pad">
          <div className="ts-card-title">Agent id</div>
          <div style={{ marginTop: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace", fontSize: 12 }}>
            {agentId || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
