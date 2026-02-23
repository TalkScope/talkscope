"use client";

import { useState } from "react";
import Link from "next/link";

const SECTIONS = [
  { id: "what", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.91 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.91 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"/></svg>, label: "What is TalkScope" },
  { id: "quickstart", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, label: "Quick Start" },
  { id: "dashboard", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>, label: "Dashboard" },
  { id: "agents", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: "Agents" },
  { id: "conversations", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: "Conversations" },
  { id: "patterns", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, label: "Patterns" },
  { id: "upload", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>, label: "Upload" },
  { id: "scoring", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, label: "AI Scoring" },
  { id: "security", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: "Security & Privacy" },
  { id: "faq", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label: "FAQ" },
];

const accent = "#406184";
const ink = "#0b1220";
const muted = "rgba(11,18,32,0.5)";
const border = "#e4e7ef";
const surface = "#fff";
const soft = "#f6f8fc";

function Badge({ text, color = accent }: { text: string; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}18`, border: `1px solid ${color}30`, color }}>
      {text}
    </span>
  );
}

function InfoBox({ icon, title, children, color = accent }: any) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "14px 18px", borderRadius: 12, background: `${color}08`, border: `1px solid ${color}25`, margin: "16px 0" }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: ink, lineHeight: 1.7, opacity: 0.8 }}>{children}</div>
      </div>
    </div>
  );
}

function Step({ num, title, desc, color = accent }: any) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: `1px solid ${border}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
        {num}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: ink, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: muted, lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, range, desc, color }: any) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${border}`, background: surface }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: ink }}>{label}</span>
        <Badge text={range} color={color} />
      </div>
      <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${border}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16 }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: ink, lineHeight: 1.5 }}>{q}</span>
        <span style={{ color: accent, fontSize: 18, flexShrink: 0, transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 16, fontSize: 13, color: muted, lineHeight: 1.8 }}>{a}</div>
      )}
    </div>
  );
}

function AskAI() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a helpful TalkScope support assistant. TalkScope is an enterprise AI platform for conversation intelligence and agent performance management. It includes: Dashboard (org-level operations view), Agents (individual scoring and coaching), Conversations (transcript management), Patterns (AI behavioral pattern detection), Upload (CSV agents + TXT transcripts), and Settings. Answer questions concisely and helpfully in 2-4 sentences. Focus on practical guidance.",
          messages: [{ role: "user", content: question }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((c: any) => c.text || "").join("") || "Sorry, I couldn't process that. Please try again.";
      setAnswer(text);
    } catch {
      setAnswer("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: `linear-gradient(135deg, ${accent}08, ${accent}15)`, border: `1px solid ${accent}30`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: ink }}>Ask AI Assistant</div>
          <div style={{ fontSize: 11, color: muted }}>Powered by Claude · Get instant answers</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: answer ? 12 : 0 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAsk()}
          placeholder="e.g. How do I import agents from CSV?"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${border}`, fontSize: 13, outline: "none", fontFamily: "inherit", color: ink, background: surface }}
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{ padding: "10px 20px", borderRadius: 10, background: accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, whiteSpace: "nowrap", fontFamily: "inherit" }}
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
      {answer && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: surface, border: `1px solid ${border}`, fontSize: 13, color: ink, lineHeight: 1.8 }}>
          {answer}
        </div>
      )}
    </div>
  );
}

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState("what");

  function scrollTo(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: soft, minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        h2 { font-size: 22px; font-weight: 800; color: ${ink}; margin-bottom: 8px; margin-top: 32px; letter-spacing: -0.02em; }
        h3 { font-size: 15px; font-weight: 700; color: ${ink}; margin-bottom: 6px; margin-top: 20px; }
        p { font-size: 14px; color: rgba(11,18,32,0.7); line-height: 1.8; margin-bottom: 12px; }
        @media (max-width: 768px) {
          .guide-sidebar { display: none !important; }
          .guide-main { padding: 20px 16px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: accent, padding: "40px 24px 32px", textAlign: "center" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, textDecoration: "none" }}>
          <img src="/logo-512.png" alt="TalkScope" style={{ width: 28, height: 28, borderRadius: 7 }} />
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>← Back to TalkScope</span>
        </Link>
        <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 10 }}>Documentation</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, maxWidth: 500, margin: "0 auto 20px" }}>
          Everything you need to get the most out of TalkScope
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {["8 Modules", "Quick Start Guide", "AI Scoring Explained", "FAQ"].map(t => (
            <span key={t} style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 0, alignItems: "flex-start" }}>

        {/* Sidebar */}
        <div className="guide-sidebar" style={{ width: 220, flexShrink: 0, position: "sticky", top: 24, padding: "24px 16px", marginTop: 24 }}>
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: muted }}>
              Contents
            </div>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: activeSection === s.id ? `${accent}10` : "none", border: "none", borderLeft: activeSection === s.id ? `2px solid ${accent}` : "2px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: activeSection === s.id ? 700 : 500, color: activeSection === s.id ? accent : ink, textAlign: "left", fontFamily: "inherit" }}
              >
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="guide-main" style={{ flex: 1, padding: "24px 32px", minWidth: 0 }}>

          {/* Ask AI - top */}
          <AskAI />

          {/* What is TalkScope */}
          <section id="what" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.91 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.91 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"/></svg>
              <h2 style={{ margin: 0 }}>What is TalkScope?</h2>
            </div>
            <p>
              TalkScope is an enterprise-grade AI platform that transforms business conversations into an operational intelligence system. It's not a reporting tool — it's a <strong>decision engine</strong> that helps you increase revenue per conversation, detect performance gaps, and coach agents at scale.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              {[
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>, title: "Operations Dashboard", desc: "Real-time view of your entire org" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, title: "AI Scoring Engine", desc: "Deep analysis of every conversation" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, title: "Pattern Intelligence", desc: "Behavioral patterns across teams" },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, title: "Coaching Engine", desc: "Prioritized coaching recommendations" },
              ].map(c => (
                <div key={c.title} style={{ padding: "14px 16px", borderRadius: 12, background: soft, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: ink, marginBottom: 3 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: muted }}>{c.desc}</div>
                </div>
              ))}
            </div>
            <InfoBox icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>} title="Key difference from CallRail / Gong">
              CallRail answers "where did the lead come from." TalkScope answers "why did the deal fail" and "which agent is losing money." It sits between lightweight call tracking and heavy enterprise tools — faster, smarter, and built for mid-market.
            </InfoBox>
          </section>

          {/* Quick Start */}
          <section id="quickstart" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <h2 style={{ margin: 0 }}>Quick Start</h2>
              <Badge text="3 minutes" color="#22c55e" />
            </div>
            <p>From zero to your first AI insights in under 3 minutes. No technical setup required.</p>
            <Step num="1" title="Create your account" desc="Go to talk-scope.com → Sign Up → enter your email and password. The onboarding wizard launches automatically." />
            <Step num="2" title="Set up your workspace" desc="Create an organization (company name), add a team (e.g. 'Sales Team A'), and add your first agent with name and email." />
            <Step num="3" title="Upload conversations" desc="Go to Upload → Upload Conversations → select an agent → upload .txt transcript files → click Upload + Score Now." color="#f59e0b" />
            <Step num="4" title="Get AI insights" desc="TalkScope instantly analyzes conversations and returns: Overall Score, Communication Score, Conversion Score, Risk Signal, Coaching Priority, strengths and weaknesses." color="#22c55e" />
            <Step num="5" title="Run Pattern Intelligence" desc="Go to Patterns → select level (agent / team / org) → click Generate. The AI finds recurring issues, conversion drivers, and coaching priorities." color="#8b5cf6" />
            <InfoBox icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>} title="Try the live demo first" color="#22c55e">
              Not sure where to start? Click "Try live demo" on the homepage to explore a pre-populated workspace with 8 agents, 100+ conversations, and pre-generated insights — no login required.
            </InfoBox>
          </section>

          {/* Dashboard */}
          <section id="dashboard" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={ display:"flex" }><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg></span>
              <h2 style={{ margin: 0 }}>Dashboard — Operations Center</h2>
            </div>
            <p>The Dashboard is your command center. It shows the state of your entire organization in real time: average scores, risk zones, top and bottom performers, and the coaching queue.</p>

            <h3>KPI Cards</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Avg Score", range: "0–100", desc: "Average overall score across all agents in the selected org/team", color: accent },
                { label: "High Risk Agents", range: "count", desc: "Agents with risk score ≥ 70 — requires immediate attention", color: "#ef4444" },
                { label: "Top Performer", range: "name", desc: "Highest-scoring agent — use as a benchmark for the team", color: "#22c55e" },
                { label: "Coaching Queue", range: "count", desc: "Agents with coaching priority ≥ 60 — prioritized list for your 1-on-1s", color: "#f59e0b" },
              ].map(m => <MetricCard key={m.label} {...m} />)}
            </div>

            <h3>Org / Team Selector</h3>
            <p>Use the dropdowns at the top to filter the dashboard by organization and team. All KPI cards, the agent list, and the coaching queue update instantly.</p>

            <h3>Batch Scoring</h3>
            <p>The Batch Scoring panel at the bottom lets you score all agents at once. Click <strong>Create Job</strong> → <strong>Run</strong>. The worker processes agents in chunks and shows live progress. Use this after bulk-uploading conversations.</p>
            <InfoBox icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} title="Pro tip">
              Click the <strong>Refresh</strong> button in the header after uploading new conversations to update the dashboard instantly.
            </InfoBox>
          </section>

          {/* Agents */}
          <section id="agents" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={ display:"flex" }><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
              <h2 style={{ margin: 0 }}>Agents</h2>
            </div>
            <p>The Agent page is the heart of TalkScope. Each agent has a full performance profile including score history, conversation list, behavioral patterns, and coaching recommendations.</p>

            <h3>Score Metrics</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Overall Score", range: "0–100", desc: "Composite score based on all conversations in the 30-day window", color: accent },
                { label: "Communication", range: "0–100", desc: "Empathy, clarity, tone, active listening, and rapport building", color: "#8b5cf6" },
                { label: "Conversion", range: "0–100", desc: "Effectiveness at closing deals and achieving the goal of the conversation", color: "#22c55e" },
                { label: "Risk Score", range: "0–100", desc: "Risk of customer loss or compliance issues. Lower is better.", color: "#ef4444" },
                { label: "Coaching Priority", range: "0–100", desc: "How urgently this agent needs coaching intervention. Higher = more urgent.", color: "#f59e0b" },
              ].map(m => <MetricCard key={m.label} {...m} />)}
            </div>

            <h3>Color System</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {[
                { label: "≥ 80 — Excellent", color: "#22c55e" },
                { label: "60–79 — Needs attention", color: "#f59e0b" },
                { label: "< 60 — Critical", color: "#ef4444" },
              ].map(c => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: `${c.color}12`, border: `1px solid ${c.color}30` }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Conversations */}
          <section id="conversations" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={ display:"flex" }><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
              <h2 style={{ margin: 0 }}>Conversations</h2>
            </div>
            <p>The Conversations page lists all uploaded transcripts across all agents. Filter, search, read full transcripts, and manage your conversation library.</p>

            <h3>Filters</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 16px" }}>
              {["All agents", "All scores", "Scored only", "Unscored", "High ≥ 80", "Low < 60"].map(f => (
                <span key={f} style={{ padding: "4px 10px", borderRadius: 8, background: soft, border: `1px solid ${border}`, fontSize: 12, color: ink, fontWeight: 500 }}>{f}</span>
              ))}
            </div>

            <h3>Deleting a Conversation</h3>
            <p>Click <strong>Delete</strong> next to a conversation → the button changes to <strong>Sure?</strong> (red, 3-second timeout) → click again to confirm. The action is irreversible. After deletion, regenerate the agent's score since the old score included the deleted data.</p>
            <InfoBox icon={<span style={display:"flex"}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>} title="After deletion" color="#f59e0b">
              The agent's score won't update automatically after you delete conversations. Go to the Agent page and click <strong>Generate Score</strong> to recalculate with the current data set.
            </InfoBox>
          </section>

          {/* Patterns */}
          <section id="patterns" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={ display:"flex" }><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <h2 style={{ margin: 0 }}>Pattern Intelligence Engine</h2>
              <Badge text="Most powerful" color="#8b5cf6" />
            </div>
            <p>The most advanced module in TalkScope. The AI analyzes conversations at the agent, team, or org level to surface behavioral patterns, risk triggers, and conversion drivers that aren't visible in raw scores.</p>

            <h3>Analysis Levels</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "8px 0 16px" }}>
              {[
                { level: "Agent", desc: "Individual coaching insights", color: accent },
                { level: "Team", desc: "Systemic training gaps", color: "#8b5cf6" },
                { level: "Organization", desc: "Strategic-level intelligence", color: "#22c55e" },
              ].map(l => (
                <div key={l.level} style={{ padding: "14px", borderRadius: 12, background: `${l.color}08`, border: `1px solid ${l.color}25`, textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: l.color, marginBottom: 4 }}>{l.level}</div>
                  <div style={{ fontSize: 11, color: muted }}>{l.desc}</div>
                </div>
              ))}
            </div>

            <h3>What's in a Pattern Report</h3>
            {[
              { title: "Executive Summary", desc: "High-level findings and strategic recommendations for leadership" },
              { title: "Top Recurring Issues", desc: "Top 3 repeated problems with evidence quotes from real conversations" },
              { title: "Conversion Drivers", desc: "Phrases and behaviors that reliably lead to a positive outcome" },
              { title: "Risk Triggers", desc: "Behavioral patterns correlated with customer churn or escalation" },
              { title: "Coaching Recommendations", desc: "Specific, actionable coaching steps for each identified issue" },
              { title: "Revenue Leakage", desc: "Where money is being lost and which patterns are causing it" },
            ].map(i => (
              <div key={i.title} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${border}` }}>
                <span style={{ color: accent, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>→</span>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: ink }}>{i.title}</span>
                  <span style={{ fontSize: 13, color: muted }}> — {i.desc}</span>
                </div>
              </div>
            ))}
            <InfoBox icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>} title="Best practice">
              Run Pattern analysis weekly at the team level. It takes 30 seconds and gives you a strategic picture of where your team is losing deals or customers.
            </InfoBox>
          </section>

          {/* Upload */}
          <section id="upload" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={ display:"flex" }><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span>
              <h2 style={{ margin: 0 }}>Upload</h2>
            </div>
            <p>The Upload page has three tabs for bringing your data into TalkScope.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { tab: "Import Agents", badge: "CSV", desc: "Upload a CSV with columns: name, email, team. Creates agents and teams automatically. Headers must match exactly.", color: accent },
                { tab: "Upload Conversations", badge: "TXT", desc: "One file = one conversation. Select an agent, upload .txt transcripts, then either save only or click Upload + Score Now for immediate AI analysis.", color: "#22c55e" },
                { tab: "Company Rules", badge: "TXT", desc: "Upload your scripts, quality standards, and compliance rules. The AI incorporates these into every scoring and pattern analysis.", color: "#8b5cf6" },
              ].map(t => (
                <div key={t.tab} style={{ display: "flex", gap: 14, padding: "14px 16px", borderRadius: 12, border: `1px solid ${border}`, background: soft }}>
                  <div style={{ flexShrink: 0 }}>
                    <Badge text={t.badge} color={t.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: ink, marginBottom: 4 }}>{t.tab}</div>
                    <div style={{ fontSize: 13, color: muted, lineHeight: 1.7 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <h3>CSV Format for Agents</h3>
            <div style={{ background: "#1e3a5f", borderRadius: 10, padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#a8d4f5", lineHeight: 2 }}>
              <div style={{ color: "#64b5f6" }}>name,email,team</div>
              <div>Sarah Mitchell,sarah@company.com,Sales Team A</div>
              <div>James Rodriguez,james@company.com,Sales Team B</div>
            </div>
          </section>

          {/* AI Scoring */}
          <section id="scoring" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={ display:"flex" }><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
              <h2 style={{ margin: 0 }}>How AI Scoring Works</h2>
            </div>
            <p>TalkScope's scoring is not simple keyword matching. The AI reads the full transcript and evaluates it across multiple behavioral and outcome dimensions, considering context, emotion, conversation structure, and business objectives.</p>

            <h3>What the AI evaluates</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                "Quality of the opening and rapport building",
                "Discovery questions and needs uncovering",
                "Objection handling effectiveness",
                "Value communication and product presentation",
                "Emotional intelligence and empathy",
                "Closing and next steps confirmation",
                "Compliance with company scripts (if uploaded)",
                "Risk signals and escalation patterns",
              ].map(item => (
                <div key={item} style={{ display: "flex", gap: 8, padding: "8px 10px", borderRadius: 8, background: soft, border: `1px solid ${border}`, fontSize: 12, color: ink, alignItems: "flex-start" }}>
                  <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>

            <h3>Ways to trigger scoring</h3>
            {[
              { method: "Upload + Score Now", desc: "Score is generated immediately after upload. Results appear in ~10 seconds." },
              { method: "Agent page → Generate Score", desc: "Rescores the agent using the latest 30 conversations (the scoring window)." },
              { method: "Dashboard → Batch Scoring", desc: "Scores all agents in the org at once. Best for initial setup or weekly refreshes." },
            ].map(s => (
              <div key={s.method} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${border}` }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: accent, minWidth: 180, flexShrink: 0 }}>{s.method}</span>
                <span style={{ fontSize: 13, color: muted, lineHeight: 1.7 }}>{s.desc}</span>
              </div>
            ))}
          </section>

          {/* Security */}
          <section id="security" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={ display:"flex" }><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
              <h2 style={{ margin: 0 }}>Security & Privacy</h2>
              <Badge text="Important" color="#22c55e" />
            </div>
            <p>TalkScope is built with a security-first architecture. Your conversations contain sensitive business data — we treat them that way.</p>

            <h3>PII Auto-Redaction</h3>
            <p>Every transcript is automatically scanned and sanitized <strong>before being saved to the database</strong>. Sensitive data is replaced with safe placeholders:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "12px 0 16px" }}>
              {[
                ["💳", "Credit card numbers", "[CARD-REDACTED]"],
                ["📞", "Phone numbers", "[PHONE-REDACTED]"],
                ["📧", "Email addresses", "[EMAIL-REDACTED]"],
                ["🪪", "Social Security Numbers", "[SSN-REDACTED]"],
                ["🏦", "Bank account numbers", "[ACCOUNT-REDACTED]"],
                ["🔑", "Passwords & PINs", "[CREDENTIAL-REDACTED]"],
              ].map(([icon, label, token]) => (
                <div key={label} style={{ padding: "8px 12px", borderRadius: 10, background: soft, border: `1px solid ${border}`, fontSize: 12 }}>
                  <span style={{ marginRight: 6 }}>{icon}</span>
                  <strong>{label}</strong>
                  <div style={{ fontFamily: "monospace", color: "#22c55e", marginTop: 2, fontSize: 11 }}>{token}</div>
                </div>
              ))}
            </div>

            <h3>Audio Files</h3>
            <p>Audio uploaded for transcription is sent to OpenAI Whisper and then <strong>immediately discarded</strong> — it is never stored on our servers. Only the resulting text transcript is saved, after PII redaction.</p>

            <h3>Data Isolation</h3>
            <p>Every database query is scoped to your organization. It is architecturally impossible for one customer's data to appear in another's workspace.</p>

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <a href="/privacy" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: `${accent}10`, border: `1px solid ${accent}25`, color: accent, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                Privacy Policy →
              </a>
              <a href="/security" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: soft, border: `1px solid ${border}`, color: ink, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                🛡️ Full Security Details →
              </a>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={ display:"flex" }><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
              <h2 style={{ margin: 0 }}>FAQ</h2>
            </div>
            {[
              { q: "What file format do conversations need to be in?", a: "Plain text (.txt) files. One file = one conversation. The format is flexible — any transcript layout works. Recommended format: 'Agent: [text]\\nCustomer: [text]' for best AI analysis quality." },
              { q: "How many conversations do I need for an accurate score?", a: "As few as 1. But the more conversations, the more reliable the score. Optimal: 10–15 for an initial assessment, 30+ for a stable, consistent result. TalkScope uses the last 30 conversations as its scoring window." },
              { q: "How often should I regenerate scores?", a: "Weekly is recommended. Scores don't update automatically when new conversations are added — you need to trigger a rescore manually or use Batch Scoring on the Dashboard." },
              { q: "Can I use TalkScope for audio calls?", a: "Currently only text transcripts (.txt) are supported. Audio-to-text (speech-to-text) pipeline is planned for a future release. For now, use any STT tool (like Otter.ai or Whisper) to generate transcripts first." },
              { q: "Is my data private?", a: "Yes. Every user sees only their own workspace. Multi-tenant isolation is enforced at the database level — one organization cannot access another's data. Authentication is handled by Clerk (enterprise-grade security)." },
              { q: "What is the 30-conversation scoring window?", a: "When generating a score, TalkScope takes the most recent 30 conversations for that agent. If an agent has fewer than 30 conversations, all available ones are used. This window ensures scores reflect current performance, not historical outliers." },
              { q: "Can I customize what the AI scores against?", a: "Yes — upload your company scripts, quality standards, and compliance rules in Upload → Company Rules. The AI will incorporate these into every score and pattern analysis for your workspace." },
              { q: "How is TalkScope different from Gong?", a: "Gong is enterprise-only, expensive ($20k+/year), slow to implement, and focused on sales deal intelligence. TalkScope is mid-market friendly, faster to set up, covers contact centers + sales + collections, and is built for operational coaching — not just deal forecasting." },
            ].map(f => <FAQ key={f.q} {...f} />)}
          </section>

          {/* CTA */}
          <div style={{ background: `linear-gradient(135deg, ${accent}, #5a7fa8)`, borderRadius: 16, padding: 32, textAlign: "center", marginTop: 24, marginBottom: 8 }}>
            <div style={ display:"flex", justifyContent:"center", marginBottom:10 }><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7eb5e8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></div>
            <div style={{ fontWeight: 900, fontSize: 22, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>Ready to get started?</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 20 }}>Try the live demo or create your workspace in 2 minutes</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/demo" style={{ padding: "11px 24px", borderRadius: 10, background: "#fff", color: accent, fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
                Try live demo
              </Link>
              <Link href="/sign-up" style={{ padding: "11px 24px", borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Create account →
              </Link>
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "16px 0 8px", display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/about"    style={{ fontSize: 12, color: muted, textDecoration: "none", padding: "10px 10px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>About</Link>
            <Link href="/privacy"  style={{ fontSize: 12, color: muted, textDecoration: "none", padding: "10px 10px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>Privacy Policy</Link>
            <Link href="/security" style={{ fontSize: 12, color: muted, textDecoration: "none", padding: "10px 10px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>Security</Link>
          </div>
          <div style={{ textAlign: "center", padding: "8px 0 32px", fontSize: 12, color: muted }}>
            © 2026 TalkScope · Conversation Intelligence OS
          </div>
        </div>
      </div>
    </div>
  );
}
