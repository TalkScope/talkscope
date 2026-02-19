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

function PatternsInner() {
  const sp = useSearchParams();
  const [level, setLevel] = useState<Level>("agent");
  const [refId, setRefId] = useState("");
  const [windowSize, setWindowSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);

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

  const canGenerate = useMemo(() => refId.trim().length > 0 && windowSize >= 10, [refId, windowSize]);

  async function generate() {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const r = await fetch("/api/patterns/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, refId: refId.trim(), windowSize }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Generate failed ${r.status}: ${txt.slice(0, 300)}`);
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

  const report = result?.report ?? result ?? null;

  return (
    <>
      <style>{`
        .ts-patterns-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:20px; }
        @media(max-width:700px){.ts-patterns-grid{grid-template-columns:1fr;}}
        .ts-pattern-section-label {
          font-size:11px; font-weight:800; text-transform:uppercase;
          letter-spacing:0.08em; color:var(--ts-muted); margin-bottom:10px;
        }
        .ts-pattern-item {
          display:flex; align-items:flex-start; gap:12px;
          padding:12px 0; border-bottom:1px solid var(--ts-border-soft);
        }
        .ts-pattern-item:last-child { border-bottom:none; }
        .ts-pattern-num {
          width:24px; height:24px; border-radius:7px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:800;
        }
        .ts-pattern-text { font-size:14px; font-weight:600; line-height:1.5; }
        .ts-pattern-sub { font-size:12px; color:var(--ts-muted); margin-top:2px; }
        .ts-meta-box {
          background:var(--ts-bg-soft); border:1px solid var(--ts-border-soft);
          border-radius:var(--ts-radius-md); padding:14px 16px;
          margin-bottom:18px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;
        }
        .ts-select-inline {
          height:36px; padding:0 10px; border-radius:8px;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          color:var(--ts-ink); font-size:13px; outline:none;
        }
        .ts-input-inline {
          height:36px; padding:0 12px; border-radius:8px;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          color:var(--ts-ink); font-size:13px; outline:none; flex:1; min-width:180px;
          font-family:ui-monospace,monospace;
        }
        .ts-input-inline:focus { border-color:rgba(64,97,132,0.5); }
      `}</style>

      <div className="ts-container">
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Pattern Intelligence</div>
            <div className="ts-subtitle">Detect recurring behavioral signals across agents, teams, or organization</div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="ts-card">
          <div className="ts-card-pad">
            <div className="ts-sectionhead">
              <div className="ts-h2">Generate Pattern Report</div>
            </div>
            <div className="ts-divider" />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div className="ts-card-title" style={{ marginBottom: 6 }}>Level</div>
                <select className="ts-select-inline" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                  <option value="agent">Agent</option>
                  <option value="team">Team</option>
                  <option value="org">Organization</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <div className="ts-card-title" style={{ marginBottom: 6 }}>
                  {level === "agent" ? "Select Agent" : level === "team" ? "Team ID" : "Org ID"}
                </div>
                {level === "agent" ? (
                  <select className="ts-select-inline" style={{ width: "100%" }} value={refId} onChange={(e) => setRefId(e.target.value)}>
                    <option value="">Select agent…</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                ) : (
                  <input
                    className="ts-input-inline"
                    placeholder={level === "team" ? "team_xxx" : "org_xxx"}
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                  />
                )}
              </div>

              <div>
                <div className="ts-card-title" style={{ marginBottom: 6 }}>Window</div>
                <select className="ts-select-inline" value={windowSize} onChange={(e) => setWindowSize(Number(e.target.value))}>
                  {[20, 30, 50, 80, 100].map((n) => <option key={n} value={n}>{n} conversations</option>)}
                </select>
              </div>

              <button className="ts-btn ts-btn-primary" onClick={generate} disabled={!canGenerate || loading}>
                {loading ? "Generating…" : "Generate Patterns"}
              </button>
            </div>

            {err && <div className="ts-alert ts-alert-error" style={{ marginTop: 14 }}>{err}</div>}
          </div>
        </div>

        {/* RESULTS */}
        {loading && (
          <div className="ts-card" style={{ marginTop: 16 }}>
            <div className="ts-card-pad" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 14, color: "var(--ts-muted)" }}>Analyzing patterns in last {windowSize} conversations…</div>
            </div>
          </div>
        )}

        {!loading && result && (
          <>
            {/* Meta */}
            {result.meta && (
              <div className="ts-meta-box" style={{ marginTop: 20 }}>
                <span className="ts-chip ts-chip-accent" style={{ fontSize: 12 }}>{result.meta.agentName || result.meta.teamName || result.meta.orgName || refId}</span>
                <span className="ts-chip ts-chip-muted" style={{ fontSize: 12 }}>Level: {level}</span>
                <span className="ts-chip ts-chip-muted" style={{ fontSize: 12 }}>Window: {windowSize}</span>
              </div>
            )}

            <div className="ts-patterns-grid">
              {/* Key Patterns */}
              {report?.keyPatterns?.length > 0 && (
                <div className="ts-card">
                  <div className="ts-card-pad">
                    <div className="ts-sectionhead">
                      <div className="ts-h2">Key Patterns</div>
                      <span className="ts-chip ts-chip-warn" style={{ fontSize: 12 }}>{report.keyPatterns.length}</span>
                    </div>
                    <div className="ts-divider" />
                    {report.keyPatterns.map((p: string, i: number) => (
                      <div key={i} className="ts-pattern-item">
                        <div className="ts-pattern-num" style={{ background: "rgba(184,106,0,0.1)", color: "var(--ts-warn)" }}>{i + 1}</div>
                        <div>
                          <div className="ts-pattern-text">{p}</div>
                          <div className="ts-pattern-sub">Recurring pattern detected</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Triggers */}
              {report?.riskTriggers?.length > 0 && (
                <div className="ts-card">
                  <div className="ts-card-pad">
                    <div className="ts-sectionhead">
                      <div className="ts-h2">Risk Triggers</div>
                      <span className="ts-chip ts-chip-danger" style={{ fontSize: 12 }}>{report.riskTriggers.length}</span>
                    </div>
                    <div className="ts-divider" />
                    {report.riskTriggers.map((r: string, i: number) => (
                      <div key={i} className="ts-pattern-item">
                        <div className="ts-pattern-num" style={{ background: "rgba(180,35,24,0.1)", color: "var(--ts-danger)" }}>!</div>
                        <div>
                          <div className="ts-pattern-text">{r}</div>
                          <div className="ts-pattern-sub">Risk signal — immediate coaching recommended</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching Recommendations */}
              {report?.coachingRecommendations?.length > 0 && (
                <div className="ts-card ts-full-col" style={{ gridColumn: "1 / -1" }}>
                  <div className="ts-card-pad">
                    <div className="ts-sectionhead">
                      <div className="ts-h2">Coaching Recommendations</div>
                      <span className="ts-chip ts-chip-accent" style={{ fontSize: 12 }}>{report.coachingRecommendations.length} actions</span>
                    </div>
                    <div className="ts-divider" />
                    {report.coachingRecommendations.map((r: string, i: number) => (
                      <div key={i} className="ts-pattern-item">
                        <div className="ts-pattern-num" style={{ background: "rgba(64,97,132,0.1)", color: "var(--ts-accent)" }}>{i + 1}</div>
                        <div className="ts-pattern-text">{r}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw JSON fallback */}
              {!report?.keyPatterns && !report?.riskTriggers && (
                <div className="ts-card" style={{ gridColumn: "1 / -1" }}>
                  <div className="ts-card-pad">
                    <div className="ts-h2" style={{ marginBottom: 12 }}>Pattern Report</div>
                    <pre style={{ background: "var(--ts-bg-soft)", borderRadius: "var(--ts-radius-md)", padding: 16, fontSize: 12, overflow: "auto", maxHeight: 400, lineHeight: 1.6 }}>
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!loading && !result && (
          <div className="ts-card" style={{ marginTop: 16 }}>
            <div className="ts-card-pad" style={{ textAlign: "center", padding: "40px 24px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 750, marginBottom: 8 }}>No pattern report yet</div>
              <div className="ts-muted" style={{ fontSize: 13 }}>Select an agent or team and click Generate Patterns to analyze behavioral signals.</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function PatternIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="ts-container">
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ts-muted)" }}>Loading Pattern Intelligence…</div>
      </div>
    }>
      <PatternsInner />
    </Suspense>
  );
}
