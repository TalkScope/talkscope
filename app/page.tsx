"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const stored = localStorage.getItem("ts-theme") as "light" | "dark" | null;
    setTheme(stored ?? "light");
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ts-theme", next);
  }
  const isDark = theme === "dark";
  return { isDark, toggle };
}

const FEATURES = [
  { icon: "🧠", title: "AI Conversation Scoring", desc: "Every conversation scored on communication, conversion, risk, and coaching priority." },
  { icon: "📊", title: "Pattern Intelligence", desc: "Detect repeating behavioral patterns, risk triggers, and conversion drivers across your team." },
  { icon: "🎯", title: "Revenue Leakage Detection", desc: "Find exactly where deals are lost, which phrases kill conversions, and who loses the most." },
  { icon: "📈", title: "Agent Performance Growth", desc: "Track score history, identify improvement areas, and prioritize coaching by ROI." },
  { icon: "📋", title: "Company Rules Engine", desc: "Upload your scripts and standards. AI scores against your actual requirements, not generic ones." },
  { icon: "⚡", title: "Batch Processing", desc: "Score hundreds of conversations at once or get instant analysis right after upload." },
];

const USE_CASES = [
  { icon: "📞", title: "Contact Centers", desc: "Monitor agent quality at scale. Spot compliance risks before they become problems. Coach the right people at the right time." },
  { icon: "💼", title: "Sales Organizations", desc: "Understand why deals close or die. Identify top performer patterns and replicate them across the team." },
  { icon: "💰", title: "Collections & Recovery", desc: "Detect risk signals early. Find the phrases that increase payment rates. Reduce escalations." },
  { icon: "🏢", title: "Enterprise Support", desc: "Track de-escalation effectiveness, empathy quality, and resolution patterns across hundreds of agents." },
];

const MOCK_AGENTS = [
  { name: "Sarah Mitchell", score: 91, risk: 22, priority: "Monitor", initials: "SM" },
  { name: "James Rodriguez", score: 74, risk: 55, priority: "Focus", initials: "JR" },
  { name: "Anna Chen", score: 62, risk: 71, priority: "Urgent", initials: "AC" },
];

export default function HomePage() {
  const { isDark, toggle } = useTheme();

  const bg = isDark ? "#0b1220" : "#f6f8fc";
  const ink = isDark ? "#f7f9fc" : "#0b1220";
  const muted = isDark ? "rgba(247,249,252,0.6)" : "rgba(11,18,32,0.55)";
  const border = isDark ? "rgba(255,255,255,0.1)" : "#e6e8ee";
  const surface = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const surfaceAlt = isDark ? "rgba(255,255,255,0.03)" : "#f0f4f9";
  const accent = isDark ? "#7eb5e8" : "#406184";

  return (
    <main style={{ minHeight: "100vh", background: bg, color: ink, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", transition: "background 0.2s, color 0.2s" }}>

      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: isDark ? "rgba(11,18,32,0.92)" : "rgba(246,248,252,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${border}`, transition: "background 0.2s" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, rgba(64,97,132,0.3), rgba(64,97,132,0.7))`, border: "1px solid rgba(64,97,132,0.4)" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px", color: ink }}>TalkScope</div>
              <div style={{ fontSize: 11, color: muted, marginTop: 1 }}>Conversation Intelligence OS</div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: 4 }}>
            {[["Features", "#features"], ["Use Cases", "#use-cases"], ["Pricing", "#pricing"]].map(([l, h]) => (
              <a key={l} href={h} style={{ padding: "6px 13px", borderRadius: 8, color: muted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>{l}</a>
            ))}
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${border}`, background: surface, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isDark ? "☀️" : "🌙"}
            </button>
            <Link href="/app/dashboard" style={{ padding: "8px 18px", borderRadius: 10, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              Open App →
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 32px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>

          {/* Left copy */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: isDark ? "rgba(126,181,232,0.1)" : "rgba(64,97,132,0.08)", border: `1px solid ${isDark ? "rgba(126,181,232,0.25)" : "rgba(64,97,132,0.2)"}`, color: accent, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", flexShrink: 0 }} />
              AI-Powered · Contact Center · Revenue Intelligence
            </div>

            <h1 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20, color: ink }}>
              Turn every conversation into{" "}
              <span style={{ color: accent }}>revenue intelligence</span>
            </h1>

            <p style={{ fontSize: 17, color: muted, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              TalkScope analyzes agent conversations, detects behavioral patterns, scores performance, and tells you exactly why deals are won or lost.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/app/dashboard" style={{ padding: "13px 26px", borderRadius: 12, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
                Open Dashboard
              </Link>
              <Link href="/app/upload" style={{ padding: "13px 26px", borderRadius: 12, background: surface, border: `1px solid ${border}`, color: ink, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
                Import Data
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 28, marginTop: 40 }}>
              {[["6+", "AI modules"], ["3s", "avg analysis"], ["100%", "conversation coverage"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: ink, letterSpacing: "-0.04em" }}>{v}</div>
                  <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mock UI */}
          <div style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${border}`, borderRadius: 20, padding: 24, boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.4)" : "0 24px 60px rgba(11,18,32,0.1)" }}>

            {/* Mini header */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {["#ff5f57","#febc2e","#28c840"].map((c) => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
              <div style={{ marginLeft: 8, fontSize: 12, color: muted, fontWeight: 600 }}>TalkScope — Operations Dashboard</div>
            </div>

            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
              {[
                { l: "Avg Score", v: "74.2", c: "#f59e0b" },
                { l: "High Risk", v: "3", c: "#ef4444" },
                { l: "Top Agent", v: "92.1", c: "#22c55e" },
                { l: "Coaching", v: "5", c: "#f97316" },
              ].map((k) => (
                <div key={k.l} style={{ background: surfaceAlt, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{k.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: k.c, letterSpacing: "-0.04em" }}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* Agent list */}
            <div style={{ background: surfaceAlt, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: muted, borderBottom: `1px solid ${border}` }}>
                Coaching Queue
              </div>
              {MOCK_AGENTS.map((a) => {
                const pc = a.priority === "Urgent" ? "#ef4444" : a.priority === "Focus" ? "#f97316" : "#22c55e";
                const pbg = a.priority === "Urgent" ? "rgba(239,68,68,0.1)" : a.priority === "Focus" ? "rgba(249,115,22,0.1)" : "rgba(34,197,94,0.1)";
                const sc = a.score >= 80 ? "#22c55e" : a.score >= 65 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${border}` }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `rgba(64,97,132,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: accent, flexShrink: 0 }}>{a.initials}</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 650, color: ink }}>{a.name}</div>
                    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: pbg, color: pc, border: `1px solid ${pbg}` }}>{a.priority}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: sc }}>{a.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ borderTop: `1px solid ${border}`, padding: "72px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(28px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12, color: ink }}>Not call tracking. Intelligence.</h2>
            <p style={{ color: muted, fontSize: 16, maxWidth: 460, margin: "0 auto" }}>Everything you need to understand what's actually happening inside your conversations.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 750, marginBottom: 8, color: ink }}>{f.title}</div>
                <div style={{ fontSize: 14, color: muted, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ borderTop: `1px solid ${border}`, padding: "72px 32px", background: surfaceAlt }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(28px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12, color: ink }}>Live in minutes</h2>
            <p style={{ color: muted, fontSize: 16 }}>Three steps from zero to full intelligence</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, position: "relative" }}>
            {[
              { n: "01", title: "Import your agents", desc: "Upload a CSV with names, emails, teams. Or add agents manually. Done in 30 seconds." },
              { n: "02", title: "Upload conversations", desc: "Drop transcript files. Assign to agents. Optionally add your company rules and scripts." },
              { n: "03", title: "Get intelligence", desc: "TalkScope scores every conversation, detects patterns, and tells you exactly who needs coaching and why." },
            ].map((s, i) => (
              <div key={s.n} style={{ padding: "32px 36px", background: surface, border: `1px solid ${border}`, borderRadius: i === 0 ? "16px 0 0 16px" : i === 2 ? "0 16px 16px 0" : 0, borderLeft: i > 0 ? "none" : undefined, position: "relative" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: accent, opacity: 0.3, marginBottom: 14, letterSpacing: "-0.06em" }}>{s.n}</div>
                <div style={{ fontSize: 17, fontWeight: 750, color: ink, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: muted, lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" style={{ borderTop: `1px solid ${border}`, padding: "72px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(28px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.03em", color: ink, marginBottom: 12 }}>Built for performance-driven teams</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {USE_CASES.map((u) => (
              <div key={u.title} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, display: "flex", gap: 20 }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>{u.icon}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 750, marginBottom: 8, color: ink }}>{u.title}</div>
                  <div style={{ fontSize: 14, color: muted, lineHeight: 1.65 }}>{u.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" style={{ borderTop: `1px solid ${border}`, padding: "80px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16, color: ink }}>
            Ready to see what your conversations really do?
          </h2>
          <p style={{ color: muted, fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
            Import your agents and transcripts. Get your first insights in minutes. No credit card required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/app/dashboard" style={{ padding: "14px 32px", borderRadius: 12, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Open Dashboard →
            </Link>
            <Link href="/app/upload" style={{ padding: "14px 32px", borderRadius: 12, background: surface, border: `1px solid ${border}`, color: ink, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Import Data
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: "24px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: accent }}>TalkScope</div>
          <div style={{ fontSize: 13, color: muted }}>© 2026 TalkScope · Conversation Intelligence OS</div>
          <Link href="/app/dashboard" style={{ fontSize: 13, color: accent, textDecoration: "none", fontWeight: 600 }}>Open App →</Link>
        </div>
      </footer>

    </main>
  );
}
