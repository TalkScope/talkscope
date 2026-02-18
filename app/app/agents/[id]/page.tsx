"use client";

import { useMemo, useState } from "react";
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

function scoreChipClass(kind: "accent" | "success" | "warn" | "danger" | "muted") {
  if (kind === "success") return "ts-chip ts-chip-success";
  if (kind === "warn") return "ts-chip ts-chip-warn";
  if (kind === "danger") return "ts-chip ts-chip-danger";
  if (kind === "accent") return "ts-chip ts-chip-accent";
  return "ts-chip ts-chip-muted";
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

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <a className="ts-btn" href="/app/dashboard">
            Dashboard
          </a>
          <a
            className="ts-btn"
            href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=${encodeURIComponent(
              String(windowSize)
            )}`}
          >
            Pattern Intelligence
          </a>
          <button className="ts-btn" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
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
            <span className={scoreChipClass(overallKind)}>Last overall: {fmt(last?.overallScore)}</span>
            <span className={scoreChipClass(riskKind)}>Risk: {fmt(last?.riskScore)}</span>
            <span className={scoreChipClass(priorityKind)}>Priority: {fmt(last?.coachingPriority)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(12, minmax(0, 1fr))", marginTop: 14 }}>
        <section className="ts-card" style={{ gridColumn: "span 6" }}>
          <div className="ts-card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="ts-card-title">Latest score snapshot</div>
              <span className="ts-chip ts-chip-muted">{last?.createdAt ? new Date(last.createdAt).toISOString().slice(0, 10) : "-"}</span>
            </div>

            {!data?.lastScore ? (
              <div className="ts-muted" style={{ marginTop: 10 }}>
                No scores yet. Click Generate Score.
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span className={scoreChipClass(classifyOverall(data.lastScore.overallScore))}>Overall: {fmt(data.lastScore.overallScore)}</span>
                  <span className="ts-chip ts-chip-muted">Comm: {fmt(data.lastScore.communicationScore)}</span>
                  <span className="ts-chip ts-chip-muted">Conv: {fmt(data.lastScore.conversionScore)}</span>
                  <span className={scoreChipClass(classifyRisk(data.lastScore.riskScore))}>Risk: {fmt(data.lastScore.riskScore)}</span>
                  <span className={scoreChipClass(priorityKind)}>Priority: {fmt(data.lastScore.coachingPriority)}</span>
                </div>

                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(12, minmax(0, 1fr))", marginTop: 14 }}>
                  <div className="ts-card" style={{ gridColumn: "span 6" }}>
                    <div className="ts-card-pad">
                      <div className="ts-card-title">Strengths</div>
                      <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                        {(data.lastScore.strengths || []).slice(0, 6).map((x: string, i: number) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="ts-card" style={{ gridColumn: "span 6" }}>
                    <div className="ts-card-pad">
                      <div className="ts-card-title">Weaknesses</div>
                      <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                        {(data.lastScore.weaknesses || []).slice(0, 6).map((x: string, i: number) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="ts-card" style={{ gridColumn: "span 6" }}>
          <div className="ts-card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div className="ts-card-title">Recent conversations</div>
              <span className="ts-chip ts-chip-muted">Last {data?.conversations?.length ?? 0}</span>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {(data?.conversations ?? []).length === 0 ? (
                <div className="ts-alert">No conversations yet.</div>
              ) : (
                (data?.conversations ?? []).slice(0, 12).map((c) => (
                  <div key={c.id} className="ts-card">
                    <div className="ts-card-pad">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span className="ts-chip ts-chip-muted">
                          {new Date(c.createdAt).toISOString().slice(0, 19).replace("T", " ")}
                        </span>
                        {c.score !== null && c.score !== undefined ? (
                          <span className={scoreChipClass(classifyOverall(c.score))}>Score: {fmt(c.score)}</span>
                        ) : (
                          <span className="ts-chip ts-chip-muted">Score: -</span>
                        )}
                      </div>

                      <div className="ts-divider" />

                      <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 13, lineHeight: 1.5 }}>
                        {clipTranscript(c.transcript || c.excerpt || "", 900)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
