"use client";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Conv = {
  id: string;
  createdAt: string;
  score: number | null;
  transcript: string;
  agentId: string;
  agentName?: string;
  teamName?: string;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return null;
  return Number(n).toFixed(1);
}

function scoreColor(n: number | null | undefined) {
  const v = Number(n);
  if (!n || Number.isNaN(v)) return "var(--ts-muted)";
  if (v >= 80) return "var(--ts-success)";
  if (v >= 60) return "var(--ts-warn)";
  return "var(--ts-danger)";
}

function scoreBg(n: number | null | undefined) {
  const v = Number(n);
  if (!n || Number.isNaN(v)) return "var(--ts-bg-soft)";
  if (v >= 80) return "rgba(31,122,58,0.08)";
  if (v >= 60) return "rgba(184,106,0,0.08)";
  return "rgba(180,35,24,0.08)";
}

function initials(name: string) {
  return name.split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase();
}

function safeJson(txt: string) {
  try { return { ok: true as const, json: JSON.parse(txt) }; }
  catch { return { ok: false as const, json: null }; }
}

const PAGE_SIZE = 20;

export default function ConversationsPage() {
  const [convs, setConvs]         = useState<Conv[]>([]);
  const [agents, setAgents]       = useState<Record<string, { name: string; teamName: string }>>({});
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [scoreFilter, setScoreFilter]     = useState<"all"|"scored"|"unscored"|"high"|"low">("all");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [page, setPage]           = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function deleteConversation(id: string) {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/conversations/delete?id=${encodeURIComponent(id)}`, { method: "POST" });
      const txt = await r.text();
      console.log("DELETE status:", r.status, "response:", txt);
      if (!r.ok) throw new Error(txt);
      setConvs(prev => prev.filter(c => c.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (e: any) {
      console.error("DELETE error:", e?.message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  useEffect(() => { load(); }, []);
  // reset page on filter change
  useEffect(() => { setPage(1); }, [search, selectedAgent, scoreFilter]);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const ar = await fetch("/api/meta/agents", { cache: "no-store" });
      const ap = safeJson(await ar.text());
      const agentMap: Record<string, { name: string; teamName: string }> = {};
      if (ap.ok) for (const a of (ap.json?.agents ?? [])) agentMap[a.id] = { name: a.name, teamName: a.teamName ?? "" };
      setAgents(agentMap);

      const allConvs: Conv[] = [];
      await Promise.all(Object.keys(agentMap).map(async (agentId) => {
        try {
          const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, { cache: "no-store" });
          const p = safeJson(await r.text());
          if (p.ok && p.json?.conversations) {
            for (const c of p.json.conversations) {
              allConvs.push({ ...c, agentId, agentName: agentMap[agentId]?.name, teamName: agentMap[agentId]?.teamName });
            }
          }
        } catch { /* ignore */ }
      }));
      allConvs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setConvs(allConvs);
    } catch (e: any) { setErr(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    return convs.filter((c) => {
      if (selectedAgent && c.agentId !== selectedAgent) return false;
      if (scoreFilter === "scored"   && c.score == null) return false;
      if (scoreFilter === "unscored" && c.score != null) return false;
      if (scoreFilter === "high"     && (c.score == null || Number(c.score) < 75)) return false;
      if (scoreFilter === "low"      && (c.score == null || Number(c.score) >= 60)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (c.agentName || "").toLowerCase().includes(q) || (c.transcript || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [convs, selectedAgent, scoreFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const scored   = convs.filter(c => c.score != null).length;
  const avgScore = scored ? convs.filter(c => c.score != null).reduce((s, c) => s + Number(c.score), 0) / scored : null;
  const highCount = convs.filter(c => c.score != null && Number(c.score) >= 75).length;

  const agentOptions = Object.entries(agents);

  return (
    <>
      <style>{`
        /* KPI */
        .ts-convs-kpi {
          display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px;
        }
        @media(max-width:700px){ .ts-convs-kpi { grid-template-columns:repeat(2,1fr); } }
        .ts-ckpi {
          background:var(--ts-surface); border:1px solid var(--ts-border);
          border-radius:var(--ts-radius-md); padding:14px 16px;
        }
        .ts-ckpi-label { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--ts-muted); margin-bottom:6px; }
        .ts-ckpi-val { font-size:24px; font-weight:900; letter-spacing:-0.04em; }
        .ts-ckpi-sub { font-size:11px; color:var(--ts-muted); margin-top:3px; }

        /* Toolbar */
        .ts-convs-toolbar {
          display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; align-items:center;
        }
        .ts-convs-search {
          flex:1; min-width:180px; height:36px; padding:0 13px;
          border-radius:10px; border:1px solid var(--ts-border);
          background:var(--ts-surface); color:var(--ts-ink); font-size:14px; outline:none;
        }
        .ts-convs-search:focus { border-color:rgba(64,97,132,0.4); }

        /* Score filter chips */
        .ts-filter-chips { display:flex; gap:6px; flex-wrap:wrap; }
        .ts-fchip {
          height:32px; padding:0 12px; border-radius:20px; font-size:12px; font-weight:700;
          border:1px solid var(--ts-border); background:var(--ts-surface); color:var(--ts-muted);
          cursor:pointer; transition:all 0.12s; white-space:nowrap;
        }
        .ts-fchip:hover { border-color:rgba(64,97,132,0.3); color:var(--ts-accent); }
        .ts-fchip.active {
          background:rgba(64,97,132,0.1); border-color:rgba(64,97,132,0.3);
          color:var(--ts-accent);
        }

        /* Conv row */
        .ts-conv-item {
          border-bottom:1px solid var(--ts-border-soft);
          transition:background 0.1s;
        }
        .ts-conv-item:last-child { border-bottom:none; }
        .ts-conv-item:hover { background:rgba(64,97,132,0.03); }

        .ts-conv-header {
          display:grid;
          grid-template-columns:36px 1fr 64px 90px 60px 36px;
          gap:12px; align-items:center;
          padding:12px 18px; cursor:pointer;
        }
        @media(max-width:600px){
          .ts-conv-header { grid-template-columns:36px 1fr 56px 40px 32px; }
          .ts-conv-date-col { display:none; }
        }

        .ts-conv-avatar {
          width:34px; height:34px; border-radius:9px; flex-shrink:0;
          background:linear-gradient(135deg,rgba(64,97,132,0.15),rgba(64,97,132,0.4));
          border:1px solid rgba(64,97,132,0.2);
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:800; color:var(--ts-accent);
        }

        .ts-conv-agent-name { font-size:14px; font-weight:700; }
        .ts-conv-team       { font-size:11px; color:var(--ts-muted); margin-top:1px; }

        .ts-conv-score-badge {
          display:flex; align-items:center; justify-content:center;
          height:28px; border-radius:8px; font-size:13px; font-weight:800;
          border:1px solid transparent;
        }

        .ts-conv-date-col { font-size:12px; color:var(--ts-muted); }

        .ts-conv-toggle {
          font-size:11px; color:var(--ts-accent); font-weight:700;
          text-align:right; white-space:nowrap;
        }

        /* Excerpt */
        .ts-conv-excerpt {
          padding:0 18px 10px calc(18px + 36px + 12px);
          font-size:13px; color:var(--ts-muted); line-height:1.6;
          display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;
        }

        /* Full transcript */
        .ts-conv-transcript {
          margin:0 18px 14px;
          padding:14px 16px; border-radius:var(--ts-radius-md);
          background:var(--ts-bg-soft); border:1px solid var(--ts-border-soft);
          font-size:13px; line-height:1.75; color:var(--ts-ink);
          white-space:pre-wrap; max-height:300px; overflow-y:auto;
        }
        .ts-conv-transcript-head {
          display:flex; align-items:center; justify-content:space-between;
          margin:4px 18px 8px;
        }

        /* Pagination */
        .ts-pagination {
          display:flex; align-items:center; justify-content:center;
          gap:6px; margin-top:16px; flex-wrap:wrap;
        }
        .ts-page-btn {
          min-width:34px; height:34px; border-radius:9px; padding:0 10px;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          color:var(--ts-ink); font-size:13px; font-weight:700;
          cursor:pointer; transition:all 0.1s;
        }
        .ts-page-btn:hover { background:rgba(64,97,132,0.08); border-color:rgba(64,97,132,0.3); }
        .ts-page-btn.active {
          background:rgba(64,97,132,0.12); border-color:rgba(64,97,132,0.35);
          color:var(--ts-accent);
        }
        .ts-page-btn:disabled { opacity:0.35; cursor:not-allowed; }

        /* Skeleton */
        .ts-conv-skel {
          height:64px; border-radius:8px; margin-bottom:4px;
          background:var(--ts-border-soft); animation:ts-pulse 1.4s ease-in-out infinite;
        }
      `}</style>

      <div className="ts-container">
        {/* Head */}
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Conversations</div>
            <div className="ts-subtitle">All transcripts across all agents</div>
          </div>
          <Link href="/app/upload" className="ts-btn ts-btn-primary">+ Upload</Link>
        </div>

        {err && <div className="ts-alert ts-alert-error" style={{ marginBottom: 16 }}>{err}</div>}

        {/* KPI strip */}
        <div className="ts-convs-kpi">
          <div className="ts-ckpi">
            <div className="ts-ckpi-label">Total</div>
            <div className="ts-ckpi-val">{convs.length || "—"}</div>
            <div className="ts-ckpi-sub">conversations</div>
          </div>
          <div className="ts-ckpi">
            <div className="ts-ckpi-label">Scored</div>
            <div className="ts-ckpi-val" style={{ color: scored > 0 ? "var(--ts-accent)" : undefined }}>{scored || "—"}</div>
            <div className="ts-ckpi-sub">{convs.length ? Math.round(scored / convs.length * 100) : 0}% coverage</div>
          </div>
          <div className="ts-ckpi">
            <div className="ts-ckpi-label">Avg Score</div>
            <div className="ts-ckpi-val" style={{ color: avgScore ? scoreColor(avgScore) : undefined }}>
              {avgScore ? avgScore.toFixed(1) : "—"}
            </div>
            <div className="ts-ckpi-sub">across scored</div>
          </div>
          <div className="ts-ckpi">
            <div className="ts-ckpi-label">High Quality</div>
            <div className="ts-ckpi-val" style={{ color: highCount > 0 ? "var(--ts-success)" : undefined }}>{highCount || "—"}</div>
            <div className="ts-ckpi-sub">score ≥ 75</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ts-convs-toolbar">
          <input
            className="ts-convs-search"
            placeholder="Search by agent or transcript…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="ts-select" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
            <option value="">All agents</option>
            {agentOptions.map(([id, a]) => <option key={id} value={id}>{a.name}</option>)}
          </select>
          <button className="ts-btn" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
        </div>

        {/* Score filter chips */}
        <div className="ts-filter-chips" style={{ marginBottom: 16 }}>
          {(["all", "scored", "unscored", "high", "low"] as const).map(f => {
            const labels = { all: "All", scored: "Scored", unscored: "Not scored", high: "High ≥75", low: "Low <60" };
            return (
              <button key={f} className={`ts-fchip ${scoreFilter === f ? "active" : ""}`} onClick={() => setScoreFilter(f)}>
                {labels[f]}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ts-muted)", alignSelf: "center" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* List */}
        <div className="ts-card">
          {loading ? (
            <div style={{ padding: "16px 18px" }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="ts-conv-skel" style={{ marginBottom: 6 }} />)}
            </div>
          ) : !paginated.length ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>No conversations found</div>
              <div className="ts-muted" style={{ fontSize: 13 }}>
                Try changing filters or{" "}
                <Link href="/app/upload" style={{ color: "var(--ts-accent)" }}>upload transcripts</Link>
              </div>
            </div>
          ) : (
            paginated.map((c) => {
              const isOpen = expanded === c.id;
              const score  = fmt(c.score);
              const sc     = scoreColor(c.score);
              const sbg    = scoreBg(c.score);
              const name   = c.agentName || c.agentId;

              return (
                <div key={c.id} className="ts-conv-item">
                  <div className="ts-conv-header" onClick={() => setExpanded(isOpen ? null : c.id)}>
                    {/* Avatar */}
                    <div className="ts-conv-avatar">{initials(name)}</div>

                    {/* Agent info */}
                    <div>
                      <div className="ts-conv-agent-name">{name}</div>
                      <div className="ts-conv-team">{c.teamName || "—"}</div>
                    </div>

                    {/* Score badge */}
                    <div className="ts-conv-score-badge" style={{ background: sbg, color: sc, borderColor: sbg }}>
                      {score ?? <span style={{ fontSize: 11, color: "var(--ts-muted)" }}>—</span>}
                    </div>

                    {/* Date */}
                    <div className="ts-conv-date-col">
                      {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>

                    {/* Toggle */}
                    <div className="ts-conv-toggle">{isOpen ? "▲ Hide" : "▼ View"}</div>

                    {/* Delete */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirmDeleteId === c.id) {
                          deleteConversation(c.id);
                        } else {
                          setConfirmDeleteId(c.id);
                          setTimeout(() => setConfirmDeleteId(id => id === c.id ? null : id), 3000);
                        }
                      }}
                      style={{
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        color: confirmDeleteId === c.id ? "var(--ts-danger)" : "var(--ts-muted)",
                        userSelect: "none", flexShrink: 0,
                      }}
                    >
                      {deletingId === c.id ? "…" : confirmDeleteId === c.id ? "Sure?" : "Delete"}
                    </span>
                  </div>

                  {/* Excerpt (collapsed) */}
                  {!isOpen && (
                    <div className="ts-conv-excerpt">
                      {c.transcript?.slice(0, 180).replace(/\n/g, " ")}…
                    </div>
                  )}

                  {/* Full transcript */}
                  {isOpen && (
                    <>
                      <div className="ts-conv-transcript-head">
                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ts-muted)" }}>
                          Full Transcript
                        </span>
                        <Link href={`/app/agents/${c.agentId}`} style={{ fontSize: 12, color: "var(--ts-accent)", fontWeight: 600 }}>
                          View agent →
                        </Link>
                      </div>
                      <div className="ts-conv-transcript">{c.transcript}</div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="ts-pagination">
            <button className="ts-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number|"…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i-1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…"
                  ? <span key={`e${i}`} style={{ padding: "0 4px", color: "var(--ts-muted)" }}>…</span>
                  : <button key={p} className={`ts-page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p as number)}>{p}</button>
              )
            }

            <button className="ts-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--ts-muted)", textAlign: "center" }}>
            Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
          </div>
        )}
      </div>
    </>
  );
}
