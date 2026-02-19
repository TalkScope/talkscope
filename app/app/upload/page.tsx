"use client";

import { useRef, useState } from "react";

type UploadTab = "agents" | "conversations" | "rules";

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
  { id: "conversations", label: "Upload Conversations", icon: "💬", desc: "Upload chat transcripts or audio files" },
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
function ConversationsTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ name: string; size: number; type: string; content: string }[]>([]);
  const [dragover, setDragover] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // load agents for select
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
        setFiles((prev) => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          content: e.target?.result as string,
        }]);
      };
      reader.readAsText(file);
    });
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleUpload() {
    if (!files.length || !agentId) return;
    setLoading(true);
    setErr(null);
    setSuccess(null);
    try {
      const conversations = files.map((f) => ({ agentId, transcript: f.content, fileName: f.name }));
      const r = await fetch("/api/conversations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversations }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 200)}`);
      const p = safeJson(txt);
      setSuccess(`Uploaded ${p.ok ? (p.json.created ?? files.length) : files.length} conversations.`);
      setFiles([]);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadAndAnalyze() {
    if (!files.length || !agentId) return;
    setAnalyzing(true);
    setErr(null);
    setSuccess(null);
    try {
      const conversations = files.map((f) => ({ agentId, transcript: f.content, fileName: f.name }));
      const r = await fetch("/api/conversations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversations }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 200)}`);

      // Now generate score
      const scoreR = await fetch("/api/agents/score/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, windowSize: 30 }),
      });
      if (!scoreR.ok) throw new Error("Score generation failed");

      setSuccess(`Uploaded ${files.length} conversations and generated score for agent. Check agent page for results.`);
      setFiles([]);
    } catch (e: any) {
      setErr(e?.message || "Upload & analyze failed");
    } finally {
      setAnalyzing(false);
    }
  }

  const canUpload = files.length > 0 && agentId;

  return (
    <div className="ts-card">
      <div className="ts-card-pad">
        <div className="ts-sectionhead">
          <div>
            <div className="ts-h2">Upload Conversation Transcripts</div>
            <div className="ts-hint">TXT or CSV files · One file = one conversation</div>
          </div>
        </div>
        <div className="ts-divider" />

        {success && <div className="ts-upload-success">✓ {success}</div>}
        {err && <div className="ts-alert ts-alert-error" style={{ marginBottom: 16 }}>{err}</div>}

        {/* Agent selector */}
        <div style={{ marginBottom: 16 }}>
          <div className="ts-card-title" style={{ marginBottom: 8 }}>Assign to Agent</div>
          <select className="ts-select-agent" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">Select agent…</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* DROPZONE */}
        <div
          className={`ts-dropzone ${dragover ? "dragover" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragover(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <div className="ts-dropzone-icon">💬</div>
          <div className="ts-dropzone-title">Drop transcript files here or click to browse</div>
          <div className="ts-dropzone-sub">Supports .txt, .csv files · Multiple files allowed</div>
          <input ref={fileRef} type="file" accept=".txt,.csv" multiple style={{ display: "none" }}
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
          />
        </div>

        {/* FILE LIST */}
        {files.length > 0 && (
          <>
            <div className="ts-divider" />
            <div style={{ marginBottom: 14 }}>
              {files.map((f, i) => (
                <div key={i} className="ts-conv-item">
                  <div className="ts-conv-icon">📄</div>
                  <div style={{ flex: 1 }}>
                    <div className="ts-conv-name">{f.name}</div>
                    <div className="ts-conv-meta">
                      {(f.size / 1024).toFixed(1)} KB · {f.content.length} chars
                    </div>
                  </div>
                  <button className="ts-btn" style={{ padding: "0 10px", height: 28, fontSize: 12 }} onClick={() => removeFile(i)}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ts-btn" onClick={handleUpload} disabled={!canUpload || loading || analyzing}>
                {loading ? "Uploading…" : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
              </button>
              <button className="ts-btn ts-btn-primary" onClick={handleUploadAndAnalyze} disabled={!canUpload || loading || analyzing}>
                {analyzing ? "Uploading & Analyzing…" : "Upload + Generate Score"}
              </button>
            </div>
            {!agentId && (
              <div className="ts-muted" style={{ marginTop: 8, fontSize: 13 }}>
                ⚠ Select an agent above before uploading
              </div>
            )}
          </>
        )}
      </div>
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
