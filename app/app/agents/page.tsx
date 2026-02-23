"use client";

export const metadata = {
  title: "Agents",
  description: "View and manage all agents in your organization. Filter by team, sort by score or risk, and navigate to individual agent performance profiles.",
};


import { useEffect, useState } from "react";
import Link from "next/link";

type AgentRow = {
  id: string;
  name: string;
  email?: string | null;
  teamName: string;
  orgName: string;
  conversationsCount: number;
  scoresCount: number;
};

type Score = {
  overallScore: number | null;
  riskScore: number | null;
  coachingPriority: number | null;
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

function riskChip(n: number | null | undefined) {
  const v = Number(n);
  if (!n || Number.isNaN(v)) return "ts-chip ts-chip-muted";
  if (v >= 70) return "ts-chip ts-chip-danger";
  if (v >= 45) return "ts-chip ts-chip-warn";
  return "ts-chip ts-chip-success";
}

function priorityChip(n: number | null | undefined) {
  const v = Number(n);
  if (!n || Number.isNaN(v)) return "ts-chip ts-chip-muted";
  if (v >= 70) return "ts-chip ts-chip-danger";
  if (v >= 45) return "ts-chip ts-chip-warn";
  return "ts-chip ts-chip-success";
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
}

function safeJson(txt: string) {
  try { return { ok: true as const, json: JSON.parse(txt) }; }
  catch (e: any) { return { ok: false as const, error: e?.message }; }
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "overall" | "risk" | "priority">("overall");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/meta/agents", { cache: "no-store" });
      const txt = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const p = safeJson(txt);
      if (!p.ok) throw new Error("JSON parse error");
      const list: AgentRow[] = p.json.agents ?? [];
      setAgents(list);
      await fetchScores(list);
    } catch (e: any) {
      setErr(e?.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  async function fetchScores(list: AgentRow[]) {
    const result: Record<string, Score> = {};
    await Promise.all(
      list.map(async (a) => {
        try {
          const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(a.id)}`, { cache: "no-store" });
          const txt = await r.text();
          const p = safeJson(txt);
          if (p.ok && p.json?.lastScore) {
            result[a.id] = p.json.lastScore;
          }
        } catch { /* ignore */ }
      })
    );
    setScores(result);
  }

  const filtered = agents
    .filter((a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.teamName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const sa = scores[a.id];
      const sb = scores[b.id];
      if (sortBy === "overall") return (sb?.overallScore ?? -1) - (sa?.overallScore ?? -1);
      if (sortBy === "risk") return (sb?.riskScore ?? -1) - (sa?.riskScore ?? -1);
      if (sortBy === "priority") return (sb?.coachingPriority ?? -1) - (sa?.coachingPriority ?? -1);
      return 0;
    });

  const withScores = agents.filter((a) => scores[a.id]?.overallScore != null);
  const avgScore = withScores.length
    ? withScores.reduce((s, a) => s + (scores[a.id]?.overallScore ?? 0), 0) / withScores.length
    : null;
  const highRisk = agents.filter((a) => (scores[a.id]?.riskScore ?? 0) >= 70).length;
  const urgentCoach = agents.filter((a) => (scores[a.id]?.coachingPriority ?? 0) >= 70).length;

  return (
    <>
      <style>{`
        .ts-agents-kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
        @media(max-width:700px){.ts-agents-kpi{grid-template-columns:repeat(2,1fr);}}
        .ts-agents-kpi-card {
          background:var(--ts-surface); border:1px solid var(--ts-border);
          border-radius:var(--ts-radius-lg); padding:16px 20px;
        }
        .ts-agents-kpi-val { font-size:28px; font-weight:800; letter-spacing:-0.04em; margin:6px 0 2px; }
        .ts-agents-toolbar {
          display:flex; align-items:center; gap:10px;
          flex-wrap:wrap; margin-bottom:20px;
        }
        .ts-agents-search {
          flex:1; min-width:200px;
          height:38px; padding:0 14px; border-radius:12px;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          color:var(--ts-ink); font-size:14px; outline:none;
          transition:border-color 120ms;
        }
        .ts-agents-search:focus { border-color:rgba(64,97,132,0.5); }
        .ts-sort-chips { display:flex; gap:4px; }
        .ts-sort-chip {
          padding:6px 12px; border-radius:8px; font-size:13px; font-weight:650;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          color:var(--ts-muted); cursor:pointer; transition:all 0.12s;
        }
        .ts-sort-chip.active {
          background:rgba(64,97,132,0.1); border-color:rgba(64,97,132,0.3); color:var(--ts-accent);
        }
        .ts-agent-row {
          display:grid;
          grid-template-columns: 44px 1fr 100px 90px 90px 90px 80px 44px;
          align-items:center; gap:12px;
          padding:14px 20px; border-bottom:1px solid var(--ts-border-soft);
          transition:background 0.12s; cursor:pointer;
        }
        .ts-agent-row:hover { background:rgba(64,97,132,0.04); }
        .ts-agent-row:last-child { border-bottom:none; }
        .ts-agent-avatar-sm {
          width:36px; height:36px; border-radius:10px; flex-shrink:0;
          background:linear-gradient(135deg,rgba(64,97,132,0.15),rgba(64,97,132,0.4));
          border:1px solid rgba(64,97,132,0.2);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:var(--ts-accent);
        }
        .ts-agent-row-name { font-weight:700; font-size:15px; }
        .ts-agent-row-sub { font-size:12px; color:var(--ts-muted); margin-top:2px; }
        .ts-agents-thead {
          display:grid;
          grid-template-columns: 44px 1fr 100px 90px 90px 90px 80px 44px;
          gap:12px; padding:10px 20px;
          background:var(--ts-bg-soft); border-bottom:1px solid var(--ts-border);
          border-radius:var(--ts-radius-md) var(--ts-radius-md) 0 0;
        }
        .ts-agents-th {
          font-size:11px; font-weight:800; color:var(--ts-muted);
          text-transform:uppercase; letter-spacing:0.08em;
        }
        .ts-arrow-btn {
          width:32px; height:32px; border-radius:8px;
          background:transparent; border:1px solid var(--ts-border);
          display:flex; align-items:center; justify-content:center;
          color:var(--ts-accent); font-size:14px; cursor:pointer;
          transition:all 0.12s; text-decoration:none;
        }
        .ts-arrow-btn:hover { background:rgba(64,97,132,0.08); border-color:rgba(64,97,132,0.3); }
        .ts-skeleton-row {
          height:64px; border-radius:8px; margin-bottom:4px;
          background:var(--ts-border-soft); animation:ts-pulse 1.4s ease-in-out infinite;
        }
        @keyframes ts-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <div className="ts-container">
        {/* PAGE HEAD */}
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Agents</div>
            <div className="ts-subtitle">All agents, scores and coaching priorities</div>
          </div>
          <Link href="/app/upload" className="ts-btn ts-btn-primary">
            + Import Agents
          </Link>
        </div>

        {err && <div className="ts-alert ts-alert-error" style={{ marginBottom: 16 }}>{err}</div>}

        {/* KPI STRIP */}
        <div className="ts-agents-kpi">
          <div className="ts-agents-kpi-card">
            <div className="ts-kpi-label" style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ts-muted)" }}>Total Agents</div>
            <div className="ts-agents-kpi-val">{agents.length || "—"}</div>
          </div>
          <div className="ts-agents-kpi-card">
            <div className="ts-kpi-label" style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ts-muted)" }}>Avg Score</div>
            <div className="ts-agents-kpi-val" style={{ color: avgScore ? (avgScore >= 70 ? "var(--ts-success)" : avgScore >= 50 ? "var(--ts-warn)" : "var(--ts-danger)") : "var(--ts-muted)" }}>
              {avgScore ? avgScore.toFixed(1) : "—"}
            </div>
          </div>
          <div className="ts-agents-kpi-card">
            <div className="ts-kpi-label" style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ts-muted)" }}>High Risk</div>
            <div className="ts-agents-kpi-val" style={{ color: highRisk > 0 ? "var(--ts-danger)" : "var(--ts-muted)" }}>{highRisk}</div>
          </div>
          <div className="ts-agents-kpi-card">
            <div className="ts-kpi-label" style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ts-muted)" }}>Urgent Coaching</div>
            <div className="ts-agents-kpi-val" style={{ color: urgentCoach > 0 ? "var(--ts-warn)" : "var(--ts-muted)" }}>{urgentCoach}</div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="ts-agents-toolbar">
          <input
            className="ts-agents-search"
            placeholder="Search by name or team…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="ts-sort-chips">
            {(["overall", "risk", "priority", "name"] as const).map((s) => (
              <button key={s} className={`ts-sort-chip ${sortBy === s ? "active" : ""}`} onClick={() => setSortBy(s)}>
                {s === "overall" ? "Score" : s === "priority" ? "Coaching" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <button className="ts-btn" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* TABLE */}
        <div className="ts-card">
          <div className="ts-agents-thead">
            <div />
            <div className="ts-agents-th">Agent</div>
            <div className="ts-agents-th">Overall</div>
            <div className="ts-agents-th">Risk</div>
            <div className="ts-agents-th">Coaching</div>
            <div className="ts-agents-th">Convs</div>
            <div className="ts-agents-th">Scores</div>
            <div />
          </div>

          {loading ? (
            <div style={{ padding: "16px 20px" }}>
              {[1,2,3,4,5].map((i) => <div key={i} className="ts-skeleton-row" />)}
            </div>
          ) : !filtered.length ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>No agents found</div>
              <div className="ts-muted" style={{ fontSize: 13 }}>
                {search ? "Try a different search" : "Import agents to get started"}
              </div>
            </div>
          ) : (
            filtered.map((a) => {
              const sc = scores[a.id] ?? null;
              return (
                <Link key={a.id} href={`/app/agents/${a.id}`} style={{ textDecoration: "none", color: "inherit", display: "contents" }}>
                  <div className="ts-agent-row">
                    <div className="ts-agent-avatar-sm">{initials(a.name)}</div>
                    <div>
                      <div className="ts-agent-row-name">{a.name}</div>
                      <div className="ts-agent-row-sub">{a.teamName}{a.orgName ? ` · ${a.orgName}` : ""}</div>
                    </div>
                    <div>
                      <span className={scoreChip(sc?.overallScore)} style={{ fontSize: 12, padding: "3px 10px" }}>
                        {fmt(sc?.overallScore)}
                      </span>
                    </div>
                    <div>
                      <span className={riskChip(sc?.riskScore)} style={{ fontSize: 12, padding: "3px 10px" }}>
                        {fmt(sc?.riskScore)}
                      </span>
                    </div>
                    <div>
                      <span className={priorityChip(sc?.coachingPriority)} style={{ fontSize: 12, padding: "3px 10px" }}>
                        {fmt(sc?.coachingPriority)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ts-muted)", fontWeight: 600 }}>{a.conversationsCount}</div>
                    <div style={{ fontSize: 13, color: "var(--ts-muted)", fontWeight: 600 }}>{a.scoresCount}</div>
                    <div>
                      <span className="ts-arrow-btn">→</span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--ts-muted)" }}>
            Showing {filtered.length} of {agents.length} agents
          </div>
        )}
      </div>
    </>
  );
}
