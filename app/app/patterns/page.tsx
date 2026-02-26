"use client";


export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Level = "agent" | "team" | "org";

function isLevel(x: string): x is Level {
  return x === "agent" || x === "team" || x === "org";
}

function safeJson(txt: string) {
  try { return { ok: true as const, json: JSON.parse(txt) }; }
  catch (e: any) { return { ok: false as const, error: e?.message }; }
}

type PatternReport = {
  executive_summary: string;
  top_recurring_issues: {
    issue: string;
    frequency_estimate: string;
    impact: string;
    evidence_examples: { conversation_id: string; quote_or_moment: string; why_it_matters: string }[];
    root_cause_hypotheses: string[];
    coaching_actions: string[];
    training_recommendations: string[];
  }[];
  quick_wins_next_7_days: string[];
  metrics_to_track: string[];
};

function PatternsInner() {
  const sp = useSearchParams();
  const [level, setLevel] = useState<Level>("agent");
  const [refId, setRefId] = useState("");
  const [windowSize, setWindowSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ meta: any; report: PatternReport } | null>(null);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [openIssue, setOpenIssue] = useState<number | null>(0);

  useEffect(() => {
    const qLevel = sp.get("level") || "";
    const qRefId = sp.get("refId") || "";
    const qWin = Number(sp.get("windowSize") || sp.get("window") || "");
    if (qLevel && isLevel(qLevel)) setLevel(qLevel);
    if (qRefId) setRefId(qRefId);
    if (qWin >= 10 && qWin <= 100) setWindowSize(qWin);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  useEffect(() => {
    fetch("/api/meta/agents", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAgents(j.agents?.map((a: any) => ({ id: a.id, name: a.name })) ?? []))
      .catch(() => {});
  }, []);

  const canGenerate = useMemo(() => refId.trim().length > 0, [refId]);

  async function generate() {
    setLoading(true);
    setErr(null);
    setResult(null);
    setOpenIssue(0);
    try {
      const r = await fetch("/api/patterns/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, refId: refId.trim(), windowSize }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`${r.status}: ${txt.slice(0, 300)}`);
      const p = safeJson(txt);
      if (!p.ok) throw new Error("Invalid JSON response");
      if (p.json?.ok === false) throw new Error(p.json.error || "Generation failed");
      setResult(p.json);
    } catch (e: any) {
      setErr(e?.message || "Failed to generate patterns");
    } finally {
      setLoading(false);
    }
  }

  const report = result?.report;

  return (
    <>
      <style>{`
        .ts-pi-controls {
          display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;
        }
        .ts-pi-select {
          height:38px; padding:0 12px; border-radius:10px;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          color:var(--ts-ink); font-size:14px; outline:none;
        }
        .ts-pi-select:focus { border-color:rgba(64,97,132,0.5); }

        /* Summary box */
        .ts-pi-summary {
          background: rgba(64,97,132,0.06);
          border: 1px solid rgba(64,97,132,0.18);
          border-left: 4px solid var(--ts-accent);
          border-radius: 0 var(--ts-radius-md) var(--ts-radius-md) 0;
          padding: 18px 20px;
          font-size: 15px; line-height: 1.7;
          margin-bottom: 24px;
          overflow-wrap: break-word; word-break: normal; white-space: normal;
        }

        /* Issue card */
        .ts-issue-card {
          background: var(--ts-surface);
          border: 1px solid var(--ts-border);
          border-radius: var(--ts-radius-lg);
          margin-bottom: 12px;
          overflow: hidden;
          transition: box-shadow 0.15s;
        }
        .ts-issue-card:hover { box-shadow: var(--ts-shadow-md); }
        .ts-issue-header {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 20px; cursor: pointer;
        }
        .ts-issue-num {
          width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800;
          background: rgba(184,106,0,0.1); color: var(--ts-warn);
          border: 1px solid rgba(184,106,0,0.2);
        }
        .ts-issue-title { font-size: 15px; font-weight: 750; flex: 1; line-height: 1.4; min-width: 0; overflow-wrap: break-word; word-break: normal; white-space: normal; }
        .ts-issue-freq {
          font-size: 12px; font-weight: 650;
          padding: 4px 10px; border-radius: 20px;
          background: rgba(184,106,0,0.08); border: 1px solid rgba(184,106,0,0.2);
          color: var(--ts-warn); white-space: nowrap;
        }
        .ts-issue-chevron { color: var(--ts-muted); font-size: 12px; flex-shrink:0; }
        .ts-issue-body { padding: 0 16px 16px; border-top: 1px solid var(--ts-border-soft); padding-top: 16px; overflow: hidden; overflow-wrap: break-word; word-break: normal; }

        /* Impact banner */
        .ts-impact-banner {
          background: rgba(180,35,24,0.06);
          border: 1px solid rgba(180,35,24,0.15);
          border-radius: var(--ts-radius-sm);
          padding: 10px 14px;
          font-size: 13px; color: var(--ts-danger); line-height: 1.6;
          margin-bottom: 16px;
        }
        .ts-impact-banner-label {
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--ts-danger); margin-bottom: 4px;
        }

        /* Sections inside issue */
        .ts-issue-section { margin-bottom: 18px; }
        .ts-issue-section-title {
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--ts-muted);
          margin-bottom: 10px;
        }

        /* Evidence items */
        .ts-evidence-item {
          background: var(--ts-bg-soft);
          border: 1px solid var(--ts-border-soft);
          border-radius: var(--ts-radius-sm);
          padding: 12px 14px;
          margin-bottom: 8px;
        }
        .ts-evidence-quote {
          font-size: 13px; font-style: italic;
          color: var(--ts-ink); margin-bottom: 4px; line-height: 1.5;
        }
        .ts-evidence-why { font-size: 12px; color: var(--ts-muted); }
        .ts-evidence-id { font-size: 11px; font-family: ui-monospace,monospace; color: var(--ts-border); margin-bottom: 6px; }

        /* List items */
        .ts-pi-list { list-style: none; padding: 0; margin: 0; }
        .ts-pi-list li {
          padding: 7px 0 7px 20px; position: relative;
          font-size: 14px; line-height: 1.5; font-weight: 500;
          border-bottom: 1px solid var(--ts-border-soft);
        }
        .ts-pi-list li:last-child { border-bottom: none; }
        .ts-pi-list li::before {
          content: ""; position: absolute; left: 0; top: 0.65em;
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--ts-accent); opacity: 0.7;
        }
        .ts-pi-list.danger li::before { background: var(--ts-danger); }
        .ts-pi-list.success li::before { background: var(--ts-success); }

        /* Bottom grid */
        .ts-pi-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
        @media(max-width:700px) {
          .ts-pi-bottom { grid-template-columns: 1fr; }
          .ts-pi-controls { flex-direction: column; align-items: stretch; }
          .ts-pi-select { width: 100%; }
          .ts-pi-summary { font-size: 14px; padding: 14px 16px; overflow-wrap: break-word; word-break: normal; }
          .ts-issue-title { font-size: 13px; }
          .ts-issue-row { flex-wrap: wrap; }
          .ts-evidence-id { overflow-wrap: anywhere; word-break: break-word; }
        }

        /* Skeleton */
        .ts-skel { background: var(--ts-border-soft); border-radius: 10px; animation: ts-pulse 1.4s ease-in-out infinite; margin-bottom: 10px; }
        @keyframes ts-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `
	  
	  @media (max-width: 700px) {
  .ts-issue-header {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .ts-issue-title {
    flex: 1 1 100%;
  }

  .ts-issue-freq {
    white-space: normal;
    margin-left: 46px;
  }
}
}</style>

      <div className="ts-container">
        {/* HEAD */}
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Pattern Intelligence</div>
            <div className="ts-subtitle">Deep behavioral analysis across conversations</div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="ts-card" style={{ marginBottom: 24 }}>
          <div className="ts-card-pad">
            <div className="ts-pi-controls">
              <div>
                <div className="ts-card-title" style={{ marginBottom: 6 }}>Level</div>
                <select className="ts-pi-select" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                  <option value="agent">Agent</option>
                  <option value="team">Team</option>
                  <option value="org">Organization</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <div className="ts-card-title" style={{ marginBottom: 6 }}>
                  {level === "agent" ? "Agent" : level === "team" ? "Team ID" : "Org ID"}
                </div>
                {level === "agent" ? (
                  <select className="ts-pi-select" style={{ width: "100%" }} value={refId} onChange={(e) => setRefId(e.target.value)}>
                    <option value="">Select agent…</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                ) : (
                  <input
                    className="ts-pi-select"
                    style={{ width: "100%", fontFamily: "ui-monospace,monospace" }}
                    placeholder={level === "team" ? "team_xxx" : "org_xxx"}
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                  />
                )}
              </div>

              <div>
                <div className="ts-card-title" style={{ marginBottom: 6 }}>Window</div>
                <select className="ts-pi-select" value={windowSize} onChange={(e) => setWindowSize(Number(e.target.value))}>
                  {[20, 30, 50, 80, 100].map((n) => <option key={n} value={n}>Last {n}</option>)}
                </select>
              </div>

              <button className="ts-btn ts-btn-primary" onClick={generate} disabled={!canGenerate || loading} style={{ alignSelf: "flex-end" }}>
                {loading ? "Analyzing…" : "Generate Patterns"}
              </button>
            </div>

            {err && <div className="ts-alert ts-alert-error" style={{ marginTop: 14 }}>{err}</div>}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div>
            <div className="ts-skel" style={{ height: 80 }} />
            <div className="ts-skel" style={{ height: 120 }} />
            <div className="ts-skel" style={{ height: 120 }} />
          </div>
        )}

        {/* EMPTY */}
        {!loading && !result && (
          <div className="ts-card">
            <div className="ts-card-pad" style={{ textAlign: "center", padding: "52px 24px" }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
              <div style={{ fontWeight: 750, fontSize: 16, marginBottom: 8 }}>Select agent and click Generate</div>
              <div className="ts-muted" style={{ fontSize: 13 }}>TalkScope will analyze the last N conversations and extract recurring behavioral patterns, risk triggers, and coaching priorities.</div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {!loading && result && report && (
          <>
            {/* Meta strip */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
              {result.meta?.agentName && <span className="ts-chip ts-chip-accent" style={{ fontSize: 13 }}>{result.meta.agentName}</span>}
              {result.meta?.teamName && <span className="ts-chip ts-chip-muted" style={{ fontSize: 12 }}>{result.meta.teamName}</span>}
              {result.meta?.orgName && <span className="ts-chip ts-chip-muted" style={{ fontSize: 12 }}>{result.meta.orgName}</span>}
              <span className="ts-chip ts-chip-muted" style={{ fontSize: 12 }}>Last {windowSize} conversations</span>
              <span className="ts-chip ts-chip-warn" style={{ fontSize: 12 }}>{report.top_recurring_issues?.length ?? 0} issues found</span>
            </div>

            {/* Executive Summary */}
            {report.executive_summary && (
              <div className="ts-pi-summary">
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ts-accent)", marginBottom: 8 }}>
                  Executive Summary
                </div>
                {report.executive_summary}
              </div>
            )}

            {/* Issues */}
            {report.top_recurring_issues?.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ts-muted)", marginBottom: 14 }}>
                  Top Recurring Issues ({report.top_recurring_issues.length})
                </div>
                {report.top_recurring_issues.map((issue, i) => (
                  <div key={i} className="ts-issue-card">
                    {/* Header — clickable */}
                    <div className="ts-issue-header" onClick={() => setOpenIssue(openIssue === i ? null : i)}>
                      <div className="ts-issue-num">{i + 1}</div>
                      <div className="ts-issue-title">{issue.issue}</div>
                      <div className="ts-issue-freq">{issue.frequency_estimate}</div>
                      <div className="ts-issue-chevron">{openIssue === i ? "▲" : "▼"}</div>
                    </div>

                    {/* Body — expanded */}
                    {openIssue === i && (
                      <div className="ts-issue-body">
                        {/* Impact */}
                        <div className="ts-impact-banner">
                          <div className="ts-impact-banner-label">Business Impact</div>
                          {issue.impact}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                          {/* Evidence */}
                          <div className="ts-issue-section">
                            <div className="ts-issue-section-title">Evidence Examples</div>
                            {issue.evidence_examples?.map((e, j) => (
                              <div key={j} className="ts-evidence-item">
                                <div className="ts-evidence-id">#{e.conversation_id?.slice(-8)}</div>
                                <div className="ts-evidence-quote">"{e.quote_or_moment}"</div>
                                <div className="ts-evidence-why">→ {e.why_it_matters}</div>
                              </div>
                            ))}
                          </div>

                          {/* Root causes */}
                          <div className="ts-issue-section">
                            <div className="ts-issue-section-title">Root Cause Hypotheses</div>
                            <ul className="ts-pi-list danger">
                              {issue.root_cause_hypotheses?.map((h, j) => <li key={j}>{h}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                          {/* Coaching actions */}
                          <div className="ts-issue-section">
                            <div className="ts-issue-section-title">Coaching Actions</div>
                            <ul className="ts-pi-list">
                              {issue.coaching_actions?.map((a, j) => <li key={j}>{a}</li>)}
                            </ul>
                          </div>

                          {/* Training */}
                          <div className="ts-issue-section">
                            <div className="ts-issue-section-title">Training Recommendations</div>
                            <ul className="ts-pi-list success">
                              {issue.training_recommendations?.map((t, j) => <li key={j}>{t}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bottom: Quick Wins + Metrics */}
            <div className="ts-pi-bottom">
              {report.quick_wins_next_7_days?.length > 0 && (
                <div className="ts-card">
                  <div className="ts-card-pad">
                    <div className="ts-sectionhead">
                      <div className="ts-h2">Quick Wins — Next 7 Days</div>
                      <span className="ts-chip ts-chip-success" style={{ fontSize: 12 }}>{report.quick_wins_next_7_days.length}</span>
                    </div>
                    <div className="ts-divider" />
                    <ul className="ts-pi-list success">
                      {report.quick_wins_next_7_days.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {report.metrics_to_track?.length > 0 && (
                <div className="ts-card">
                  <div className="ts-card-pad">
                    <div className="ts-sectionhead">
                      <div className="ts-h2">Metrics to Track</div>
                      <span className="ts-chip ts-chip-accent" style={{ fontSize: 12 }}>{report.metrics_to_track.length}</span>
                    </div>
                    <div className="ts-divider" />
                    <ul className="ts-pi-list">
                      {report.metrics_to_track.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function PatternIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="ts-container">
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ts-muted)" }}>Loading…</div>
      </div>
    }>
      <PatternsInner />
    </Suspense>
  );
}
