"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

// ─── TYPES ───────────────────────────────────────────────────────────────────

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
      organizationId?: string;
      organization?: { id: string; name: string };
    } | null;
  };
  lastScore?: {
    createdAt: string;
    windowSize: number;
    overallScore: number | null;
    communicationScore: number | null;
    conversionScore: number | null;
    riskScore: number | null;
    coachingPriority: number | null;
    strengths: string[];
    weaknesses: string[];
    keyPatterns: string[];
  } | null;
  trend?: { createdAt: string; score: number; windowSize: number }[];
  conversations?: {
    id: string;
    createdAt: string;
    transcript: string;
    excerpt?: string;
    score?: number | null;
  }[];
  lastPattern?: { id: string; createdAt: string; windowSize: number } | null;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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

function scoreColor(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "var(--ts-muted)";
  if (n >= 80) return "var(--ts-success)";
  if (n >= 60) return "var(--ts-warn)";
  return "var(--ts-danger)";
}

function riskColor(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "var(--ts-muted)";
  if (n >= 70) return "var(--ts-danger)";
  if (n >= 45) return "var(--ts-warn)";
  return "var(--ts-success)";
}

function scoreChipClass(n: number | null | undefined): string {
  const val = Number(n);
  if (Number.isNaN(val) || n === null || n === undefined) return "ts-chip ts-chip-muted";
  if (val >= 80) return "ts-chip ts-chip-success";
  if (val >= 60) return "ts-chip ts-chip-accent";
  return "ts-chip ts-chip-danger";
}

function priorityChipClass(n: number | null | undefined): string {
  const val = Number(n);
  if (Number.isNaN(val) || n === null || n === undefined) return "ts-chip ts-chip-muted";
  if (val >= 70) return "ts-chip ts-chip-danger";
  if (val >= 45) return "ts-chip ts-chip-warn";
  return "ts-chip ts-chip-success";
}

function priorityLabel(n: number | null | undefined): string {
  const val = Number(n);
  if (Number.isNaN(val) || n === null || n === undefined) return "No data";
  if (val >= 70) return "Urgent";
  if (val >= 45) return "Focus";
  return "Monitor";
}

function riskLabel(n: number | null | undefined): string {
  const val = Number(n);
  if (Number.isNaN(val) || n === null || n === undefined) return "No data";
  if (val >= 70) return "High";
  if (val >= 45) return "Medium";
  return "Low";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function MiniBar({ value, color }: { value: number | null | undefined; color: string }) {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100);
  return (
    <div className="ts-minibar-track">
      <div className="ts-minibar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ScoreRing({
  value,
  color,
  size = 72,
  stroke = 6,
}: {
  value: number | null | undefined;
  color: string;
  size?: number;
  stroke?: number;
}) {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", display: "block", flexShrink: 0 }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ts-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkLine({ data }: { data: { score: number }[] }) {
  if (!data || data.length < 2)
    return <span className="ts-muted" style={{ fontSize: 12 }}>Not enough data</span>;
  const vals = data.map((d) => d.score);
  const min = Math.min(...vals) - 5;
  const max = Math.max(...vals) + 5;
  const W = 220, H = 44;
  const pts = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - ((v - min) / (max - min || 1)) * H;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke="var(--ts-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H - ((v - min) / (max - min || 1)) * H;
        return (
          <circle key={i} cx={x} cy={y} r={i === vals.length - 1 ? 4 : 3}
            fill={i === vals.length - 1 ? "var(--ts-accent)" : "var(--ts-border)"}
            stroke="var(--ts-accent)" strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function AgentPage() {
  const params = useParams<{ id: string }>();
  const agentId = useMemo(() => {
    const raw = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? "");
    return decodeURIComponent(raw);
  }, [params]);

  const [windowSize, setWindowSize] = useState<number>(30);
  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [msgErr, setMsgErr] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const [patternLoading, setPatternLoading] = useState(false);
  const [patternErr, setPatternErr] = useState<string | null>(null);
  const [patternReport, setPatternReport] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "conversations" | "patterns">("overview");
  const [copied, setCopied] = useState(false);

  const agent = data?.agent;
  const last = data?.lastScore ?? null;
  const agentName = agent?.name || "Agent";
  const teamName = agent?.team?.name || "";
  const orgName = agent?.team?.organization?.name || "";

  async function load() {
    setLoading(true);
    setMsgErr(null);
    try {
      if (!agentId) throw new Error("Missing route param: agent id");
      const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, { cache: "no-store" });
      const txt = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 220)}`);
      const parsed = safeJsonParse(txt);
      if (!parsed.ok) throw new Error(`JSON error: ${parsed.error}`);
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
      const url = `/api/patterns/list?level=agent&refId=${encodeURIComponent(agentId)}&take=1`;
      const r = await fetch(url, { cache: "no-store" });
      const txt = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 180)}`);
      const parsed = safeJsonParse(txt);
      if (!parsed.ok) throw new Error(`JSON error: ${parsed.error}`);
      const rows = parsed.json as any[];
      const row = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!row?.reportJson) {
        setPatternReport(null);
        setPatternErr("No pattern report yet.");
        return;
      }
      const reportParsed = safeJsonParse(row.reportJson);
      if (!reportParsed.ok) throw new Error(`Report JSON error: ${reportParsed.error}`);
      setPatternReport({ id: row.id, createdAt: row.createdAt, windowSize: row.windowSize, ...reportParsed.json });
    } catch (e: any) {
      setPatternErr(e?.message || "Failed to load pattern report");
      setPatternReport(null);
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
      if (!parsed.ok) throw new Error(`Score JSON error: ${parsed.error}`);
      const j = parsed.json;
      if (!j.ok) throw new Error(j.error || "Score returned ok:false");
      setActionOk("Score generated successfully.");
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
      if (!parsed.ok) throw new Error(`Patterns JSON error: ${parsed.error}`);
      const j = parsed.json;
      if (!j.ok) throw new Error(j.error || "Patterns returned ok:false");
      setActionOk("Patterns generated successfully.");
      await load();
      await fetchLatestPatternReport();
    } catch (e: any) {
      setActionErr(e?.message || "Failed to generate patterns");
    } finally {
      setActionLoading(false);
    }
  }

  function copyId() {
    navigator.clipboard.writeText(agentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadPdf() {
    try {
      const r = await fetch("/api/pdf/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: { id: agentId, name: agentName, teamName, orgName },
          score: last,
          trend: data?.trend ?? [],
        }),
      });
      if (!r.ok) throw new Error("PDF generation failed");
      const html = await r.text();
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 600);
    } catch (e: any) {
      setActionErr(e?.message || "PDF failed");
    }
  }

  useEffect(() => {
    if (!agentId) return;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchLatestPatternReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  return (
    <>
      <style>{`
        .ts-agent-hero {
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
        }
        .ts-agent-hero-left { display: flex; align-items: center; gap: 18px; }
        .ts-agent-avatar {
          width: 56px; height: 56px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(64,97,132,0.15), rgba(64,97,132,0.45));
          border: 1px solid rgba(64,97,132,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: var(--ts-accent);
          flex-shrink: 0; letter-spacing: -0.5px;
        }
        .ts-agent-name {
          font-size: 26px; font-weight: 760;
          letter-spacing: -0.03em; line-height: 1.1;
        }
        .ts-agent-meta {
          display: flex; align-items: center; gap: 8px;
          margin-top: 6px; flex-wrap: wrap;
        }
        .ts-agent-meta-sep { color: var(--ts-border); }
        .ts-agent-meta-text { font-size: 13px; color: var(--ts-muted); }
        .ts-hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }

        .ts-kpi-strip {
          display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 12px; margin-bottom: 24px;
        }
        @media (max-width: 1100px) { .ts-kpi-strip { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .ts-kpi-strip { grid-template-columns: repeat(2, 1fr); } }
        .ts-kpi-card {
          background: var(--ts-surface);
          border: 1px solid var(--ts-border);
          border-radius: var(--ts-radius-lg);
          box-shadow: var(--ts-shadow-sm);
          padding: 18px 20px;
          display: flex; align-items: center; gap: 14px;
        }
        .ts-kpi-ring-wrap { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
        .ts-kpi-ring-label {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; font-weight: 800; letter-spacing: -0.5px;
        }
        .ts-kpi-right { flex: 1; min-width: 0; }
        .ts-kpi-label {
          font-size: 11px; font-weight: 800; color: var(--ts-muted);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;
        }
        .ts-kpi-big {
          font-size: 28px; font-weight: 800;
          letter-spacing: -0.04em; line-height: 1; margin-bottom: 8px;
        }
        .ts-kpi-sub { font-size: 11px; color: var(--ts-muted); margin-top: 4px; }

        .ts-minibar-track {
          height: 5px; border-radius: 3px;
          background: var(--ts-border-soft); overflow: hidden;
        }
        .ts-minibar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

        .ts-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 22px; font-size: 13px;
        }
        .ts-bc-link {
          color: var(--ts-muted); cursor: pointer; text-decoration: none;
          transition: color 120ms;
        }
        .ts-bc-link:hover { color: var(--ts-accent); }
        .ts-bc-sep { color: var(--ts-border); }
        .ts-bc-current { color: var(--ts-ink); font-weight: 600; }

        .ts-tabs {
          display: flex; gap: 2px;
          border-bottom: 1px solid var(--ts-border-soft);
          margin-bottom: 20px;
        }
        .ts-tab-btn {
          padding: 10px 18px; background: transparent; border: none;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          color: var(--ts-muted); font-size: 14px; font-weight: 650;
          cursor: pointer; transition: all 0.15s;
        }
        .ts-tab-btn:hover { color: var(--ts-ink); }
        .ts-tab-btn.active {
          color: var(--ts-accent); border-bottom-color: var(--ts-accent); font-weight: 750;
        }

        .ts-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 760px) { .ts-two-col { grid-template-columns: 1fr; } }
        .ts-full-col { grid-column: 1 / -1; }

        .ts-coaching-box {
          background: rgba(64,97,132,0.07);
          border-left: 3px solid var(--ts-accent);
          border-radius: 0 var(--ts-radius-sm) var(--ts-radius-sm) 0;
          padding: 14px 16px;
          font-size: 14px; line-height: 1.7; margin-bottom: 16px;
        }

        .ts-pattern-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .ts-pattern-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 8px;
          background: rgba(184,106,0,0.06);
          border: 1px solid rgba(184,106,0,0.18);
          font-size: 13px;
        }
        .ts-pattern-chip-icon { color: var(--ts-warn); font-size: 12px; }

        .ts-pattern-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 14px 0; border-bottom: 1px solid var(--ts-border-soft);
        }
        .ts-pattern-row:last-child { border-bottom: none; }
        .ts-pattern-num {
          width: 26px; height: 26px; flex-shrink: 0; border-radius: 8px;
          background: rgba(184,106,0,0.08); border: 1px solid rgba(184,106,0,0.18);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: var(--ts-warn);
        }
        .ts-pattern-row-title { font-size: 14px; font-weight: 650; margin-bottom: 3px; }
        .ts-pattern-row-sub { font-size: 12px; color: var(--ts-muted); }
        .ts-pattern-severity {
          margin-left: auto; flex-shrink: 0;
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
          background: rgba(184,106,0,0.08); border: 1px solid rgba(184,106,0,0.18);
          color: var(--ts-warn);
        }

        .ts-spark-wrap { padding-bottom: 4px; }
        .ts-spark-labels { display: flex; justify-content: space-between; margin-top: 10px; }
        .ts-spark-lbl { font-size: 11px; color: var(--ts-muted); }

        .ts-conv-excerpt {
          font-size: 12px; color: var(--ts-muted);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;
        }

        .ts-window-chips { display: flex; gap: 4px; }
        .ts-window-chip {
          padding: 6px 12px; border-radius: 8px;
          border: 1px solid var(--ts-border); background: var(--ts-surface);
          font-size: 13px; font-weight: 650; color: var(--ts-muted);
          cursor: pointer; transition: all 0.12s;
        }
        .ts-window-chip.active {
          background: rgba(64,97,132,0.1); border-color: rgba(64,97,132,0.3); color: var(--ts-accent);
        }

        .ts-skeleton {
          background: var(--ts-border-soft); border-radius: 6px;
          animation: ts-pulse 1.4s ease-in-out infinite;
        }
        @keyframes ts-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .ts-history-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid var(--ts-border-soft);
        }
        .ts-history-item:last-child { border-bottom: none; }
        .ts-history-date { font-size: 12px; color: var(--ts-muted); min-width: 90px; }
        .ts-history-score { font-size: 14px; font-weight: 750; }
        .ts-history-bar { flex: 1; }

        .ts-section-label {
          font-size: 11px; font-weight: 800; color: var(--ts-muted);
          text-transform: uppercase; letter-spacing: 0.07em;
          margin-bottom: 10px; margin-top: 20px;
        }
        .ts-section-label:first-child { margin-top: 0; }
      `}</style>

      <div className="ts-container">

        {/* BREADCRUMB */}
        <div className="ts-breadcrumb">
          <a href="/app/dashboard" className="ts-bc-link">Dashboard</a>
          <span className="ts-bc-sep">›</span>
          {teamName && <><span className="ts-bc-link">{teamName}</span><span className="ts-bc-sep">›</span></>}
          <span className="ts-bc-current">{loading ? "Loading…" : agentName}</span>
        </div>

        {/* HERO */}
        <div className="ts-agent-hero">
          <div className="ts-agent-hero-left">
            <div className="ts-agent-avatar">{initials(agentName)}</div>
            <div>
              <div className="ts-agent-name">{loading ? "Loading…" : agentName}</div>
              <div className="ts-agent-meta">
                {teamName && (
                  <span className="ts-chip ts-chip-accent" style={{ fontSize: 12, padding: "4px 10px" }}>
                    {teamName}
                  </span>
                )}
                {orgName && (
                  <><span className="ts-agent-meta-sep">·</span>
                  <span className="ts-agent-meta-text">{orgName}</span></>
                )}
                {data?.conversations && (
                  <><span className="ts-agent-meta-sep">·</span>
                  <span className="ts-agent-meta-text">{data.conversations.length} conversations</span></>
                )}
              </div>
            </div>
          </div>

          <div className="ts-hero-actions">
            <div className="ts-window-chips">
              {[20, 30, 50].map((n) => (
                <button
                  key={n}
                  className={`ts-window-chip ${windowSize === n ? "active" : ""}`}
                  onClick={() => setWindowSize(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button className="ts-btn" onClick={generateScore} disabled={actionLoading || !agentId}>
              {actionLoading ? "Working…" : "Generate Score"}
            </button>
            <button className="ts-btn ts-btn-primary" onClick={generatePatternsAgent} disabled={actionLoading || !agentId}>
              {actionLoading ? "Working…" : "Generate Patterns"}
            </button>
            <button className="ts-btn" onClick={copyId} disabled={!agentId}>
              {copied ? "✓ Copied" : "Copy ID"}
            </button>
            <button className="ts-btn" onClick={downloadPdf} disabled={!last}>
              ↓ PDF Report
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {(msgErr || actionErr) && (
          <div className="ts-alert ts-alert-error" style={{ marginBottom: 16 }}>{msgErr || actionErr}</div>
        )}
        {actionOk && (
          <div className="ts-alert ts-alert-ok" style={{ marginBottom: 16 }}>{actionOk}</div>
        )}

        {/* KPI STRIP */}
        <div className="ts-kpi-strip">
          {/* Overall */}
          <div className="ts-kpi-card">
            <div className="ts-kpi-ring-wrap">
              <ScoreRing value={last?.overallScore} color={scoreColor(last?.overallScore)} />
              <span className="ts-kpi-ring-label" style={{ color: scoreColor(last?.overallScore) }}>
                {last?.overallScore != null ? Math.round(last.overallScore) : "—"}
              </span>
            </div>
            <div className="ts-kpi-right">
              <div className="ts-kpi-label">Overall</div>
              <div className="ts-kpi-sub">Score snapshot</div>
              {last?.createdAt && (
                <div className="ts-kpi-sub">{new Date(last.createdAt).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          {/* Communication */}
          <div className="ts-kpi-card">
            <div className="ts-kpi-right">
              <div className="ts-kpi-label">Communication</div>
              <div className="ts-kpi-big" style={{ color: scoreColor(last?.communicationScore) }}>
                {fmt(last?.communicationScore)}
              </div>
              <MiniBar value={last?.communicationScore} color={scoreColor(last?.communicationScore)} />
            </div>
          </div>

          {/* Conversion */}
          <div className="ts-kpi-card">
            <div className="ts-kpi-right">
              <div className="ts-kpi-label">Conversion</div>
              <div className="ts-kpi-big" style={{ color: scoreColor(last?.conversionScore) }}>
                {fmt(last?.conversionScore)}
              </div>
              <MiniBar value={last?.conversionScore} color={scoreColor(last?.conversionScore)} />
            </div>
          </div>

          {/* Risk */}
          <div className="ts-kpi-card">
            <div className="ts-kpi-right">
              <div className="ts-kpi-label">Risk Signal</div>
              <div className="ts-kpi-big" style={{ color: riskColor(last?.riskScore) }}>
                {fmt(last?.riskScore)}
              </div>
              <MiniBar value={last?.riskScore} color={riskColor(last?.riskScore)} />
              <div className="ts-kpi-sub">{riskLabel(last?.riskScore)}</div>
            </div>
          </div>

          {/* Coaching Priority */}
          <div className="ts-kpi-card">
            <div className="ts-kpi-right">
              <div className="ts-kpi-label">Coaching Priority</div>
              <div className="ts-kpi-big" style={{ color: riskColor(last?.coachingPriority) }}>
                {fmt(last?.coachingPriority)}
              </div>
              <span className={priorityChipClass(last?.coachingPriority)} style={{ fontSize: 12, padding: "3px 10px" }}>
                {priorityLabel(last?.coachingPriority)}
              </span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="ts-tabs">
          {(["overview", "conversations", "patterns"] as const).map((tab) => (
            <button
              key={tab}
              className={`ts-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="ts-two-col">

            {/* Strengths */}
            <div className="ts-card">
              <div className="ts-card-pad">
                <div className="ts-sectionhead">
                  <div>
                    <div className="ts-h2">Strengths</div>
                    <div className="ts-hint">What this agent does well</div>
                  </div>
                  <span className="ts-chip ts-chip-success" style={{ fontSize: 12 }}>
                    {last?.strengths?.length ?? 0} signals
                  </span>
                </div>
                <div className="ts-divider" />
                {!last?.strengths?.length ? (
                  <div className="ts-panel" style={{ padding: 14 }}>
                    <span className="ts-muted">No score data yet. Generate a score first.</span>
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {last.strengths.map((s, i) => (
                      <li key={i} style={{ paddingLeft: 22, position: "relative", marginBottom: 10, fontSize: 14, lineHeight: 1.5 }}>
                        <span style={{ position: "absolute", left: 0, color: "var(--ts-success)", fontWeight: 800 }}>✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="ts-card">
              <div className="ts-card-pad">
                <div className="ts-sectionhead">
                  <div>
                    <div className="ts-h2">Areas to Improve</div>
                    <div className="ts-hint">Focus for coaching sessions</div>
                  </div>
                  <span className="ts-chip ts-chip-danger" style={{ fontSize: 12 }}>
                    {last?.weaknesses?.length ?? 0} issues
                  </span>
                </div>
                <div className="ts-divider" />
                {!last?.weaknesses?.length ? (
                  <div className="ts-panel" style={{ padding: 14 }}>
                    <span className="ts-muted">No score data yet. Generate a score first.</span>
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {last.weaknesses.map((w, i) => (
                      <li key={i} style={{ paddingLeft: 22, position: "relative", marginBottom: 10, fontSize: 14, lineHeight: 1.5 }}>
                        <span style={{ position: "absolute", left: 0, color: "var(--ts-danger)", fontWeight: 800 }}>✗</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Coaching Recommendation */}
            <div className="ts-card ts-full-col">
              <div className="ts-card-pad">
                <div className="ts-sectionhead">
                  <div>
                    <div className="ts-h2">Coaching Recommendation</div>
                    <div className="ts-hint">Key patterns and coaching focus from latest score</div>
                  </div>
                </div>
                <div className="ts-divider" />
                {!last?.keyPatterns?.length ? (
                  <div className="ts-panel" style={{ padding: 14 }}>
                    <span className="ts-muted">No coaching data yet. Generate a score to see recommendations.</span>
                  </div>
                ) : (
                  <>
                    <div className="ts-coaching-box">
                      Coaching priority: <strong>{priorityLabel(last.coachingPriority)}</strong> — review the patterns below.
                      Risk level is <strong>{riskLabel(last.riskScore)}</strong> (score: {fmt(last.riskScore)}).
                    </div>
                    <div className="ts-pattern-chips">
                      {last.keyPatterns.map((p, i) => (
                        <div key={i} className="ts-pattern-chip">
                          <span className="ts-pattern-chip-icon">⚠</span>
                          {p}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Score Trend */}
            <div className="ts-card ts-full-col">
              <div className="ts-card-pad">
                <div className="ts-sectionhead">
                  <div>
                    <div className="ts-h2">Score Trend</div>
                    <div className="ts-hint">Overall score history</div>
                  </div>
                  {data?.trend && (
                    <span className="ts-chip ts-chip-muted" style={{ fontSize: 12 }}>
                      {data.trend.length} snapshots
                    </span>
                  )}
                </div>
                <div className="ts-divider" />
                {!data?.trend?.length ? (
                  <div className="ts-panel" style={{ padding: 14 }}>
                    <span className="ts-muted">No history yet. Generate a score to start tracking trends.</span>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "start" }}>
                    <div className="ts-spark-wrap">
                      <SparkLine data={data.trend} />
                      <div className="ts-spark-labels">
                        <span className="ts-spark-lbl">
                          {new Date(data.trend[0].createdAt).toLocaleDateString()}
                        </span>
                        <span className="ts-spark-lbl">
                          {new Date(data.trend[data.trend.length - 1].createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      {data.trend.slice(-5).reverse().map((t, i) => (
                        <div key={i} className="ts-history-item">
                          <span className="ts-history-date">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                          <span className="ts-history-score" style={{ color: scoreColor(t.score) }}>
                            {t.score.toFixed(1)}
                          </span>
                          <div className="ts-history-bar">
                            <MiniBar value={t.score} color={scoreColor(t.score)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB: CONVERSATIONS ── */}
        {activeTab === "conversations" && (
          <div className="ts-card">
            <div className="ts-card-pad">
              <div className="ts-sectionhead">
                <div>
                  <div className="ts-h2">Recent Conversations</div>
                  <div className="ts-hint">
                    Last {data?.conversations?.length ?? 0} conversations for this agent
                  </div>
                </div>
              </div>
              <div className="ts-divider" />
              {!data?.conversations?.length ? (
                <div className="ts-panel" style={{ padding: 16 }}>
                  <span className="ts-muted">No conversations found.</span>
                </div>
              ) : (
                <table className="ts-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.conversations.map((c) => (
                      <tr key={c.id} className="ts-row-hover">
                        <td style={{ whiteSpace: "nowrap", color: "var(--ts-muted)", fontSize: 13 }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {c.score != null ? (
                            <span className={scoreChipClass(c.score)} style={{ fontSize: 12, padding: "3px 10px" }}>
                              {Number(c.score).toFixed(1)}
                            </span>
                          ) : (
                            <span className="ts-chip ts-chip-muted" style={{ fontSize: 12, padding: "3px 10px" }}>—</span>
                          )}
                        </td>
                        <td className="ts-conv-excerpt">
                          {c.excerpt || c.transcript.slice(0, 180)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: PATTERNS ── */}
        {activeTab === "patterns" && (
          <div className="ts-card">
            <div className="ts-card-pad">
              <div className="ts-sectionhead">
                <div>
                  <div className="ts-h2">Pattern Intelligence</div>
                  <div className="ts-hint">Repeating behavioral signals across last {windowSize} conversations</div>
                </div>
                <a
                  className="ts-btn"
                  href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=${windowSize}`}
                >
                  Full Report →
                </a>
              </div>
              <div className="ts-divider" />

              {patternLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="ts-skeleton" style={{ height: 48 }} />
                  ))}
                </div>
              )}

              {!patternLoading && !patternReport && (
                <div className="ts-panel" style={{ padding: 16 }}>
                  <div style={{ fontWeight: 750, marginBottom: 6 }}>No pattern report yet.</div>
                  <div className="ts-muted" style={{ fontSize: 13 }}>
                    Click <strong>Generate Patterns</strong> above to create the first report.
                  </div>
                  {patternErr && (
                    <div className="ts-muted" style={{ marginTop: 8, fontSize: 12 }}>{patternErr}</div>
                  )}
                </div>
              )}

              {!patternLoading && patternReport && (
                <>
                  <div className="ts-panel" style={{ padding: 12, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="ts-chip ts-chip-muted" style={{ fontSize: 12 }}>Window: {patternReport.windowSize}</span>
                    <span className="ts-chip ts-chip-accent" style={{ fontSize: 12 }}>
                      {new Date(patternReport.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {patternReport.keyPatterns?.length > 0 && (
                    <>
                      <div className="ts-section-label">Key Patterns</div>
                      {patternReport.keyPatterns.map((p: string, i: number) => (
                        <div key={i} className="ts-pattern-row">
                          <div className="ts-pattern-num">{i + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div className="ts-pattern-row-title">{p}</div>
                            <div className="ts-pattern-row-sub">Detected in recent conversations</div>
                          </div>
                          <span className="ts-pattern-severity">Pattern</span>
                        </div>
                      ))}
                    </>
                  )}

                  {patternReport.riskTriggers?.length > 0 && (
                    <>
                      <div className="ts-section-label" style={{ marginTop: 20 }}>Risk Triggers</div>
                      {patternReport.riskTriggers.map((r: string, i: number) => (
                        <div key={i} className="ts-pattern-row">
                          <div className="ts-pattern-num" style={{ background: "rgba(180,35,24,0.08)", borderColor: "rgba(180,35,24,0.18)", color: "var(--ts-danger)" }}>!</div>
                          <div style={{ flex: 1 }}>
                            <div className="ts-pattern-row-title">{r}</div>
                            <div className="ts-pattern-row-sub">Risk signal — coaching recommended</div>
                          </div>
                          <span className="ts-pattern-severity" style={{ background: "rgba(180,35,24,0.08)", borderColor: "rgba(180,35,24,0.18)", color: "var(--ts-danger)" }}>
                            Risk
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {patternReport.coachingRecommendations?.length > 0 && (
                    <>
                      <div className="ts-section-label" style={{ marginTop: 20 }}>Coaching Recommendations</div>
                      <div className="ts-coaching-box">
                        {patternReport.coachingRecommendations.map((r: string, i: number) => (
                          <div key={i} style={{ marginBottom: i < patternReport.coachingRecommendations.length - 1 ? 8 : 0 }}>
                            {i + 1}. {r}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* FOOTER META */}
        <div style={{ marginTop: 40, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--ts-border)", fontFamily: "ui-monospace, monospace" }}>
            id: {agentId}
          </span>
          {agent?.createdAt && (
            <>
              <span style={{ color: "var(--ts-border-soft)" }}>·</span>
              <span style={{ fontSize: 12, color: "var(--ts-border)", fontFamily: "ui-monospace, monospace" }}>
                joined: {new Date(agent.createdAt).toLocaleDateString()}
              </span>
            </>
          )}
        </div>

      </div>
    </>
  );
}
