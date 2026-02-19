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
  return { isDark: theme === "dark", toggle };
}

const FEATURES = [
  { icon: "🧠", title: "AI Conversation Scoring", desc: "Every conversation scored on communication, conversion, risk, and coaching priority." },
  { icon: "📊", title: "Pattern Intelligence",    desc: "Detect repeating behavioral patterns, risk triggers, and conversion drivers." },
  { icon: "🎯", title: "Revenue Leakage",         desc: "Find exactly where deals are lost, which phrases kill conversions." },
  { icon: "📈", title: "Agent Growth",            desc: "Track score history, identify improvement areas, prioritize coaching by ROI." },
  { icon: "📋", title: "Company Rules Engine",    desc: "AI scores against your scripts and standards, not generic ones." },
  { icon: "⚡", title: "Batch Processing",        desc: "Score hundreds of conversations at once or instantly after upload." },
];

const USE_CASES = [
  { icon: "📞", title: "Contact Centers",       desc: "Monitor agent quality at scale. Spot compliance risks before they escalate." },
  { icon: "💼", title: "Sales Organizations",   desc: "Understand why deals close or die. Replicate top performers." },
  { icon: "💰", title: "Collections",           desc: "Detect risk signals early. Find phrases that increase payment rates." },
  { icon: "🏢", title: "Enterprise Support",    desc: "Track de-escalation, empathy, and resolution patterns at scale." },
];

const MOCK_AGENTS = [
  { name: "Sarah Mitchell", score: 91, priority: "Monitor",  initials: "SM", sc: "#22c55e", pc: "#22c55e", pbg: "rgba(34,197,94,0.1)" },
  { name: "James Rodriguez", score: 74, priority: "Focus",   initials: "JR", sc: "#f59e0b", pc: "#f97316", pbg: "rgba(249,115,22,0.1)" },
  { name: "Anna Chen",       score: 62, priority: "Urgent",  initials: "AC", sc: "#f59e0b", pc: "#ef4444", pbg: "rgba(239,68,68,0.1)" },
];

export default function HomePage() {
  const { isDark, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bg      = isDark ? "#0b1220" : "#f6f8fc";
  const ink     = isDark ? "#f7f9fc" : "#0b1220";
  const muted   = isDark ? "rgba(247,249,252,0.58)" : "rgba(11,18,32,0.55)";
  const border  = isDark ? "rgba(255,255,255,0.1)" : "#e6e8ee";
  const surface = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const surfaceAlt = isDark ? "rgba(255,255,255,0.03)" : "#f0f4f9";
  const accent  = isDark ? "#7eb5e8" : "#406184";
  const navBg   = isDark ? "rgba(11,18,32,0.92)" : "rgba(246,248,252,0.92)";

  return (
    <>
      <style>{`
        .lp-nav-links a { padding:6px 13px; border-radius:8px; color:${muted}; text-decoration:none; font-size:14px; font-weight:500; }
        .lp-nav-links a:hover { color:${ink}; }
        @media(max-width:767px) { .lp-nav-links { display:none !important; } .lp-mobile-btn { display:flex !important; } }
        @media(min-width:768px) { .lp-mobile-btn { display:none !important; } }

        /* Mobile menu */
        .lp-mob-overlay { display:none; position:fixed; inset:0; z-index:49; background:rgba(0,0,0,0.4); animation:lp-fade 0.15s ease; }
        .lp-mob-overlay.open { display:block; }
        .lp-mob-drawer { display:none; position:fixed; top:0; right:0; bottom:0; width:min(280px,85vw); z-index:50; background:${isDark?"#131e30":"#ffffff"}; border-left:1px solid ${border}; box-shadow:-8px 0 32px rgba(0,0,0,0.2); flex-direction:column; animation:lp-slide 0.2s ease; }
        .lp-mob-drawer.open { display:flex; }
        @keyframes lp-fade { from{opacity:0}to{opacity:1} }
        @keyframes lp-slide { from{transform:translateX(100%)}to{transform:translateX(0)} }
        .lp-mob-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid ${border}; }
        .lp-mob-nav { display:flex; flex-direction:column; padding:12px; flex:1; gap:4px; }
        .lp-mob-nav a { display:flex; align-items:center; gap:10px; padding:13px 14px; border-radius:12px; font-size:15px; font-weight:700; color:${ink}; text-decoration:none; }
        .lp-mob-nav a:hover { background:rgba(64,97,132,0.08); }
        .lp-mob-footer { padding:16px 20px; border-top:1px solid ${border}; }

        /* Hero grid */
        .lp-hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; }
        @media(max-width:860px) { .lp-hero-grid { grid-template-columns:1fr; gap:40px; } }

        /* Features grid */
        .lp-feat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        @media(max-width:860px) { .lp-feat-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:560px) { .lp-feat-grid { grid-template-columns:1fr; } }

        /* Use cases grid */
        .lp-uc-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media(max-width:640px) { .lp-uc-grid { grid-template-columns:1fr; } }

        /* How it works */
        .lp-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:0; }
        @media(max-width:700px) { .lp-steps { grid-template-columns:1fr; gap:8px; } }
        .lp-step { padding:28px 28px; background:${surface}; border:1px solid ${border}; }
        .lp-step:first-child { border-radius:16px 0 0 16px; }
        .lp-step:last-child  { border-radius:0 16px 16px 0; }
        @media(max-width:700px) {
          .lp-step:first-child, .lp-step:last-child, .lp-step { border-radius:16px !important; border-right:1px solid ${border} !important; }
        }
        .lp-step + .lp-step { border-left:none; }
        @media(max-width:700px) { .lp-step + .lp-step { border-left:1px solid ${border}; } }

        /* Stats row */
        .lp-stats { display:flex; gap:32px; margin-top:40px; }
        @media(max-width:400px) { .lp-stats { gap:20px; } }

        /* Section padding */
        .lp-section { border-top:1px solid ${border}; padding:64px 32px; }
        @media(max-width:640px) { .lp-section { padding:48px 20px; } }

        /* Hero section */
        .lp-hero { max-width:1200px; margin:0 auto; padding:64px 32px 72px; }
        @media(max-width:640px) { .lp-hero { padding:40px 20px 52px; } }

        /* Mock UI */
        .lp-mock-kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px; }
        @media(max-width:500px) { .lp-mock-kpi { grid-template-columns:repeat(2,1fr); } }

        /* CTA buttons */
        .lp-cta-btns { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }

        /* Inner section max-width */
        .lp-inner { max-width:1200px; margin:0 auto; }

        /* Hamburger */
        .lp-hamburger { width:38px; height:38px; border-radius:10px; border:1px solid ${border}; background:${surface}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; cursor:pointer; }
        .lp-hamburger span { width:18px; height:2px; border-radius:2px; background:${ink}; display:block; }
      `}</style>

      {/* Mobile overlay */}
      <div className={`lp-mob-overlay ${mobileMenuOpen ? "open" : ""}`} onClick={() => setMobileMenuOpen(false)} />

      {/* Mobile drawer */}
      <div className={`lp-mob-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="lp-mob-head">
          <span style={{ fontWeight: 800, fontSize: 15, color: ink }}>TalkScope</span>
          <button onClick={() => setMobileMenuOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${border}`, background: "transparent", cursor: "pointer", fontSize: 18, color: ink }}>✕</button>
        </div>
        <nav className="lp-mob-nav">
          {[["Features", "#features"], ["Use Cases", "#use-cases"], ["Pricing", "#pricing"]].map(([l, h]) => (
            <a key={l} href={h} onClick={() => setMobileMenuOpen(false)}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(64,97,132,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {l === "Features" ? "⚡" : l === "Use Cases" ? "🏢" : "💰"}
              </span>
              {l}
            </a>
          ))}
          <a href="/app/dashboard" style={{ marginTop: 8, background: `rgba(64,97,132,0.1)`, borderRadius: 12 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(64,97,132,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📊</span>
            Open Dashboard
          </a>
        </nav>
        <div className="lp-mob-footer">
          <button onClick={toggle} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${border}`, background: surface, cursor: "pointer", fontSize: 14, fontWeight: 700, color: ink }}>
            {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </div>

      <main style={{ minHeight: "100vh", background: bg, color: ink, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", transition: "background 0.2s,color 0.2s", overflowX: "hidden" }}>

        {/* ── NAV ── */}
        <header style={{ position: "sticky", top: 0, zIndex: 40, background: navBg, backdropFilter: "blur(12px)", borderBottom: `1px solid ${border}`, transition: "background 0.2s" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>

            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,rgba(64,97,132,0.3),rgba(64,97,132,0.7))", border: "1px solid rgba(64,97,132,0.4)", flexShrink: 0 }} />
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px", color: ink }}>TalkScope</span>
            </div>

            {/* Desktop nav */}
            <nav className="lp-nav-links" style={{ display: "flex", gap: 2 }}>
              {[["Features", "#features"], ["Use Cases", "#use-cases"], ["Pricing", "#pricing"]].map(([l, h]) => (
                <a key={l} href={h}>{l}</a>
              ))}
            </nav>

            {/* Right */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${border}`, background: surface, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isDark ? "☀️" : "🌙"}
              </button>
              <Link href="/app/dashboard" style={{ padding: "7px 16px", borderRadius: 10, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>
                Open App
              </Link>
              {/* Hamburger */}
              <button className="lp-hamburger lp-mobile-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Menu" style={{ display: "none" }}>
                <span /><span /><span />
              </button>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <div className="lp-hero">
          <div className="lp-hero-grid">
            {/* Left */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: isDark ? "rgba(126,181,232,0.1)" : "rgba(64,97,132,0.08)", border: `1px solid ${isDark ? "rgba(126,181,232,0.25)" : "rgba(64,97,132,0.2)"}`, color: accent, fontSize: 13, fontWeight: 600, marginBottom: 22 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", flexShrink: 0 }} />
                AI-Powered · Contact Center · Revenue Intelligence
              </div>

              <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 18, color: ink }}>
                Turn every conversation into{" "}
                <span style={{ color: accent }}>revenue intelligence</span>
              </h1>

              <p style={{ fontSize: "clamp(15px,2vw,17px)", color: muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
                TalkScope analyzes agent conversations, detects behavioral patterns, scores performance, and tells you exactly why deals are won or lost.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/app/dashboard" style={{ padding: "12px 24px", borderRadius: 12, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
                  Open Dashboard
                </Link>
                <Link href="/app/upload" style={{ padding: "12px 24px", borderRadius: 12, background: surface, border: `1px solid ${border}`, color: ink, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
                  Import Data
                </Link>
              </div>

              <div className="lp-stats">
                {[["6+", "AI modules"], ["3s", "avg analysis"], ["100%", "coverage"]].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: ink, letterSpacing: "-0.04em" }}>{v}</div>
                    <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — mock UI */}
            <div style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${border}`, borderRadius: 20, padding: 20, boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.4)" : "0 24px 60px rgba(11,18,32,0.1)" }}>
              {/* Window dots */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                <span style={{ marginLeft: 8, fontSize: 12, color: muted, fontWeight: 600 }}>Operations Dashboard</span>
              </div>

              {/* KPIs */}
              <div className="lp-mock-kpi">
                {[{l:"Avg Score",v:"74.2",c:"#f59e0b"},{l:"High Risk",v:"3",c:"#ef4444"},{l:"Top Agent",v:"92.1",c:"#22c55e"},{l:"Coaching",v:"5",c:"#f97316"}].map(k => (
                  <div key={k.l} style={{ background: surfaceAlt, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{k.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: k.c, letterSpacing: "-0.04em" }}>{k.v}</div>
                  </div>
                ))}
              </div>

              {/* Agent list */}
              <div style={{ background: surfaceAlt, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "9px 14px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: muted, borderBottom: `1px solid ${border}` }}>Coaching Queue</div>
                {MOCK_AGENTS.map(a => (
                  <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: `1px solid ${border}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(64,97,132,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: accent, flexShrink: 0 }}>{a.initials}</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 650, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: a.pbg, color: a.pc, flexShrink: 0 }}>{a.priority}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: a.sc, flexShrink: 0 }}>{a.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features" className="lp-section">
          <div className="lp-inner">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12, color: ink }}>Not call tracking. Intelligence.</h2>
              <p style={{ color: muted, fontSize: 16, maxWidth: 440, margin: "0 auto" }}>Everything you need to understand what's really happening in your conversations.</p>
            </div>
            <div className="lp-feat-grid">
              {FEATURES.map(f => (
                <div key={f.title} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: 26, marginBottom: 12 }}>{f.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 750, marginBottom: 7, color: ink }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-section" style={{ background: surfaceAlt }}>
          <div className="lp-inner">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, letterSpacing: "-0.03em", color: ink, marginBottom: 12 }}>Live in minutes</h2>
              <p style={{ color: muted, fontSize: 16 }}>Three steps from zero to full intelligence</p>
            </div>
            <div className="lp-steps">
              {[
                { n: "01", title: "Import agents",       desc: "Upload a CSV with names, emails, teams. Done in 30 seconds." },
                { n: "02", title: "Upload conversations", desc: "Drop transcript files, assign to agents, add your company rules." },
                { n: "03", title: "Get intelligence",     desc: "TalkScope scores everything, detects patterns, tells you who needs coaching and why." },
              ].map(s => (
                <div key={s.n} className="lp-step">
                  <div style={{ fontSize: 32, fontWeight: 900, color: accent, opacity: 0.3, marginBottom: 12, letterSpacing: "-0.06em" }}>{s.n}</div>
                  <div style={{ fontSize: 16, fontWeight: 750, color: ink, marginBottom: 7 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── USE CASES ── */}
        <section id="use-cases" className="lp-section">
          <div className="lp-inner">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, letterSpacing: "-0.03em", color: ink, marginBottom: 12 }}>Built for performance-driven teams</h2>
            </div>
            <div className="lp-uc-grid">
              {USE_CASES.map(u => (
                <div key={u.title} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 24, display: "flex", gap: 18 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{u.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 750, marginBottom: 7, color: ink }}>{u.title}</div>
                    <div style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>{u.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="pricing" className="lp-section" style={{ textAlign: "center" }}>
          <div style={{ maxWidth: 540, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14, color: ink }}>Ready to see what your conversations really do?</h2>
            <p style={{ color: muted, fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>Import your agents and transcripts. Get first insights in minutes.</p>
            <div className="lp-cta-btns">
              <Link href="/app/dashboard" style={{ padding: "13px 28px", borderRadius: 12, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>Open Dashboard →</Link>
              <Link href="/app/upload" style={{ padding: "13px 28px", borderRadius: 12, background: surface, border: `1px solid ${border}`, color: ink, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>Import Data</Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: `1px solid ${border}`, padding: "22px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: accent }}>TalkScope</span>
            <span style={{ fontSize: 13, color: muted }}>© 2026 TalkScope · Conversation Intelligence OS</span>
            <Link href="/app/dashboard" style={{ fontSize: 13, color: accent, textDecoration: "none", fontWeight: 600 }}>Open App →</Link>
          </div>
        </footer>
      </main>
    </>
  );
}
