"use client";


import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────
type Org  = { id: string; name: string; createdAt: string; _count?: { teams: number } };
type Team = { id: string; name: string; organizationId: string; createdAt: string; _count?: { agents: number } };
type Rules = { title: string; content: string; savedAt: string } | null;

type Tab = "workspace" | "rules" | "danger";

async function safeJson(p: Promise<Response>) {
  const r = await p;
  const t = await r.text();
  try { return { ok: r.ok, json: JSON.parse(t) }; }
  catch { return { ok: false, json: null }; }
}

// ─── Component ───────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("workspace");

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [rules, setRules] = useState<Rules>(null);
  const [loading, setLoading] = useState(true);

  // Workspace state
  const [newOrgName, setNewOrgName]   = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamOrg, setNewTeamOrg]   = useState("");
  const [editOrgId, setEditOrgId]     = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editTeamId, setEditTeamId]   = useState("");
  const [editTeamName, setEditTeamName] = useState("");

  // Rules state
  const [rulesTitle, setRulesTitle]   = useState("");
  const [rulesContent, setRulesContent] = useState("");

  // UI state
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState<{ type: "ok"|"err"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "org"|"team"; id: string; name: string } | null>(null);

  useEffect(() => { loadAll(); }, []);

  function flash(type: "ok"|"err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [or, tr, rr] = await Promise.all([
        safeJson(fetch("/api/meta/orgs", { cache: "no-store" })),
        safeJson(fetch("/api/meta/teams", { cache: "no-store" })),
        safeJson(fetch("/api/rules/save", { cache: "no-store" })),
      ]);
      if (or.ok) setOrgs(or.json?.orgs ?? []);
      if (tr.ok) setTeams(tr.json?.teams ?? []);
      if (rr.ok && rr.json?.rules) {
        setRules(rr.json.rules);
        setRulesTitle(rr.json.rules.title ?? "");
        setRulesContent(rr.json.rules.content ?? "");
      }
      if (or.json?.orgs?.[0] && !newTeamOrg) setNewTeamOrg(or.json.orgs[0].id);
    } finally { setLoading(false); }
  }

  // ── Org actions ──────────────────────────────────────────
  async function createOrg() {
    if (!newOrgName.trim()) return;
    setSaving(true);
    const r = await safeJson(fetch("/api/settings/org", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newOrgName }) }));
    setSaving(false);
    if (r.ok) { setNewOrgName(""); flash("ok", "Organization created"); loadAll(); }
    else flash("err", r.json?.error || "Failed");
  }

  async function renameOrg() {
    if (!editOrgId || !editOrgName.trim()) return;
    setSaving(true);
    const r = await safeJson(fetch("/api/settings/org", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editOrgId, name: editOrgName }) }));
    setSaving(false);
    if (r.ok) { setEditOrgId(""); setEditOrgName(""); flash("ok", "Renamed"); loadAll(); }
    else flash("err", r.json?.error || "Failed");
  }

  async function deleteOrg(id: string) {
    setSaving(true);
    const r = await safeJson(fetch(`/api/settings/org?id=${id}`, { method: "DELETE" }));
    setSaving(false);
    setConfirmDelete(null);
    if (r.ok) { flash("ok", "Organization deleted"); loadAll(); }
    else flash("err", r.json?.error || "Failed");
  }

  // ── Team actions ─────────────────────────────────────────
  async function createTeam() {
    if (!newTeamName.trim() || !newTeamOrg) return;
    setSaving(true);
    const r = await safeJson(fetch("/api/settings/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTeamName, organizationId: newTeamOrg }) }));
    setSaving(false);
    if (r.ok) { setNewTeamName(""); flash("ok", "Team created"); loadAll(); }
    else flash("err", r.json?.error || "Failed");
  }

  async function renameTeam() {
    if (!editTeamId || !editTeamName.trim()) return;
    setSaving(true);
    const r = await safeJson(fetch("/api/settings/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editTeamId, name: editTeamName }) }));
    setSaving(false);
    if (r.ok) { setEditTeamId(""); setEditTeamName(""); flash("ok", "Renamed"); loadAll(); }
    else flash("err", r.json?.error || "Failed");
  }

  async function deleteTeam(id: string) {
    setSaving(true);
    const r = await safeJson(fetch(`/api/settings/team?id=${id}`, { method: "DELETE" }));
    setSaving(false);
    setConfirmDelete(null);
    if (r.ok) { flash("ok", "Team deleted"); loadAll(); }
    else flash("err", r.json?.error || "Failed");
  }

  // ── Rules actions ─────────────────────────────────────────
  async function saveRules() {
    if (!rulesContent.trim()) return;
    setSaving(true);
    const r = await safeJson(fetch("/api/rules/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: rulesTitle || "Company Rules", content: rulesContent }) }));
    setSaving(false);
    if (r.ok) { flash("ok", "Rules saved — AI scoring engine updated"); loadAll(); }
    else flash("err", r.json?.error || "Failed");
  }

  function clearRules() {
    setRulesTitle(""); setRulesContent(""); setRules(null);
    flash("ok", "Rules cleared from editor");
  }

  const orgById = Object.fromEntries(orgs.map(o => [o.id, o]));

  return (
    <>
      <style>{`
        /* Tabs */
        .ts-settings-tabs {
          display:flex; gap:2px; border-bottom:1px solid var(--ts-border);
          margin-bottom:28px; overflow-x:auto;
        }
        .ts-stab {
          padding:10px 18px; font-size:14px; font-weight:700;
          color:var(--ts-muted); border:none; background:none; cursor:pointer;
          border-bottom:2px solid transparent; margin-bottom:-1px;
          white-space:nowrap; transition:color 0.1s;
        }
        .ts-stab:hover { color:var(--ts-ink); }
        .ts-stab.active { color:var(--ts-accent); border-bottom-color:var(--ts-accent); }

        /* Sections */
        .ts-settings-section {
          background:var(--ts-surface); border:1px solid var(--ts-border);
          border-radius:var(--ts-radius-lg); margin-bottom:16px; overflow:hidden;
        }
        .ts-settings-section-head {
          padding:18px 22px; border-bottom:1px solid var(--ts-border-soft);
          display:flex; align-items:center; justify-content:space-between;
        }
        .ts-settings-section-title { font-size:15px; font-weight:800; }
        .ts-settings-section-body { padding:20px 22px; }

        /* Add row */
        .ts-add-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .ts-settings-input {
          flex:1; min-width:160px; height:38px; padding:0 13px;
          border-radius:10px; border:1px solid var(--ts-border);
          background:var(--ts-bg-soft); color:var(--ts-ink);
          font-size:14px; outline:none; transition:border-color 0.1s;
        }
        .ts-settings-input:focus { border-color:rgba(64,97,132,0.4); background:var(--ts-surface); }

        /* Item rows */
        .ts-item-list { margin-top:16px; display:flex; flex-direction:column; gap:6px; }
        .ts-item-row {
          display:flex; align-items:center; gap:10px; padding:10px 14px;
          border-radius:12px; border:1px solid var(--ts-border-soft);
          background:var(--ts-bg-soft);
        }
        .ts-item-row:hover { border-color:var(--ts-border); }
        .ts-item-icon {
          width:32px; height:32px; border-radius:8px; flex-shrink:0;
          background:rgba(64,97,132,0.1); border:1px solid rgba(64,97,132,0.15);
          display:flex; align-items:center; justify-content:center; font-size:14px;
        }
        .ts-item-name { flex:1; font-size:14px; font-weight:700; }
        .ts-item-meta { font-size:11px; color:var(--ts-muted); margin-top:1px; }
        .ts-item-actions { display:flex; gap:6px; }

        /* Edit inline */
        .ts-inline-edit { display:flex; gap:6px; flex:1; align-items:center; }
        .ts-inline-input {
          flex:1; height:32px; padding:0 10px; border-radius:8px;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          color:var(--ts-ink); font-size:13px; outline:none;
        }
        .ts-inline-input:focus { border-color:rgba(64,97,132,0.4); }

        /* Buttons */
        .ts-btn-icon {
          height:30px; padding:0 10px; border-radius:8px; font-size:12px; font-weight:700;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          color:var(--ts-muted); cursor:pointer; transition:all 0.1s;
        }
        .ts-btn-icon:hover { border-color:rgba(64,97,132,0.3); color:var(--ts-accent); }
        .ts-btn-icon.danger { border-color:rgba(180,35,24,0.2); color:var(--ts-danger); }
        .ts-btn-icon.danger:hover { background:rgba(180,35,24,0.06); }

        /* Rules textarea */
        .ts-rules-textarea {
          width:100%; min-height:220px; padding:14px; border-radius:12px;
          border:1px solid var(--ts-border); background:var(--ts-bg-soft);
          color:var(--ts-ink); font-size:13px; line-height:1.75;
          font-family:ui-monospace,monospace; resize:vertical; outline:none;
          transition:border-color 0.1s;
        }
        .ts-rules-textarea:focus { border-color:rgba(64,97,132,0.4); background:var(--ts-surface); }

        /* Rules saved banner */
        .ts-rules-banner {
          display:flex; align-items:center; gap:12px; padding:12px 16px;
          border-radius:12px; background:rgba(31,122,58,0.07);
          border:1px solid rgba(31,122,58,0.2); margin-bottom:16px;
        }

        /* Danger zone */
        .ts-danger-item {
          display:flex; align-items:flex-start; justify-content:space-between;
          gap:16px; padding:16px 0; border-bottom:1px solid var(--ts-border-soft);
        }
        .ts-danger-item:last-child { border-bottom:none; }

        /* Confirm modal */
        .ts-modal-overlay {
          position:fixed; inset:0; z-index:60;
          background:rgba(0,0,0,0.45); backdrop-filter:blur(3px);
          display:flex; align-items:center; justify-content:center; padding:24px;
        }
        .ts-modal {
          background:var(--ts-surface); border:1px solid var(--ts-border);
          border-radius:var(--ts-radius-lg); padding:28px; max-width:420px; width:100%;
          box-shadow:var(--ts-shadow-md);
        }
        .ts-settings-card, .ts-settings-section-title, .ts-settings-card p, .ts-settings-card label {
          overflow-wrap: anywhere; word-break: break-word;
        }
        @media(max-width:600px) {
          .ts-settings-card { padding: 16px !important; }
        }

        /* Toast */
        .ts-toast {
          position:fixed; bottom:24px; right:24px; z-index:80;
          padding:12px 18px; border-radius:12px; font-size:14px; font-weight:700;
          animation:ts-slide-up 0.2s ease;
          box-shadow:var(--ts-shadow-md);
        }
        .ts-toast.ok { background:rgba(31,122,58,0.95); color:#fff; }
        .ts-toast.err { background:rgba(180,35,24,0.95); color:#fff; }
        @keyframes ts-slide-up { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }

        /* Skeleton */
        .ts-skel { background:var(--ts-border-soft); border-radius:10px; animation:ts-pulse 1.4s ease-in-out infinite; }
        @keyframes ts-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* Toast */}
      {msg && <div className={`ts-toast ${msg.type}`}>{msg.type === "ok" ? "✓" : "✕"} {msg.text}</div>}

      {/* Confirm modal */}
      {confirmDelete && (
        <div className="ts-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="ts-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>
              Delete {confirmDelete.type === "org" ? "organization" : "team"}?
            </div>
            <div style={{ fontSize: 14, color: "var(--ts-muted)", marginBottom: 22, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--ts-ink)" }}>"{confirmDelete.name}"</strong> and all its data will be permanently deleted. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ts-btn" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="ts-btn"
                style={{ flex: 1, background: "var(--ts-danger)", color: "#fff", border: "none" }}
                disabled={saving}
                onClick={() => confirmDelete.type === "org" ? deleteOrg(confirmDelete.id) : deleteTeam(confirmDelete.id)}
              >
                {saving ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ts-container">
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Settings</div>
            <div className="ts-subtitle">Manage workspace, scoring rules, and data</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ts-settings-tabs">
          {(["workspace", "rules", "danger"] as Tab[]).map(t => {
            const labels = { workspace: "Workspace", rules: "Company Rules", danger: "Danger Zone" };
            return (
              <button key={t} className={`ts-stab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {labels[t]}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="ts-skel" style={{ height: 120 }} />)}
          </div>
        ) : (

          /* ── WORKSPACE TAB ── */
          tab === "workspace" ? (
            <>
              {/* Organizations */}
              <div className="ts-settings-section">
                <div className="ts-settings-section-head">
                  <div>
                    <div className="ts-settings-section-title">Organizations</div>
                    <div style={{ fontSize: 12, color: "var(--ts-muted)", marginTop: 3 }}>Top-level workspaces that contain teams</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ts-muted)" }}>{orgs.length}</span>
                </div>
                <div className="ts-settings-section-body">
                  {/* Add org */}
                  <div className="ts-add-row">
                    <input
                      className="ts-settings-input"
                      placeholder="New organization name…"
                      value={newOrgName}
                      onChange={e => setNewOrgName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && createOrg()}
                    />
                    <button className="ts-btn ts-btn-primary" onClick={createOrg} disabled={saving || !newOrgName.trim()}>
                      + Create
                    </button>
                  </div>

                  {/* Org list */}
                  {orgs.length > 0 && (
                    <div className="ts-item-list">
                      {orgs.map(org => (
                        <div key={org.id} className="ts-item-row">
                          <div className="ts-item-icon">🏢</div>
                          {editOrgId === org.id ? (
                            <div className="ts-inline-edit">
                              <input
                                className="ts-inline-input"
                                value={editOrgName}
                                onChange={e => setEditOrgName(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") renameOrg(); if (e.key === "Escape") setEditOrgId(""); }}
                                autoFocus
                              />
                              <button className="ts-btn-icon" onClick={renameOrg} disabled={saving}>Save</button>
                              <button className="ts-btn-icon" onClick={() => setEditOrgId("")}>✕</button>
                            </div>
                          ) : (
                            <>
                              <div style={{ flex: 1 }}>
                                <div className="ts-item-name">{org.name}</div>
                                <div className="ts-item-meta">{org._count?.teams ?? 0} teams · ID: {org.id.slice(-8)}</div>
                              </div>
                              <div className="ts-item-actions">
                                <button className="ts-btn-icon" onClick={() => { setEditOrgId(org.id); setEditOrgName(org.name); }}>Rename</button>
                                <button className="ts-btn-icon danger" onClick={() => setConfirmDelete({ type: "org", id: org.id, name: org.name })}>Delete</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Teams */}
              <div className="ts-settings-section">
                <div className="ts-settings-section-head">
                  <div>
                    <div className="ts-settings-section-title">Teams</div>
                    <div style={{ fontSize: 12, color: "var(--ts-muted)", marginTop: 3 }}>Groups of agents within an organization</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ts-muted)" }}>{teams.length}</span>
                </div>
                <div className="ts-settings-section-body">
                  {/* Add team */}
                  <div className="ts-add-row">
                    <select
                      className="ts-select"
                      value={newTeamOrg}
                      onChange={e => setNewTeamOrg(e.target.value)}
                      style={{ minWidth: 160 }}
                    >
                      <option value="">Select organization</option>
                      {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <input
                      className="ts-settings-input"
                      placeholder="New team name…"
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && createTeam()}
                    />
                    <button className="ts-btn ts-btn-primary" onClick={createTeam} disabled={saving || !newTeamName.trim() || !newTeamOrg}>
                      + Create
                    </button>
                  </div>

                  {/* Team list */}
                  {teams.length > 0 && (
                    <div className="ts-item-list">
                      {teams.map(team => (
                        <div key={team.id} className="ts-item-row">
                          <div className="ts-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                          {editTeamId === team.id ? (
                            <div className="ts-inline-edit">
                              <input
                                className="ts-inline-input"
                                value={editTeamName}
                                onChange={e => setEditTeamName(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") renameTeam(); if (e.key === "Escape") setEditTeamId(""); }}
                                autoFocus
                              />
                              <button className="ts-btn-icon" onClick={renameTeam} disabled={saving}>Save</button>
                              <button className="ts-btn-icon" onClick={() => setEditTeamId("")}>✕</button>
                            </div>
                          ) : (
                            <>
                              <div style={{ flex: 1 }}>
                                <div className="ts-item-name">{team.name}</div>
                                <div className="ts-item-meta">
                                  {orgById[team.organizationId]?.name ?? "—"} · {team._count?.agents ?? 0} agents
                                </div>
                              </div>
                              <div className="ts-item-actions">
                                <button className="ts-btn-icon" onClick={() => { setEditTeamId(team.id); setEditTeamName(team.name); }}>Rename</button>
                                <button className="ts-btn-icon danger" onClick={() => setConfirmDelete({ type: "team", id: team.id, name: team.name })}>Delete</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>

          /* ── RULES TAB ── */
          ) : tab === "rules" ? (
            <div className="ts-settings-section">
              <div className="ts-settings-section-head">
                <div>
                  <div className="ts-settings-section-title">Company Rules & Standards</div>
                  <div style={{ fontSize: 12, color: "var(--ts-muted)", marginTop: 3 }}>
                    AI scores conversations against these rules. Paste scripts, compliance policies, or call standards.
                  </div>
                </div>
                {rules && (
                  <span style={{ fontSize: 12, color: "var(--ts-success)", fontWeight: 700 }}>
                    ✓ Active
                  </span>
                )}
              </div>
              <div className="ts-settings-section-body">
                {rules && (
                  <div className="ts-rules-banner">
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{rules.title}</div>
                      <div style={{ fontSize: 12, color: "var(--ts-muted)" }}>
                        Saved {new Date(rules.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} · {rules.content.length} characters
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ts-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Title (optional)</div>
                  <input
                    className="ts-settings-input"
                    style={{ width: "100%" }}
                    placeholder="e.g. Sales Script v2, Compliance Standards 2026…"
                    value={rulesTitle}
                    onChange={e => setRulesTitle(e.target.value)}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ts-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Rules content</div>
                  <textarea
                    className="ts-rules-textarea"
                    placeholder={`Paste your company standards here. Examples:\n\n1. Always greet the customer by name within 10 seconds\n2. Confirm understanding of the issue before offering solutions\n3. Never quote pricing without supervisor approval\n4. Use positive language — avoid "can't", "won't", "problem"\n5. Always summarize next steps before ending the call`}
                    value={rulesContent}
                    onChange={e => setRulesContent(e.target.value)}
                  />
                  <div style={{ fontSize: 12, color: "var(--ts-muted)", marginTop: 6 }}>
                    {rulesContent.length} characters · {rulesContent.split("\n").filter(l => l.trim()).length} lines
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="ts-btn ts-btn-primary" onClick={saveRules} disabled={saving || !rulesContent.trim()}>
                    {saving ? "Saving…" : "Save Rules"}
                  </button>
                  {rulesContent && (
                    <button className="ts-btn" onClick={clearRules}>Clear</button>
                  )}
                </div>

                <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(64,97,132,0.06)", border: "1px solid rgba(64,97,132,0.15)" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ts-accent)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>How it works</div>
                  <div style={{ fontSize: 13, color: "var(--ts-muted)", lineHeight: 1.7 }}>
                    When scoring conversations, TalkScope passes these rules to the AI engine. Agents are evaluated against your specific standards, not generic criteria. More specific rules = more accurate coaching signals.
                  </div>
                </div>
              </div>
            </div>

          /* ── DANGER ZONE TAB ── */
          ) : (
            <div className="ts-settings-section" style={{ borderColor: "rgba(180,35,24,0.25)" }}>
              <div className="ts-settings-section-head" style={{ borderBottomColor: "rgba(180,35,24,0.15)" }}>
                <div>
                  <div className="ts-settings-section-title" style={{ color: "var(--ts-danger)", display:"flex", alignItems:"center", gap:6 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Danger Zone</div>
                  <div style={{ fontSize: 12, color: "var(--ts-muted)", marginTop: 3 }}>Irreversible actions — proceed with caution</div>
                </div>
              </div>
              <div className="ts-settings-section-body">
                <div className="ts-danger-item">
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Delete an organization</div>
                    <div style={{ fontSize: 13, color: "var(--ts-muted)", lineHeight: 1.6 }}>
                      Permanently deletes the organization and all its teams, agents, conversations, and scores.
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <select
                      className="ts-select"
                      style={{ marginBottom: 8, display: "block" }}
                      onChange={e => e.target.value && setConfirmDelete({ type: "org", id: e.target.value, name: orgs.find(o => o.id === e.target.value)?.name ?? "" })}
                      value=""
                    >
                      <option value="">Select org to delete…</option>
                      {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="ts-danger-item">
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Delete a team</div>
                    <div style={{ fontSize: 13, color: "var(--ts-muted)", lineHeight: 1.6 }}>
                      Permanently deletes the team and all its agents, conversations, and scores.
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <select
                      className="ts-select"
                      style={{ marginBottom: 8, display: "block" }}
                      onChange={e => e.target.value && setConfirmDelete({ type: "team", id: e.target.value, name: teams.find(t => t.id === e.target.value)?.name ?? "" })}
                      value=""
                    >
                      <option value="">Select team to delete…</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({orgById[t.organizationId]?.name})</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
