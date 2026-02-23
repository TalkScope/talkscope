"use client";

import Link from "next/link";
import { useState } from "react";

type Step = "org" | "team" | "agents" | "conversations" | "done";

async function safePost(url: string, body: object) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  try { return { ok: r.ok, json: JSON.parse(t) }; }
  catch { return { ok: false, json: null }; }
}

type OnboardingProps = {
  onComplete: () => void;
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep]       = useState<Step>("org");
  const [orgName, setOrgName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [orgId, setOrgId]     = useState("");
  const [teamId, setTeamId]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const steps: { id: Step; label: string; icon: string }[] = [
    { id: "org",           label: "Organization", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18"/><path d="M9 22V12h6v10"/><path d="M3 22h18"/><path d="M7 7h1"/><path d="M7 11h1"/><path d="M16 7h1"/><path d="M16 11h1"/></svg> },
    { id: "team",          label: "Team",          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: "agents",        label: "Import Agents", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id: "conversations", label: "Upload Data",   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { id: "done",          label: "Ready!",        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  ];

  const currentIdx = steps.findIndex(s => s.id === step);

  async function createOrg() {
    if (!orgName.trim()) return;
    setSaving(true); setErr(null);
    const r = await safePost("/api/settings/org", { name: orgName.trim() });
    setSaving(false);
    if (r.ok && r.json?.org?.id) {
      setOrgId(r.json.org.id);
      setStep("team");
    } else {
      setErr(r.json?.error || "Failed to create organization");
    }
  }

  async function createTeam() {
    if (!teamName.trim()) return;
    setSaving(true); setErr(null);
    const r = await safePost("/api/settings/team", { name: teamName.trim(), organizationId: orgId });
    setSaving(false);
    if (r.ok && r.json?.team?.id) {
      setTeamId(r.json.team.id);
      setStep("agents");
    } else {
      setErr(r.json?.error || "Failed to create team");
    }
  }

  return (
    <>
      <style>{`
        .ts-ob-overlay {
          position:fixed; inset:0; z-index:30;
          background:rgba(0,0,0,0.55); backdrop-filter:blur(4px);
          display:flex; align-items:center; justify-content:center;
          padding:24px;
        }
        .ts-ob-modal {
          background:var(--ts-surface); border:1px solid var(--ts-border);
          border-radius:24px; width:100%; max-width:560px;
          box-shadow:0 24px 64px rgba(0,0,0,0.22);
          overflow:hidden;
        }
        .ts-ob-header {
          padding:28px 32px 0;
        }
        .ts-ob-brand {
          display:flex; align-items:center; gap:10px; margin-bottom:24px;
        }
        .ts-ob-brand-mark {
          width:36px; height:36px; border-radius:10px;
          background:linear-gradient(135deg,rgba(64,97,132,0.2),rgba(64,97,132,0.6));
          border:1px solid rgba(64,97,132,0.3);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:900; color:white;
        }
        .ts-ob-brand-name { font-size:17px; font-weight:800; letter-spacing:-0.03em; }

        /* Progress */
        .ts-ob-steps {
          display:flex; gap:0; margin-bottom:28px;
        }
        .ts-ob-step {
          flex:1; display:flex; flex-direction:column; align-items:center;
          gap:6px; position:relative;
        }
        .ts-ob-step::after {
          content:""; position:absolute; top:15px; left:50%;
          width:100%; height:2px; background:var(--ts-border);
          z-index:0;
        }
        .ts-ob-step:last-child::after { display:none; }
        .ts-ob-step-dot {
          width:30px; height:30px; border-radius:50%;
          border:2px solid var(--ts-border); background:var(--ts-surface);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:var(--ts-muted);
          position:relative; z-index:1; transition:all 0.2s;
        }
        .ts-ob-step.active .ts-ob-step-dot {
          border-color:var(--ts-accent); background:rgba(64,97,132,0.1);
          color:var(--ts-accent); transform:scale(1.1);
        }
        .ts-ob-step.done .ts-ob-step-dot {
          border-color:var(--ts-success); background:var(--ts-success);
          color:#fff;
        }
        .ts-ob-step.done::after { background:var(--ts-success); }
        .ts-ob-step-label {
          font-size:10px; font-weight:700; color:var(--ts-muted);
          text-transform:uppercase; letter-spacing:0.06em; text-align:center;
        }
        .ts-ob-step.active .ts-ob-step-label { color:var(--ts-accent); }
        .ts-ob-step.done .ts-ob-step-label { color:var(--ts-success); }

        .ts-ob-body { padding:0 32px 32px; }

        .ts-ob-title {
          font-size:22px; font-weight:900; letter-spacing:-0.03em;
          margin-bottom:8px;
        }
        .ts-ob-subtitle {
          font-size:14px; color:var(--ts-muted); line-height:1.6;
          margin-bottom:24px;
        }

        .ts-ob-input {
          width:100%; height:46px; padding:0 16px;
          border-radius:12px; border:1.5px solid var(--ts-border);
          background:var(--ts-bg-soft); color:var(--ts-ink);
          font-size:15px; outline:none; transition:border-color 0.15s;
          margin-bottom:16px;
        }
        .ts-ob-input:focus { border-color:rgba(64,97,132,0.5); background:var(--ts-surface); }

        .ts-ob-btn {
          width:100%; height:46px; border-radius:12px;
          background:var(--ts-accent); color:#fff;
          font-size:15px; font-weight:800; border:none;
          cursor:pointer; transition:opacity 0.15s;
        }
        .ts-ob-btn:hover { opacity:0.9; }
        .ts-ob-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .ts-ob-btn-ghost {
          width:100%; height:42px; border-radius:12px;
          background:transparent; border:1.5px solid var(--ts-border);
          color:var(--ts-muted); font-size:14px; font-weight:700;
          cursor:pointer; margin-top:10px; transition:all 0.15s;
        }
        .ts-ob-btn-ghost:hover { border-color:rgba(64,97,132,0.3); color:var(--ts-ink); }

        .ts-ob-hint {
          background:rgba(64,97,132,0.06); border:1px solid rgba(64,97,132,0.15);
          border-radius:12px; padding:14px 16px;
          font-size:13px; color:var(--ts-muted); line-height:1.6;
          margin-bottom:20px;
        }
        .ts-ob-hint strong { color:var(--ts-ink); }

        .ts-ob-action-card {
          background:var(--ts-bg-soft); border:1.5px solid var(--ts-border);
          border-radius:14px; padding:18px 20px;
          display:flex; align-items:center; gap:16px;
          text-decoration:none; color:inherit; margin-bottom:10px;
          transition:all 0.15s; cursor:pointer;
        }
        .ts-ob-action-card:hover {
          border-color:rgba(64,97,132,0.4);
          background:rgba(64,97,132,0.04);
          transform:translateY(-1px);
        }
        .ts-ob-action-icon {
          width:42px; height:42px; border-radius:11px; flex-shrink:0;
          background:rgba(64,97,132,0.1); border:1px solid rgba(64,97,132,0.2);
          display:flex; align-items:center; justify-content:center; font-size:18px;
        }
        .ts-ob-action-title { font-size:15px; font-weight:800; margin-bottom:2px; }
        .ts-ob-action-sub { font-size:12px; color:var(--ts-muted); }
        .ts-ob-action-arrow { margin-left:auto; color:var(--ts-accent); font-size:18px; }

        .ts-ob-done-emoji { font-size:56px; text-align:center; margin-bottom:16px; }
      `}</style>

      <div className="ts-ob-overlay">
        <div className="ts-ob-modal">
          <div className="ts-ob-header">
            <div className="ts-ob-brand">
              <img src="/logo-512.png" alt="TalkScope" width={36} height={36} style={{ borderRadius: 10 }}
                   onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="ts-ob-brand-name">TalkScope</span>
            </div>

            {/* Step progress */}
            <div className="ts-ob-steps">
              {steps.map((s, i) => {
                const state = i < currentIdx ? "done" : i === currentIdx ? "active" : "";
                return (
                  <div key={s.id} className={`ts-ob-step ${state}`}>
                    <div className="ts-ob-step-dot">
                      {i < currentIdx ? "✓" : <span style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{s.icon}</span>}
                    </div>
                    <div className="ts-ob-step-label">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ts-ob-body">

            {/* ── STEP 1: Organization ── */}
            {step === "org" && (
              <>
                <div className="ts-ob-title">Welcome to TalkScope 👋</div>
                <div className="ts-ob-subtitle">
                  Let's set up your workspace in 4 quick steps. Start by naming your organization.
                </div>
                <div className="ts-ob-hint">
                  An <strong>Organization</strong> is your top-level workspace — usually your company name. You can create multiple teams inside it.
                </div>
                <input
                  className="ts-ob-input"
                  placeholder="e.g. Acme Corp, Sales Division…"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createOrg()}
                  autoFocus
                />
                {err && <div style={{ color: "var(--ts-danger)", fontSize: 13, marginBottom: 12 }}>{err}</div>}
                <button className="ts-ob-btn" onClick={createOrg} disabled={saving || !orgName.trim()}>
                  {saving ? "Creating…" : "Create Organization →"}
                </button>
              </>
            )}

            {/* ── STEP 2: Team ── */}
            {step === "team" && (
              <>
                <div className="ts-ob-title">Create your first team</div>
                <div className="ts-ob-subtitle">
                  Teams group agents together. Create one for your first department or call group.
                </div>
                <div className="ts-ob-hint">
                  Examples: <strong>Sales Team A</strong>, <strong>Support — Level 1</strong>, <strong>Collections East</strong>
                </div>
                <input
                  className="ts-ob-input"
                  placeholder="e.g. Sales Team, Support Group…"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createTeam()}
                  autoFocus
                />
                {err && <div style={{ color: "var(--ts-danger)", fontSize: 13, marginBottom: 12 }}>{err}</div>}
                <button className="ts-ob-btn" onClick={createTeam} disabled={saving || !teamName.trim()}>
                  {saving ? "Creating…" : "Create Team →"}
                </button>
              </>
            )}

            {/* ── STEP 3: Agents ── */}
            {step === "agents" && (
              <>
                <div className="ts-ob-title">Import your agents</div>
                <div className="ts-ob-subtitle">
                  Upload a CSV with agent names to populate your team. You can also add agents manually later.
                </div>
                <Link
                  href={`/app/upload?tab=agents&teamId=${teamId}`}
                  className="ts-ob-action-card"
                  onClick={onComplete}
                >
                  <div className="ts-ob-action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
                  <div>
                    <div className="ts-ob-action-title">Upload CSV file</div>
                    <div className="ts-ob-action-sub">name, email, team — one agent per row</div>
                  </div>
                  <div className="ts-ob-action-arrow">→</div>
                </Link>
                <button className="ts-ob-btn-ghost" onClick={() => setStep("conversations")}>
                  Skip for now — I'll add agents later
                </button>
              </>
            )}

            {/* ── STEP 4: Conversations ── */}
            {step === "conversations" && (
              <>
                <div className="ts-ob-title">Upload conversations</div>
                <div className="ts-ob-subtitle">
                  Upload transcripts (.txt files) to start analyzing. TalkScope will score them and extract insights.
                </div>
                <Link
                  href="/app/upload?tab=conversations"
                  className="ts-ob-action-card"
                  onClick={onComplete}
                >
                  <div className="ts-ob-action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                  <div>
                    <div className="ts-ob-action-title">Upload transcripts</div>
                    <div className="ts-ob-action-sub">.txt files, one conversation per file</div>
                  </div>
                  <div className="ts-ob-action-arrow">→</div>
                </Link>
                <button className="ts-ob-btn-ghost" onClick={() => setStep("done")}>
                  Skip — I'll upload later
                </button>
              </>
            )}

            {/* ── STEP 5: Done ── */}
            {step === "done" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
                  <div className="ts-ob-title">Workspace ready!</div>
                  <div className="ts-ob-subtitle">Here's what to do next to get your first AI insights.</div>
                </div>
                {[
                  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>, step: "1", title: "Upload conversations", sub: "Go to Upload → add .txt or audio files for your agents", href: "/app/upload" },
                  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, step: "2", title: "Run Batch Scoring", sub: "Dashboard → Batch Engine → Run to 100%", href: "/app/dashboard" },
                  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, step: "3", title: "Explore Pattern Intelligence", sub: "Patterns → select team → Generate report", href: "/app/patterns" },
                ].map(item => (
                  <a key={item.step} href={item.href} onClick={onComplete} className="ts-ob-action-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="ts-ob-action-icon" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="ts-ob-action-title">{item.step}. {item.title}</div>
                      <div className="ts-ob-action-sub">{item.sub}</div>
                    </div>
                    <div className="ts-ob-action-arrow">→</div>
                  </a>
                ))}
                <button className="ts-ob-btn" onClick={onComplete} style={{ marginTop: 8 }}>
                  Go to Dashboard →
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
