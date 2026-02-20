"use client";

import { useRef, useState } from "react";

type UploadTab = "agents" | "conversations" | "audio" | "rules";

function safeJson(txt: string) {
  try { return { ok: true as const, json: JSON.parse(txt) }; }
  catch (e: any) { return { ok: false as const, error: e?.message }; }
}

// ─── CSV PARSER ──────────────────────────────────────────────
function parseCsvAgents(csv: string): { name: string; email: string; team: string }[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
    return { name: obj["name"] || obj["agent"] || "", email: obj["email"] || "", team: obj["team"] || "" };
  }).filter((r) => r.name);
}

// ─── TABS ────────────────────────────────────────────────────
const TABS: { id: UploadTab; label: string; icon: string; desc: string }[] = [
  { id: "agents", label: "Import Agents", icon: "👥", desc: "Upload CSV with agent names, emails, teams" },
  { id: "conversations", label: "Upload Transcripts", icon: "💬", desc: "Upload .txt conversation transcripts" },
  { id: "audio", label: "Upload Audio", icon: "🎙️", desc: "Upload MP3/WAV/M4A — auto-transcribed by AI" },
  { id: "rules", label: "Company Rules", icon: "📋", desc: "Upload scripts, standards, compliance docs" },
];

export default function UploadPage() {
  const [tab, setTab] = useState<UploadTab>("agents");

  return (
    <>
      <style>{`
        .ts-upload-tabs { display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
        .ts-upload-tab {
          flex:1; min-width:180px; padding:16px 20px;
          background:var(--ts-surface); border:1px solid var(--ts-border);
          border-radius:var(--ts-radius-lg); cursor:pointer;
          transition:all 0.15s; text-align:left;
        }
        .ts-upload-tab:hover { border-color:rgba(64,97,132,0.35); }
        .ts-upload-tab.active {
          border-color:rgba(64,97,132,0.5);
          background:rgba(64,97,132,0.06);
          box-shadow:0 0 0 3px rgba(64,97,132,0.1);
        }
        .ts-upload-tab-icon { font-size:22px; margin-bottom:8px; }
        .ts-upload-tab-title { font-weight:750; font-size:15px; }
        .ts-upload-tab-desc { font-size:12px; color:var(--ts-muted); margin-top:3px; }
        .ts-dropzone {
          border:2px dashed var(--ts-border);
          border-radius:var(--ts-radius-lg);
          padding:40px 24px; text-align:center;
          cursor:pointer; transition:all 0.15s;
        }
        .ts-dropzone:hover, .ts-dropzone.dragover {
          border-color:rgba(64,97,132,0.5);
          background:rgba(64,97,132,0.04);
        }
        .ts-dropzone-icon { font-size:36px; margin-bottom:12px; }
        .ts-dropzone-title { font-size:16px; font-weight:750; margin-bottom:6px; }
        .ts-dropzone-sub { font-size:13px; color:var(--ts-muted); }
        .ts-preview-table { width:100%; border-collapse:collapse; margin-top:16px; }
        .ts-preview-table th {
          text-align:left; padding:8px 12px; font-size:11px; font-weight:800;
          text-transform:uppercase; letter-spacing:0.08em; color:var(--ts-muted);
          background:var(--ts-bg-soft); border-bottom:1px solid var(--ts-border);
        }
        .ts-preview-table td {
          padding:10px 12px; font-size:13px; font-weight:600;
          border-bottom:1px solid var(--ts-border-soft);
        }
        .ts-preview-table tr:last-child td { border-bottom:none; }
        .ts-conv-item {
          display:flex; align-items:flex-start; gap:14px;
          padding:14px 0; border-bottom:1px solid var(--ts-border-soft);
        }
        .ts-conv-item:last-child { border-bottom:none; }
        .ts-conv-icon {
          width:36px; height:36px; border-radius:10px; flex-shrink:0;
          background:rgba(64,97,132,0.1); border:1px solid rgba(64,97,132,0.2);
          display:flex; align-items:center; justify-content:center; font-size:16px;
        }
        .ts-conv-name { font-size:14px; font-weight:700; margin-bottom:3px; }
        .ts-conv-meta { font-size:12px; color:var(--ts-muted); }
        .ts-rules-textarea {
          width:100%; min-height:200px; padding:14px;
          border:1px solid var(--ts-border); border-radius:var(--ts-radius-md);
          background:var(--ts-surface); color:var(--ts-ink);
          font-size:14px; line-height:1.6; resize:vertical; outline:none;
          font-family:inherit; transition:border-color 120ms;
        }
        .ts-rules-textarea:focus { border-color:rgba(64,97,132,0.5); }
        .ts-upload-success {
          display:flex; align-items:center; gap:10px;
          padding:14px 18px; border-radius:var(--ts-radius-md);
          background:rgba(31,122,58,0.08); border:1px solid rgba(31,122,58,0.25);
          color:var(--ts-success); font-weight:650; font-size:14px;
          margin-bottom:16px;
        }
        .ts-select-agent {
          width:100%; height:38px; padding:0 12px; border-radius:12px;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          color:var(--ts-ink); font-size:14px; outline:none;
        }
      `}</style>

      <div className="ts-container">
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Import & Upload</div>
            <div className="ts-subtitle">Bring your data into TalkScope — agents, conversations, company rules</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "4px 12px", borderRadius: 20, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <span style={{ fontSize: 12 }}>🔒</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>PII Protected — credit cards, phones, emails auto-redacted before storage</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="ts-upload-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`ts-upload-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <div className="ts-upload-tab-icon">{t.icon}</div>
              <div className="ts-upload-tab-title">{t.label}</div>
              <div className="ts-upload-tab-desc">{t.desc}</div>
            </button>
          ))}
        </div>

        {tab === "agents" && <AgentsTab />}
        {tab === "conversations" && <ConversationsTab />}
        {tab === "audio" && <AudioTab />}
        {tab === "rules" && <RulesTab />}
      </div>
    </>
  );
}

// ─── AGENTS TAB ──────────────────────────────────────────────
function AgentsTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ name: string; email: string; team: string }[]>([]);
  const [dragover, setDragover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(parseCsvAgents(text));
      setSuccess(null);
      setErr(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview.length) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/upload/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents: preview }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 200)}`);
      const p = safeJson(txt);
      setSuccess(`Successfully imported ${p.ok ? (p.json.created ?? preview.length) : preview.length} agents.`);
      setPreview([]);
    } catch (e: any) {
      setErr(e?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ts-card">
      <div className="ts-card-pad">
        <div className="ts-sectionhead">
          <div>
            <div className="ts-h2">Import Agents from CSV</div>
            <div className="ts-hint">Required columns: name, email (optional), team (optional)</div>
          </div>
          <a
            href="data:text/csv;charset=utf-8,name,email,team%0AJohn Smith,john@example.com,Sales Team%0AAnna Lee,anna@example.com,Support Team"
            download="agents_template.csv"
            className="ts-btn"
          >
            Download Template
          </a>
        </div>
        <div className="ts-divider" />

        {success && <div className="ts-upload-success">✓ {success}</div>}
        {err && <div className="ts-alert ts-alert-error" style={{ marginBottom: 16 }}>{err}</div>}

        {/* DROPZONE */}
        <div
          className={`ts-dropzone ${dragover ? "dragover" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragover(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <div className="ts-dropzone-icon">📂</div>
          <div className="ts-dropzone-title">Drop CSV file here or click to browse</div>
          <div className="ts-dropzone-sub">Supports .csv files · Max 5MB</div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* PREVIEW */}
        {preview.length > 0 && (
          <>
            <div className="ts-divider" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 750 }}>{preview.length} agents ready to import</div>
              <button className="ts-btn ts-btn-primary" onClick={handleImport} disabled={loading}>
                {loading ? "Importing…" : `Import ${preview.length} Agents`}
              </button>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", borderRadius: "var(--ts-radius-md)", border: "1px solid var(--ts-border)" }}>
              <table className="ts-preview-table">
                <thead><tr><th>Name</th><th>Email</th><th>Team</th></tr></thead>
                <tbody>
                  {preview.slice(0, 50).map((a, i) => (
                    <tr key={i}><td>{a.name}</td><td>{a.email || "—"}</td><td>{a.team || "—"}</td></tr>
                  ))}
                  {preview.length > 50 && (
                    <tr><td colSpan={3} style={{ color: "var(--ts-muted)", textAlign: "center", padding: 10 }}>+ {preview.length - 50} more rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CONVERSATIONS TAB ───────────────────────────────────────
type ScoreResult = {
  agentName: string;
  overallScore: number;
  communicationScore: number;
  conversionScore: number;
  riskScore: number;
  coachingPriority: number;
  strengths: string[];
  weaknesses: string[];
  keyPatterns: string[];
  uploadedCount: number;
  agentId: string;
};

function scoreColor(n: number) {
  if (n >= 80) return "var(--ts-success)";
  if (n >= 60) return "var(--ts-warn)";
  return "var(--ts-danger)";
}
function riskColor(n: number) {
  if (n >= 70) return "var(--ts-danger)";
  if (n >= 45) return "var(--ts-warn)";
  return "var(--ts-success)";
}

function ConversationsTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ name: string; size: number; content: string }[]>([]);
  const [dragover, setDragover] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "scoring" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);

  useState(() => {
    fetch("/api/meta/agents", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAgents(j.agents?.map((a: any) => ({ id: a.id, name: a.name })) ?? []))
      .catch(() => {});
  });

  function handleFiles(fileList: FileList) {
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFiles((prev) => [...prev, { name: file.name, size: file.size, content: e.target?.result as string }]);
      };
      reader.readAsText(file);
    });
  }

  function removeFile(i: number) { setFiles((prev) => prev.filter((_, idx) => idx !== i)); }
  function reset() { setFiles([]); setResult(null); setErr(null); setPhase("idle"); }

  async function handleUpload(withScore = false) {
    if (!files.length || !agentId) return;
    setErr(null); setResult(null);
    setPhase("uploading");

    try {
      // Step 1: Upload conversations
      const items = files.map((f) => ({ transcript: f.content }));
      const r = await fetch("/api/conversations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, items }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Upload failed: ${txt.slice(0, 200)}`);

      if (!withScore) {
        const p = safeJson(txt);
        setPhase("done");
        setResult({
          agentName: agents.find(a => a.id === agentId)?.name ?? agentId,
          overallScore: 0, communicationScore: 0, conversionScore: 0,
          riskScore: 0, coachingPriority: 0,
          strengths: [], weaknesses: [], keyPatterns: [],
          uploadedCount: p.ok ? (p.json.inserted ?? files.length) : files.length,
          agentId,
        });
        setFiles([]);
        return;
      }

      // Step 2: Generate score
      setPhase("scoring");
      const scoreR = await fetch("/api/agents/score/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize: 30 }),
      });
      const scoreTxt = await scoreR.text();
      console.log("SCORE STATUS:", scoreR.status);
      console.log("SCORE RESPONSE:", scoreTxt.slice(0, 500));
      if (!scoreR.ok) throw new Error(`Scoring failed: ${scoreTxt.slice(0, 200)}`);
      const scoreP = safeJson(scoreTxt);
      if (!scoreP.ok || !scoreP.json?.ok) throw new Error(scoreP.json?.error || "Score generation failed");

      const s = scoreP.json.score;
      setResult({
        agentName: agents.find(a => a.id === agentId)?.name ?? agentId,
        overallScore: Number(s.overallScore ?? s.overall_score ?? 0),
        communicationScore: Number(s.communicationScore ?? s.communication_score ?? 0),
        conversionScore: Number(s.conversionScore ?? s.conversion_score ?? 0),
        riskScore: Number(s.riskScore ?? s.risk_score ?? 0),
        coachingPriority: Number(s.coachingPriority ?? s.coaching_priority ?? 0),
        strengths: s.strengths ?? [],
        weaknesses: s.weaknesses ?? [],
        keyPatterns: s.keyPatterns ?? s.key_patterns ?? [],
        uploadedCount: files.length,
        agentId,
      });
      setFiles([]);
      setPhase("done");
    } catch (e: any) {
      setErr(e?.message || "Failed");
      setPhase("idle");
    }
  }

  const canUpload = files.length > 0 && !!agentId;
  const busy = phase === "uploading" || phase === "scoring";

  return (
    <>
      <style>{`
        .ts-score-result {
          background:var(--ts-surface); border:1px solid var(--ts-border);
          border-radius:var(--ts-radius-lg); overflow:hidden; margin-top:0;
        }
        .ts-score-result-head {
          padding:20px 24px; background:rgba(64,97,132,0.05);
          border-bottom:1px solid var(--ts-border-soft);
          display:flex; align-items:center; gap:16px; flex-wrap:wrap;
        }
        .ts-score-big {
          width:64px; height:64px; border-radius:16px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:22px; font-weight:900; border:2px solid currentColor;
        }
        .ts-score-grid {
          display:grid; grid-template-columns:repeat(4,1fr); gap:10px;
          padding:18px 24px; border-bottom:1px solid var(--ts-border-soft);
        }
        @media(max-width:640px){.ts-score-grid{grid-template-columns:repeat(2,1fr);}}
        .ts-score-metric {
          background:var(--ts-bg-soft); border-radius:12px; padding:12px 14px;
          border:1px solid var(--ts-border-soft);
        }
        .ts-score-metric-label {
          font-size:10px; font-weight:800; text-transform:uppercase;
          letter-spacing:0.08em; color:var(--ts-muted); margin-bottom:6px;
        }
        .ts-score-metric-val { font-size:22px; font-weight:900; letter-spacing:-0.03em; }
        .ts-score-metric-bar {
          height:4px; border-radius:2px; background:var(--ts-border-soft);
          margin-top:8px; overflow:hidden;
        }
        .ts-score-metric-fill { height:100%; border-radius:2px; transition:width 0.8s ease; }
        .ts-score-lists { display:grid; grid-template-columns:1fr 1fr; gap:0; }
        @media(max-width:600px){.ts-score-lists{grid-template-columns:1fr;}}
        .ts-score-list-col { padding:16px 24px; }
        .ts-score-list-col:first-child { border-right:1px solid var(--ts-border-soft); }
        .ts-score-list-title {
          font-size:11px; font-weight:800; text-transform:uppercase;
          letter-spacing:0.08em; color:var(--ts-muted); margin-bottom:10px;
        }
        .ts-score-list-item {
          display:flex; align-items:flex-start; gap:8px;
          font-size:13px; line-height:1.5; margin-bottom:8px;
        }
        .ts-score-list-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-top:5px; }
        .ts-phase-indicator {
          display:flex; align-items:center; gap:12px;
          padding:16px 20px; border-radius:14px;
          background:rgba(64,97,132,0.06); border:1px solid rgba(64,97,132,0.15);
          margin-bottom:16px;
        }
        .ts-phase-spinner {
          width:20px; height:20px; border-radius:50%;
          border:2px solid rgba(64,97,132,0.2); border-top-color:var(--ts-accent);
          animation:ts-spin 0.8s linear infinite; flex-shrink:0;
        }
        @keyframes ts-spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="ts-card">
        <div className="ts-card-pad">
          <div className="ts-sectionhead">
            <div>
              <div className="ts-h2">Upload Conversation Transcripts</div>
              <div className="ts-hint">TXT files · One file = one conversation · Score generated instantly</div>
            </div>
          </div>
          <div className="ts-divider" />

          {err && <div className="ts-alert ts-alert-error" style={{ marginBottom: 16 }}>⚠ {err}</div>}

          {/* Phase indicator */}
          {busy && (
            <div className="ts-phase-indicator">
              <div className="ts-phase-spinner" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {phase === "uploading" ? "Uploading conversations…" : "AI is scoring the agent…"}
                </div>
                <div style={{ fontSize: 12, color: "var(--ts-muted)", marginTop: 2 }}>
                  {phase === "scoring" ? "Analyzing last 30 conversations with OpenAI" : "Saving to database"}
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && phase === "done" && (
            <div className="ts-score-result" style={{ marginBottom: 20 }}>
              <div className="ts-score-result-head">
                {result.overallScore > 0 ? (
                  <div className="ts-score-big" style={{ color: scoreColor(result.overallScore), borderColor: scoreColor(result.overallScore), background: `${scoreColor(result.overallScore)}12` }}>
                    {Math.round(result.overallScore)}
                  </div>
                ) : (
                  <div style={{ fontSize: 28 }}>✅</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {result.overallScore > 0 ? `Score generated for ${result.agentName}` : `${result.uploadedCount} conversations uploaded`}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ts-muted)", marginTop: 3 }}>
                    {result.uploadedCount} conversation{result.uploadedCount !== 1 ? "s" : ""} added
                    {result.overallScore > 0 ? " · Based on last 30 conversations" : ""}
                  </div>
                </div>
                <a href={`/app/agents/${result.agentId}`} className="ts-btn ts-btn-primary" style={{ fontSize: 13 }}>
                  View Agent →
                </a>
                <button className="ts-btn" style={{ fontSize: 13 }} onClick={reset}>
                  Upload More
                </button>
              </div>

              {/* Score metrics */}
              {result.overallScore > 0 && (
                <>
                  <div className="ts-score-grid">
                    {[
                      { label: "Communication", val: result.communicationScore, color: scoreColor(result.communicationScore) },
                      { label: "Conversion", val: result.conversionScore, color: scoreColor(result.conversionScore) },
                      { label: "Risk Signal", val: result.riskScore, color: riskColor(result.riskScore) },
                      { label: "Coaching Priority", val: result.coachingPriority, color: riskColor(result.coachingPriority) },
                    ].map(m => (
                      <div key={m.label} className="ts-score-metric">
                        <div className="ts-score-metric-label">{m.label}</div>
                        <div className="ts-score-metric-val" style={{ color: m.color }}>{m.val.toFixed(1)}</div>
                        <div className="ts-score-metric-bar">
                          <div className="ts-score-metric-fill" style={{ width: `${m.val}%`, background: m.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {(result.strengths.length > 0 || result.weaknesses.length > 0) && (
                    <div className="ts-score-lists">
                      <div className="ts-score-list-col">
                        <div className="ts-score-list-title">✓ Strengths</div>
                        {result.strengths.slice(0, 4).map((s, i) => (
                          <div key={i} className="ts-score-list-item">
                            <div className="ts-score-list-dot" style={{ background: "var(--ts-success)" }} />
                            {s}
                          </div>
                        ))}
                      </div>
                      <div className="ts-score-list-col">
                        <div className="ts-score-list-title">✗ Areas to Improve</div>
                        {result.weaknesses.slice(0, 4).map((w, i) => (
                          <div key={i} className="ts-score-list-item">
                            <div className="ts-score-list-dot" style={{ background: "var(--ts-danger)" }} />
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Agent selector — hide after result */}
          {phase !== "done" && (
            <div style={{ marginBottom: 16 }}>
              <div className="ts-card-title" style={{ marginBottom: 8 }}>Assign to Agent</div>
              <select className="ts-select-agent" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                <option value="">Select agent…</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          {/* Dropzone — hide after result */}
          {phase !== "done" && (
            <div
              className={`ts-dropzone ${dragover ? "dragover" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
              onDragLeave={() => setDragover(false)}
              onDrop={(e) => { e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files); }}
            >
              <div className="ts-dropzone-icon">💬</div>
              <div className="ts-dropzone-title">Drop transcript files here or click to browse</div>
              <div className="ts-dropzone-sub">Supports .txt files · Multiple files allowed</div>
              <input ref={fileRef} type="file" accept=".txt,.csv" multiple style={{ display: "none" }}
                onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
              />
            </div>
          )}

          {/* File list + actions */}
          {files.length > 0 && phase !== "done" && (
            <>
              <div className="ts-divider" />
              <div style={{ marginBottom: 14 }}>
                {files.map((f, i) => (
                  <div key={i} className="ts-conv-item">
                    <div className="ts-conv-icon">📄</div>
                    <div style={{ flex: 1 }}>
                      <div className="ts-conv-name">{f.name}</div>
                      <div className="ts-conv-meta">{(f.size / 1024).toFixed(1)} KB · {f.content.length} chars</div>
                    </div>
                    <button className="ts-btn" style={{ padding: "0 10px", height: 28, fontSize: 12 }} onClick={() => removeFile(i)}>✕</button>
                  </div>
                ))}
              </div>
              {!agentId && (
                <div className="ts-muted" style={{ marginBottom: 12, fontSize: 13 }}>⚠ Select an agent above before uploading</div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="ts-btn" onClick={() => handleUpload(false)} disabled={!canUpload || busy}>
                  {phase === "uploading" ? "Uploading…" : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
                </button>
                <button className="ts-btn ts-btn-primary" onClick={() => handleUpload(true)} disabled={!canUpload || busy}>
                  {busy ? (phase === "scoring" ? "Scoring…" : "Uploading…") : "⚡ Upload + Score Now"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── AUDIO TAB ───────────────────────────────────────────────
function AudioTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [agentId, setAgentId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "transcribing" | "saving" | "scoring" | "done">("idle");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/meta/agents", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAgents(j.agents?.map((a: any) => ({ id: a.id, name: a.name })) ?? []))
      .catch(() => {});
  }, []);

  function handleFile(f: File) {
    const MAX = 25 * 1024 * 1024;
    if (f.size > MAX) { setErr(`File too large: ${(f.size/1024/1024).toFixed(1)}MB. Max 25MB.`); return; }
    setFile(f);
    setErr(null);
    setResult(null);
  }

  function reset() { setFile(null); setResult(null); setErr(null); setPhase("idle"); }

  async function handleUpload(withScore = false) {
    if (!file || !agentId) return;
    setErr(null); setResult(null);
    setPhase("transcribing");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("agentId", agentId);

      const r = await fetch("/api/upload/audio", { method: "POST", body: formData });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt.slice(0, 300));
      const data = JSON.parse(txt);

      if (!withScore) {
        setPhase("done");
        setResult({ ...data, overallScore: 0, uploadOnly: true });
        setFile(null);
        return;
      }

      setPhase("scoring");
      const scoreR = await fetch("/api/agents/score/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize: 30 }),
      });
      const scoreTxt = await scoreR.text();
      if (!scoreR.ok) throw new Error(`Scoring failed: ${scoreTxt.slice(0, 200)}`);
      const scoreP = JSON.parse(scoreTxt);
      if (!scoreP?.ok) throw new Error(scoreP?.error || "Score failed");
      const s = scoreP.score;

      setResult({
        ...data,
        overallScore: Number(s.overallScore ?? s.overall_score ?? 0),
        communicationScore: Number(s.communicationScore ?? s.communication_score ?? 0),
        conversionScore: Number(s.conversionScore ?? s.conversion_score ?? 0),
        riskScore: Number(s.riskScore ?? s.risk_score ?? 0),
        coachingPriority: Number(s.coachingPriority ?? s.coaching_priority ?? 0),
        strengths: s.strengths ?? [],
        weaknesses: s.weaknesses ?? [],
      });
      setFile(null);
      setPhase("done");
    } catch (e: any) {
      setErr(e?.message || "Failed");
      setPhase("idle");
    }
  }

  const busy = phase === "transcribing" || phase === "saving" || phase === "scoring";
  const canUpload = !!file && !!agentId;
  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(1) : "0";
  const accent = "#406184";

  const phaseLabel = phase === "transcribing" ? "🎙️ Transcribing audio with Whisper AI…"
    : phase === "saving" ? "💾 Saving transcript…"
    : phase === "scoring" ? "🧠 Generating AI score…"
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        .ts-audio-drop { border: 2px dashed var(--ts-border); border-radius: var(--ts-radius-lg); padding: 40px 24px; text-align: center; cursor: pointer; transition: all 0.15s; background: var(--ts-bg-soft); }
        .ts-audio-drop:hover { border-color: #406184; background: rgba(64,97,132,0.04); }
        .ts-audio-drop.has-file { border-color: #22c55e; border-style: solid; background: rgba(34,197,94,0.04); }
      `}</style>

      {/* Info banner */}
      <div style={{ display: "flex", gap: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(64,97,132,0.06)", border: "1px solid rgba(64,97,132,0.2)" }}>
        <span style={{ fontSize: 20 }}>🎙️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: accent, marginBottom: 2 }}>Audio Transcription powered by OpenAI Whisper</div>
          <div style={{ fontSize: 12, color: "var(--ts-muted)", lineHeight: 1.6 }}>
            Supported: MP3, WAV, M4A, MP4 · Max 25MB (~25 min at 128kbps) · Auto PII redaction · ~$0.006/min
          </div>
        </div>
      </div>

      {/* Agent selector */}
      <div>
        <label className="ts-label">Select Agent</label>
        <select className="ts-select" value={agentId} onChange={e => setAgentId(e.target.value)} disabled={busy}>
          <option value="">— Select agent —</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {/* Drop zone */}
      {!result && (
        <div
          className={`ts-audio-drop ${file ? "has-file" : ""}`}
          onClick={() => !busy && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <input
            ref={fileRef} type="file"
            accept=".mp3,.wav,.m4a,.mp4,.webm,audio/*"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {!file ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ts-ink)", marginBottom: 6 }}>Drop audio file here or click to browse</div>
              <div style={{ fontSize: 13, color: "var(--ts-muted)" }}>MP3, WAV, M4A, MP4 · Max 25MB</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#22c55e", marginBottom: 4 }}>{file.name}</div>
              <div style={{ fontSize: 13, color: "var(--ts-muted)" }}>{fileSizeMB} MB · Ready to transcribe</div>
              {!busy && (
                <button onClick={e => { e.stopPropagation(); reset(); }}
                  style={{ marginTop: 10, fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                  Remove
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Progress */}
      {busy && (
        <div style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(64,97,132,0.06)", border: "1px solid rgba(64,97,132,0.2)", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: accent, marginBottom: 8 }}>{phaseLabel}</div>
          <div style={{ height: 4, borderRadius: 4, background: "rgba(64,97,132,0.15)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: accent, borderRadius: 4, width: phase === "transcribing" ? "60%" : phase === "scoring" ? "90%" : "30%", transition: "width 0.5s ease" }} />
          </div>
          {phase === "transcribing" && <div style={{ fontSize: 12, color: "var(--ts-muted)", marginTop: 8 }}>This may take 10–30 seconds depending on audio length</div>}
        </div>
      )}

      {/* Error */}
      {err && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626", fontSize: 13 }}>
          ⚠️ {err}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ borderRadius: 14, border: "1px solid var(--ts-border)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "rgba(34,197,94,0.06)", borderBottom: "1px solid var(--ts-border-soft)", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ts-ink)" }}>
                Audio transcribed {result.uploadOnly ? "& saved" : "& scored"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ts-muted)" }}>
                {result.agentName} · {result.durationEstimate} · {result.transcriptLength} chars
                {result.piiRedacted && <span style={{ marginLeft: 8, color: "#22c55e" }}>🔒 PII redacted</span>}
              </div>
            </div>
          </div>

          {/* Transcript preview */}
          <div style={{ padding: "14px 20px", background: "var(--ts-bg-soft)", borderBottom: "1px solid var(--ts-border-soft)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ts-muted)", marginBottom: 8 }}>Transcript Preview</div>
            <div style={{ fontSize: 12, color: "var(--ts-ink)", lineHeight: 1.7, fontFamily: "monospace", opacity: 0.8 }}>{result.transcript}</div>
          </div>

          {/* Scores */}
          {!result.uploadOnly && result.overallScore > 0 && (
            <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Overall", value: result.overallScore, color: accent },
                { label: "Communication", value: result.communicationScore, color: "#8b5cf6" },
                { label: "Conversion", value: result.conversionScore, color: "#22c55e" },
                { label: "Risk", value: result.riskScore, color: "#ef4444" },
                { label: "Coaching Priority", value: result.coachingPriority, color: "#f59e0b" },
              ].map(m => (
                <div key={m.label} style={{ textAlign: "center", padding: "10px 8px", borderRadius: 10, background: "var(--ts-bg-soft)", border: "1px solid var(--ts-border)" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{Math.round(m.value)}</div>
                  <div style={{ fontSize: 11, color: "var(--ts-muted)", marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: "12px 20px", display: "flex", gap: 10 }}>
            <button onClick={reset} className="ts-btn" style={{ fontSize: 13 }}>Upload another</button>
            <a href={`/app/agents/${result.agentId}`} className="ts-btn ts-btn-primary" style={{ fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              View agent →
            </a>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!result && !busy && (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => handleUpload(false)}
            disabled={!canUpload}
            className="ts-btn"
            style={{ fontSize: 14, opacity: canUpload ? 1 : 0.5 }}
          >
            Save transcript only
          </button>
          <button
            onClick={() => handleUpload(true)}
            disabled={!canUpload}
            className="ts-btn ts-btn-primary"
            style={{ fontSize: 14, opacity: canUpload ? 1 : 0.5 }}
          >
            ⚡ Transcribe + Score Now
          </button>
        </div>
      )}
    </div>
  );
}

// ─── RULES TAB ───────────────────────────────────────────────
function RulesTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setText(e.target?.result as string);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsText(file);
  }

  async function handleSave() {
    if (!text.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/rules/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "Company Rules", content: text }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setSuccess("Company rules saved. They will be used during AI scoring.");
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ts-card">
      <div className="ts-card-pad">
        <div className="ts-sectionhead">
          <div>
            <div className="ts-h2">Company Rules & Standards</div>
            <div className="ts-hint">Scripts, compliance requirements, quality standards — AI will use these when scoring</div>
          </div>
          <button className="ts-btn" onClick={() => fileRef.current?.click()}>Upload File</button>
        </div>
        <div className="ts-divider" />

        {success && <div className="ts-upload-success">✓ {success}</div>}
        {err && <div className="ts-alert ts-alert-error" style={{ marginBottom: 16 }}>{err}</div>}

        <input ref={fileRef} type="file" accept=".txt,.md,.csv" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        <div style={{ marginBottom: 12 }}>
          <div className="ts-card-title" style={{ marginBottom: 6 }}>Title</div>
          <input
            className="ts-input"
            style={{ width: "100%" }}
            placeholder="e.g. Sales Script Q1 2026, Compliance Standards…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <div className="ts-card-title" style={{ marginBottom: 6 }}>Content</div>
          <textarea
            className="ts-rules-textarea"
            placeholder={"Paste your company rules, scripts, or quality standards here…\n\nExample:\n- Always greet the customer by name\n- Offer alternative solutions before escalating\n- Do not promise refunds without manager approval\n- End every call with a clear next step"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="ts-muted" style={{ fontSize: 12, marginTop: 6 }}>{text.length} characters</div>
        </div>

        <div className="ts-divider" />

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="ts-btn ts-btn-primary" onClick={handleSave} disabled={loading || !text.trim()}>
            {loading ? "Saving…" : "Save Rules"}
          </button>
          <span className="ts-muted" style={{ fontSize: 13 }}>
            Saved rules will be applied to all future AI scoring sessions
          </span>
        </div>
      </div>
    </div>
  );
}
// force redeploy Fri Feb 20 09:26:00 UTC 2026
