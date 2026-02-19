"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Conv = {
  id: string;
  createdAt: string;
  score: number | null;
  transcript: string;
  excerpt?: string;
  agentId: string;
  agentName?: string;
  teamName?: string;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function scoreChip(n: number | null | undefined) {
  const v = Number(n);
  if (!n || Number.isNaN(v)) return "ts-chip ts-chip-muted";
  if (v >= 80) return "ts-chip ts-chip-success";
  if (v >= 60) return "ts-chip ts-chip-accent";
  return "ts-chip ts-chip-danger";
}

function safeJson(txt: string) {
  try { return { ok: true as const, json: JSON.parse(txt) }; }
  catch { return { ok: false as const }; }
}

export default function ConversationsPage() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [agents, setAgents] = useState<Record<string, { name: string; teamName: string }>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // Load agents first for names
      const ar = await fetch("/api/meta/agents", { cache: "no-store" });
      const at = await ar.text();
      const ap = safeJson(at);
      const agentMap: Record<string, { name: string; teamName: string }> = {};
      if (ap.ok) {
        for (const a of (ap.json.agents ?? [])) {
          agentMap[a.id] = { name: a.name, teamName: a.teamName ?? "" };
        }
      }
      setAgents(agentMap);

      // Load conversations via agent pages (reuse existing API)
      const allConvs: Conv[] = [];
      await Promise.all(
        Object.keys(agentMap).map(async (agentId) => {
          try {
            const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, { cache: "no-store" });
            const txt = await r.text();
            const p = safeJson(txt);
            if (p.ok && p.json?.conversations) {
              for (const c of p.json.conversations) {
                allConvs.push({
                  ...c,
                  agentId,
                  agentName: agentMap[agentId]?.name,
                  teamName: agentMap[agentId]?.teamName,
                });
              }
            }
          } catch { /* ignore */ }
        })
      );
      allConvs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setConvs(allConvs);
    } catch (e: any) {
      setErr(e?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }

  const agentOptions = Object.entries(agents);

  const filtered = convs.filter((c) => {
    if (selectedAgent && c.agentId !== selectedAgent) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (c.agentName || "").toLowerCase().includes(q) ||
        (c.transcript || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalConvs = convs.length;
  const scored = convs.filter((c) => c.score != null).length;
  const avgScore = scored
    ? convs.filter((c) => c.score != null).reduce((s, c) => s + (c.score ?? 0), 0) / scored
    : null;

  return (
    <>
      <style>{`
        .ts-convs-kpi { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
        @media(max-width:600px){.ts-convs-kpi{grid-template-columns:1fr 1fr;}}
        .ts-convs-kpi-card {
          background:var(--ts-surface); border:1px solid var(--ts-border);
          border-radius:var(--ts-radius-lg); padding:16px 20px;
        }
        .ts-convs-kpi-val { font-size:28px; font-weight:800; letter-spacing:-0.04em; margin:6px 0 2px; }
        .ts-convs-toolbar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px; }
        .ts-convs-search {
          flex:1; min-width:200px; height:38px; padding:0 14px;
          border-radius:12px; border:1px solid var(--ts-border);
          background:var(--ts-surface); color:var(--ts-ink); font-size:14px; outline:none;
        }
        .ts-conv-row {
          padding:16px 20px; border-bottom:1px solid var(--ts-border-soft);
          cursor:pointer; transition:background 0.12s;
        }
        .ts-conv-row:hover { background:rgba(64,97,132,0.04); }
        .ts-conv-row:last-child { border-bottom:none; }
        .ts-conv-row-head {
          display:grid; grid-template-columns:1fr 90px 100px 80px;
          gap:12px; align-items:center;
        }
        .ts-conv-agent { font-weight:700; font-size:14px; }
        .ts-conv-team { font-size:12px; color:var(--ts-muted); }
        .ts-conv-date { font-size:12px; color:var(--ts-muted); }
        .ts-conv-excerpt-text {
          font-size:13px; color:var(--ts-muted); margin-top:6px;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
        }
        .ts-conv-full {
          margin-top:14px; padding:14px; border-radius:var(--ts-radius-md);
          background:var(--ts-bg-soft); border:1px solid var(--ts-border-soft);
          font-size:13px; line-height:1.7; color:var(--ts-ink);
          white-space:pre-wrap; max-height:320px; overflow-y:auto;
        }
        .ts-skeleton-row {
          height:72px; border-radius:8px; margin-bottom:4px;
          background:var(--ts-border-soft); animation:ts-pulse 1.4s ease-in-out infinite;
        }
      `}</style>

      <div className="ts-container">
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Conversations</div>
            <div className="ts-subtitle">All transcripts across all agents</div>
          </div>
          <Link href="/app/upload" className="ts-btn ts-btn-primary">+ Upload</Link>
        </div>

        {err && <div className="ts-alert ts-alert-error" style={{ marginBottom: 16 }}>{err}</div>}

        {/* KPI */}
        <div className="ts-convs-kpi">
          <div className="ts-convs-kpi-card">
            <div className="ts-card-title">Total</div>
            <div className="ts-convs-kpi-val">{totalConvs || "—"}</div>
          </div>
          <div className="ts-convs-kpi-card">
            <div className="ts-card-title">Scored</div>
            <div className="ts-convs-kpi-val">{scored || "—"}</div>
          </div>
          <div className="ts-convs-kpi-card">
            <div className="ts-card-title">Avg Score</div>
            <div className="ts-convs-kpi-val" style={{ color: avgScore ? (avgScore >= 70 ? "var(--ts-success)" : "var(--ts-warn)") : "var(--ts-muted)" }}>
              {avgScore ? avgScore.toFixed(1) : "—"}
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="ts-convs-toolbar">
          <input className="ts-convs-search" placeholder="Search transcript content…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="ts-select" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
            <option value="">All agents</option>
            {agentOptions.map(([id, a]) => <option key={id} value={id}>{a.name}</option>)}
          </select>
          <button className="ts-btn" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
        </div>

        {/* LIST */}
        <div className="ts-card">
          {loading ? (
            <div style={{ padding: "16px 20px" }}>
              {[1,2,3,4,5].map((i) => <div key={i} className="ts-skeleton-row" />)}
            </div>
          ) : !filtered.length ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>No conversations found</div>
              <div className="ts-muted" style={{ fontSize: 13 }}>
                <Link href="/app/upload" style={{ color: "var(--ts-accent)" }}>Upload transcripts</Link> to get started
              </div>
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="ts-conv-row" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div className="ts-conv-row-head">
                  <div>
                    <div className="ts-conv-agent">{c.agentName || c.agentId}</div>
                    <div className="ts-conv-team">{c.teamName}</div>
                  </div>
                  <span className={scoreChip(c.score)} style={{ fontSize: 12, padding: "3px 10px" }}>
                    {fmt(c.score)}
                  </span>
                  <div className="ts-conv-date">{new Date(c.createdAt).toLocaleDateString()}</div>
                  <div style={{ color: "var(--ts-accent)", fontSize: 13, fontWeight: 600 }}>
                    {expanded === c.id ? "▲ Hide" : "▼ View"}
                  </div>
                </div>
                <div className="ts-conv-excerpt-text">{c.excerpt || c.transcript?.slice(0, 200)}</div>
                {expanded === c.id && (
                  <div className="ts-conv-full">{c.transcript}</div>
                )}
              </div>
            ))
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--ts-muted)" }}>
            {filtered.length} of {totalConvs} conversations
          </div>
        )}
      </div>
    </>
  );
}
