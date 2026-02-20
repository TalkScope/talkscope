"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";

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

// Animated counter
function AnimatedNumber({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = Date.now();
      const tick = () => {
        const progress = Math.min((Date.now() - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(ease * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val}</span>;
}

const FLOATING_INSIGHTS = [
  { icon: "⚠️", text: "Risk detected in call #847", color: "#ef4444", side: "left", delay: 0 },
  { icon: "✓", text: "Strong opener — +12% conversion", color: "#22c55e", side: "right", delay: 1.2 },
  { icon: "💡", text: "Coaching tip: slow down on pricing", color: "#f59e0b", side: "left", delay: 2.4 },
  { icon: "📈", text: "Score improved +8 pts this week", color: "#406184", side: "right", delay: 3.6 },
  { icon: "🎯", text: "Pattern: objection at minute 4", color: "#8b5cf6", side: "left", delay: 4.8 },
];

const MOCK_AGENTS = [
  { name: "Sarah Mitchell", score: 91, priority: "Monitor",  initials: "SM", sc: "#22c55e", pc: "#22c55e", pbg: "rgba(34,197,94,0.12)", trend: "+4" },
  { name: "James Rodriguez", score: 74, priority: "Focus",   initials: "JR", sc: "#f59e0b", pc: "#f97316", pbg: "rgba(249,115,22,0.12)", trend: "-2" },
  { name: "Anna Chen",       score: 62, priority: "Urgent",  initials: "AC", sc: "#f59e0b", pc: "#ef4444", pbg: "rgba(239,68,68,0.12)", trend: "+1" },
  { name: "Marcus Webb",     score: 88, priority: "Monitor", initials: "MW", sc: "#22c55e", pc: "#22c55e", pbg: "rgba(34,197,94,0.12)", trend: "+6" },
];

const FEATURES = [
  { icon: "🧠", title: "AI Conversation Scoring", desc: "Every conversation scored on communication, conversion, risk, and coaching priority in seconds." },
  { icon: "📊", title: "Pattern Intelligence", desc: "Detect repeating behavioral patterns, risk triggers, and conversion drivers across thousands of calls." },
  { icon: "🎯", title: "Revenue Leakage Detection", desc: "Find exactly where deals are lost, which phrases kill conversions, and how much it costs you." },
  { icon: "📈", title: "Agent Growth Engine", desc: "Track score history, identify improvement areas, and prioritize coaching by revenue impact." },
  { icon: "📋", title: "Company Rules Engine", desc: "AI scores against your scripts and standards, not generic ones. Train it on your playbook." },
  { icon: "⚡", title: "Real-Time Intelligence", desc: "Score conversations instantly on upload. No waiting, no batch delays — insights in seconds." },
];

const TESTIMONIALS = [
  {
    quote: "We cut coaching prep time by 70%. TalkScope shows exactly which agents need attention and why — no more guessing.",
    name: "Sarah K.", role: "Head of QA, FinTech", initials: "SK",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  {
    quote: "The pattern engine found a phrase that was killing 30% of our conversions. We fixed it in a week and saw immediate results.",
    name: "Marcus T.", role: "Sales Director", initials: "MT",
    gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
  },
  {
    quote: "Finally a tool built for contact centers, not just sales. The risk detection alone paid for itself in the first month.",
    name: "Elena V.", role: "Operations Manager", initials: "EV",
    gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
  },
];

export default function HomePage() {
  const { isDark, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleInsight, setVisibleInsight] = useState(0);
  const { isSignedIn } = useUser();

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleInsight(v => (v + 1) % FLOATING_INSIGHTS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const bg      = isDark ? "#0b1220" : "#f6f8fc";
  const ink     = isDark ? "#f7f9fc" : "#0b1220";
  const muted   = isDark ? "rgba(247,249,252,0.55)" : "rgba(11,18,32,0.52)";
  const border  = isDark ? "rgba(255,255,255,0.09)" : "#e4e7ef";
  const surface = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const surfaceAlt = isDark ? "rgba(255,255,255,0.03)" : "#f0f4f9";
  const accent  = isDark ? "#7eb5e8" : "#406184";
  const navBg   = isDark ? "rgba(11,18,32,0.94)" : "rgba(246,248,252,0.94)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* Nav */
        .lp-nav-links a { padding:6px 13px; border-radius:8px; color:${muted}; text-decoration:none; font-size:14px; font-weight:500; transition:color 0.15s; }
        .lp-nav-links a:hover { color:${ink}; }
        @media(max-width:767px) { .lp-nav-links { display:none !important; } .lp-mobile-btn { display:flex !important; } }
        @media(min-width:768px) { .lp-mobile-btn { display:none !important; } }

        /* Mobile */
        .lp-mob-overlay { display:none; position:fixed; inset:0; z-index:49; background:rgba(0,0,0,0.4); }
        .lp-mob-overlay.open { display:block; }
        .lp-mob-drawer { display:none; position:fixed; top:0; right:0; bottom:0; width:min(280px,85vw); z-index:50; background:${isDark?"#131e30":"#ffffff"}; border-left:1px solid ${border}; box-shadow:-8px 0 32px rgba(0,0,0,0.2); flex-direction:column; }
        .lp-mob-drawer.open { display:flex; }
        .lp-mob-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid ${border}; }
        .lp-mob-nav { display:flex; flex-direction:column; padding:12px; flex:1; gap:4px; }
        .lp-mob-nav a { display:flex; align-items:center; gap:10px; padding:13px 14px; border-radius:12px; font-size:15px; font-weight:700; color:${ink}; text-decoration:none; }
        .lp-mob-nav a:hover { background:rgba(64,97,132,0.08); }
        .lp-mob-footer { padding:16px 20px; border-top:1px solid ${border}; }

        /* Hero */
        .lp-hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
        @media(max-width:900px) { .lp-hero-grid { grid-template-columns:1fr; gap:48px; } }

        /* Features grid */
        .lp-feat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media(max-width:860px) { .lp-feat-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:540px) { .lp-feat-grid { grid-template-columns:1fr; } }

        /* Use cases */
        .lp-uc-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media(max-width:640px) { .lp-uc-grid { grid-template-columns:1fr; } }

        /* Steps */
        .lp-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:0; }
        @media(max-width:700px) { .lp-steps { grid-template-columns:1fr; gap:8px; } }
        .lp-step { padding:32px; background:${surface}; border:1px solid ${border}; }
        .lp-step:first-child { border-radius:20px 0 0 20px; }
        .lp-step:last-child  { border-radius:0 20px 20px 0; }
        .lp-step + .lp-step { border-left:none; }
        @media(max-width:700px) {
          .lp-step:first-child, .lp-step:last-child, .lp-step { border-radius:16px !important; border-right:1px solid ${border} !important; border-left:1px solid ${border} !important; }
        }

        /* Pricing */
        .lp-price-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; max-width:920px; margin:0 auto; }
        @media(max-width:780px) { .lp-price-grid { grid-template-columns:1fr; max-width:420px; } }

        /* Testimonials */
        .lp-testi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media(max-width:780px) { .lp-testi-grid { grid-template-columns:1fr; } }

        /* Sections */
        .lp-section { border-top:1px solid ${border}; padding:80px 32px; }
        @media(max-width:640px) { .lp-section { padding:56px 20px; } }
        .lp-hero { max-width:1200px; margin:0 auto; padding:80px 32px 96px; }
        @media(max-width:640px) { .lp-hero { padding:48px 20px 64px; } }
        .lp-inner { max-width:1200px; margin:0 auto; }
        .lp-cta-btns { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }

        /* Hamburger */
        .lp-hamburger { width:38px; height:38px; border-radius:10px; border:1px solid ${border}; background:${surface}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; cursor:pointer; }
        .lp-hamburger span { width:18px; height:2px; border-radius:2px; background:${ink}; display:block; }

        /* Mock UI */
        .lp-mock-kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:14px; }
        @media(max-width:480px) { .lp-mock-kpi { grid-template-columns:repeat(2,1fr); } }

        /* Floating insights */
        .lp-float-insight {
          position:absolute; display:flex; align-items:center; gap:8px;
          padding:9px 14px; border-radius:12px; font-size:12px; font-weight:600;
          background:${surface}; border:1px solid ${border};
          box-shadow:0 8px 24px rgba(0,0,0,0.12);
          white-space:nowrap; pointer-events:none;
          animation: floatIn 0.5s ease forwards;
        }
        @keyframes floatIn {
          from { opacity:0; transform:translateY(8px) scale(0.95); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes floatOut {
          from { opacity:1; transform:translateY(0) scale(1); }
          to   { opacity:0; transform:translateY(-8px) scale(0.95); }
        }
        .lp-float-out { animation: floatOut 0.4s ease forwards; }

        /* Who it's for — floating cards */
        @keyframes floatCard {
          0%   { transform: translateY(0px) scale(1); opacity: 0.85; }
          50%  { transform: translateY(-8px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0px) scale(1); opacity: 0.85; }
        }

        /* Score bar animation */
        .lp-score-bar { height:4px; border-radius:2px; background:rgba(64,97,132,0.15); overflow:hidden; margin-top:6px; }
        .lp-score-fill { height:100%; border-radius:2px; animation: fillBar 1.5s ease forwards; }
        @keyframes fillBar { from { width:0; } }

        /* Agent row hover */
        .lp-agent-row { display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom:1px solid ${border}; transition:background 0.15s; cursor:default; }
        .lp-agent-row:hover { background:rgba(64,97,132,0.04); }
        .lp-agent-row:last-child { border-bottom:none; }

        /* Feature card hover */
        .lp-feat-card { background:${surface}; border:1px solid ${border}; border-radius:20px; padding:28px; transition:transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .lp-feat-card:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(64,97,132,0.12); border-color:rgba(64,97,132,0.3); }

        /* Testimonial avatar */
        .lp-testi-avatar {
          width:52px; height:52px; border-radius:50%; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:17px; font-weight:800; color:#fff; letter-spacing:-0.02em;
        }

        /* Pulsing dot */
        .lp-pulse { animation: pulse 2s infinite; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }

        /* Stats */
        .lp-stat { text-align:center; }

        /* Scroll reveal */
        .lp-reveal { opacity:0; transform:translateY(24px); transition:opacity 0.6s ease, transform 0.6s ease; }
        .lp-reveal.visible { opacity:1; transform:translateY(0); }
      `}</style>

      {/* Mobile overlay */}
      <div className={`lp-mob-overlay ${mobileMenuOpen ? "open" : ""}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`lp-mob-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="lp-mob-head">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo-512.png" alt="TalkScope" style={{ width: 28, height: 28, borderRadius: 7 }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: ink }}>TalkScope</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${border}`, background: "transparent", cursor: "pointer", fontSize: 18, color: ink }}>✕</button>
        </div>
        <nav className="lp-mob-nav">
          {[["Features", "#features"], ["Who it's for", "#who"], ["How it works", "#how"], ["Pricing", "#pricing"]].map(([l, h]) => (
            <a key={l} href={h} onClick={() => setMobileMenuOpen(false)}>{l}</a>
          ))}
          <a href="/app/dashboard" style={{ marginTop: 8, background: `rgba(64,97,132,0.1)` }}>Open Dashboard</a>
        </nav>
        <div className="lp-mob-footer">
          <button onClick={toggle} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${border}`, background: surface, cursor: "pointer", fontSize: 14, fontWeight: 700, color: ink }}>
            {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </div>

      <main style={{ minHeight: "100vh", background: bg, color: ink, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", overflowX: "hidden" }}>

        {/* NAV */}
        <header style={{ position: "sticky", top: 0, zIndex: 40, background: navBg, backdropFilter: "blur(16px)", borderBottom: `1px solid ${border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <img src="/logo-512.png" alt="TalkScope" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px", color: ink }}>TalkScope</span>
            </div>
            <nav className="lp-nav-links" style={{ display: "flex", gap: 2 }}>
              {[["Features", "#features"], ["Who it's for", "#who"], ["How it works", "#how"], ["Pricing", "#pricing"]].map(([l, h]) => (
                <a key={l} href={h}>{l}</a>
              ))}
            </nav>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${border}`, background: surface, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isDark ? "☀️" : "🌙"}
              </button>
              {isSignedIn ? (
                <Link href="/app/dashboard" style={{ padding: "8px 18px", borderRadius: 10, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                  Open App
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" style={{ padding: "8px 16px", borderRadius: 10, background: "transparent", color: muted, textDecoration: "none", fontWeight: 600, fontSize: 14, border: `1px solid ${border}` }} className="lp-nav-links">
                    Sign In
                  </Link>
                  <Link href="/sign-up" style={{ padding: "8px 18px", borderRadius: 10, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                    Get started
                  </Link>
                </>
              )}
              <button className="lp-hamburger lp-mobile-btn" onClick={() => setMobileMenuOpen(true)} style={{ display: "none" }}>
                <span /><span /><span />
              </button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <div className="lp-hero">
          <div className="lp-hero-grid">

            {/* Left */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: isDark ? "rgba(126,181,232,0.1)" : "rgba(64,97,132,0.08)", border: `1px solid ${isDark ? "rgba(126,181,232,0.25)" : "rgba(64,97,132,0.2)"}`, color: accent, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
                <span className="lp-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                AI-Powered · Enterprise · Revenue Intelligence
              </div>

              <h1 style={{ fontSize: "clamp(30px,5.5vw,56px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.08, marginBottom: 20, color: ink }}>
                Turn every conversation into{" "}
                <span style={{ color: accent }}>revenue intelligence</span>
              </h1>

              <p style={{ fontSize: "clamp(15px,2vw,18px)", color: muted, lineHeight: 1.75, marginBottom: 36, maxWidth: 500 }}>
                TalkScope analyzes agent conversations, detects behavioral patterns, scores performance, and tells you exactly why deals are won or lost.
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 48, alignItems: "center" }}>
                <Link href="/app/dashboard" style={{ padding: "13px 26px", borderRadius: 12, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, boxShadow: `0 8px 24px ${accent}40`, whiteSpace: "nowrap" }}>
                  {isSignedIn ? "Open Dashboard" : "Start free trial"}
                </Link>
                {!isSignedIn && (
                  <Link href="/demo" style={{ padding: "13px 22px", borderRadius: 12, background: surface, border: `1px solid ${border}`, color: ink, textDecoration: "none", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
                    Try live demo
                  </Link>
                )}
                <Link href="/guide" style={{ padding: "13px 22px", borderRadius: 12, background: `${accent}12`, border: `1px solid ${accent}30`, color: accent, textDecoration: "none", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 15 }}>📖</span>
                  Docs
                </Link>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                {[
                  { value: 74, suffix: "%", label: "avg coaching time saved" },
                  { value: 30, suffix: "%", label: "more conversions detected" },
                  { value: 3, suffix: "s", label: "to score a conversation" },
                ].map(s => (
                  <div key={s.label} className="lp-stat">
                    <div style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, color: accent, letterSpacing: "-0.04em", lineHeight: 1 }}>
                      <AnimatedNumber target={s.value} />{s.suffix}
                    </div>
                    <div style={{ fontSize: 12, color: muted, marginTop: 5, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — animated mock UI */}
            <div style={{ position: "relative" }}>

              {/* Floating insights */}
              {FLOATING_INSIGHTS.map((insight, i) => {
                const isVisible = visibleInsight === i;
                const wasVisible = (visibleInsight - 1 + FLOATING_INSIGHTS.length) % FLOATING_INSIGHTS.length === i;
                if (!isVisible && !wasVisible) return null;
                return (
                  <div
                    key={i}
                    className={`lp-float-insight ${wasVisible && !isVisible ? "lp-float-out" : ""}`}
                    style={{
                      [insight.side]: insight.side === "left" ? "-20px" : "-20px",
                      top: `${15 + (i % 3) * 22}%`,
                      zIndex: 10,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{insight.icon}</span>
                    <span style={{ color: insight.color }}>{insight.text}</span>
                  </div>
                );
              })}

              {/* Main card */}
              <div style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${border}`, borderRadius: 24, padding: 22, boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.5)" : "0 32px 80px rgba(11,18,32,0.12)", position: "relative", zIndex: 1 }}>

                {/* Window chrome */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
                  {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
                  <span style={{ marginLeft: 10, fontSize: 12, color: muted, fontWeight: 600, letterSpacing: "0.02em" }}>Operations Dashboard · TalkScope</span>
                </div>

                {/* KPI row */}
                <div className="lp-mock-kpi">
                  {[
                    { l: "Avg Score", v: "74.2", c: "#f59e0b", bar: 74 },
                    { l: "High Risk", v: "3", c: "#ef4444", bar: 30 },
                    { l: "Top Agent", v: "92.1", c: "#22c55e", bar: 92 },
                    { l: "Coaching", v: "5", c: "#f97316", bar: 50 },
                  ].map(k => (
                    <div key={k.l} style={{ background: surfaceAlt, border: `1px solid ${border}`, borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.l}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: k.c, letterSpacing: "-0.04em" }}>{k.v}</div>
                      <div className="lp-score-bar">
                        <div className="lp-score-fill" style={{ width: `${k.bar}%`, background: k.c }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Agent list */}
                <div style={{ background: surfaceAlt, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "9px 14px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: muted, borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between" }}>
                    <span>Coaching Queue</span>
                    <span style={{ color: accent }}>Live ●</span>
                  </div>
                  {MOCK_AGENTS.map((a, i) => (
                    <div key={a.name} className="lp-agent-row" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(64,97,132,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: accent, flexShrink: 0 }}>{a.initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                      </div>
                      <span style={{ fontSize: 11, color: a.trend.startsWith("+") ? "#22c55e" : "#ef4444", fontWeight: 700, fontFamily: "monospace" }}>{a.trend}</span>
                      <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: a.pbg, color: a.pc, flexShrink: 0 }}>{a.priority}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: a.sc, flexShrink: 0, letterSpacing: "-0.03em" }}>{a.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <section id="features" className="lp-section">
          <div className="lp-inner">
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: "rgba(64,97,132,0.08)", border: `1px solid rgba(64,97,132,0.15)`, color: accent, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                Platform
              </div>
              <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, color: ink }}>Not call tracking. Intelligence.</h2>
              <p style={{ color: muted, fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>Everything you need to understand what's really happening in your conversations.</p>
            </div>
            <div className="lp-feat-grid">
              {FEATURES.map(f => (
                <div key={f.title} className="lp-feat-card">
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: ink, letterSpacing: "-0.01em" }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: muted, lineHeight: 1.65 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="lp-section" style={{ background: surfaceAlt }}>
          <div className="lp-inner">
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", color: ink, marginBottom: 14 }}>Live in minutes</h2>
              <p style={{ color: muted, fontSize: 17 }}>Three steps from zero to full intelligence</p>
            </div>
            <div className="lp-steps">
              {[
                { n: "01", title: "Import agents", desc: "Upload a CSV with names, emails, teams. Done in 30 seconds. No engineering required.", icon: "👥" },
                { n: "02", title: "Upload conversations", desc: "Drop transcript files, assign to agents, add your company rules and scoring standards.", icon: "💬" },
                { n: "03", title: "Get intelligence", desc: "TalkScope scores everything instantly, detects patterns, and tells you who needs coaching and why.", icon: "🧠" },
              ].map((s, i) => (
                <div key={s.n} className="lp-step">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `rgba(64,97,132,0.1)`, border: `1px solid rgba(64,97,132,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: accent, opacity: 0.5, letterSpacing: "-0.02em", fontFamily: "DM Mono, monospace" }}>{s.n}</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: ink, marginBottom: 10, letterSpacing: "-0.01em" }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: muted, lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="lp-section">
          <div className="lp-inner">
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", color: ink, marginBottom: 14 }}>Trusted by performance-driven teams</h2>
            </div>
            <div className="lp-testi-grid">
              {TESTIMONIALS.map(t => (
                <div key={t.name} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 20, padding: 28 }}>
                  <div style={{ fontSize: 32, color: accent, marginBottom: 16, opacity: 0.4, lineHeight: 1 }}>"</div>
                  <div style={{ fontSize: 15, color: muted, lineHeight: 1.75, marginBottom: 24 }}>{t.quote}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="lp-testi-avatar" style={{ background: t.gradient }}>
                      {t.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: ink }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section id="who" className="lp-section" style={{ background: surfaceAlt, overflow: "hidden" }}>
          <div className="lp-inner">
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: `${accent}12`, border: `1px solid ${accent}25`, fontSize: 12, fontWeight: 700, color: accent, marginBottom: 16 }}>
                BUILT FOR YOUR INDUSTRY
              </div>
              <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", color: ink, marginBottom: 14 }}>
                Who uses TalkScope
              </h2>
              <p style={{ color: muted, fontSize: 17, maxWidth: 480, margin: "0 auto" }}>
                One platform, three industries. Each with its own pain — and its own ROI.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Card 1 — Contact Centers */}
              <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", border: `1px solid ${border}`, background: surface, minHeight: 220 }}>
                {/* Floating elements */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  {[
                    { top: "12%", left: "62%", text: "QA Score: 91", icon: "✅", color: "#22c55e", delay: "0s", size: 13 },
                    { top: "55%", left: "68%", text: "Risk: Low ↓", icon: "🛡️", color: "#406184", delay: "1.4s", size: 12 },
                    { top: "28%", left: "82%", text: "Script compliance 97%", icon: "📋", color: "#8b5cf6", delay: "2.6s", size: 11 },
                    { top: "70%", left: "58%", text: "Coaching queue: 2 agents", icon: "🎯", color: "#f59e0b", delay: "0.8s", size: 12 },
                    { top: "42%", left: "75%", text: "Avg handle time -18%", icon: "⚡", color: "#22c55e", delay: "1.9s", size: 11 },
                  ].map((el, i) => (
                    <div key={i} style={{
                      position: "absolute", top: el.top, left: el.left,
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 20,
                      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.95)",
                      border: `1px solid ${el.color}30`,
                      boxShadow: `0 4px 16px ${el.color}18`,
                      fontSize: el.size, fontWeight: 700, color: ink,
                      animation: `floatCard 4s ease-in-out infinite`,
                      animationDelay: el.delay,
                      whiteSpace: "nowrap",
                    }}>
                      <span>{el.icon}</span>
                      <span style={{ color: el.color }}>{el.text}</span>
                    </div>
                  ))}
                  {/* Gradient fade on right */}
                  <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "45%", background: `linear-gradient(to left, ${surface}, transparent)` }} />
                </div>

                <div style={{ position: "relative", padding: "36px 40px", maxWidth: "58%", zIndex: 1 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 10, background: "rgba(64,97,132,0.1)", marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>🏢</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contact Centers</span>
                  </div>
                  <h3 style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 900, color: ink, marginBottom: 12, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    Stop listening to every call.<br />Let AI do the QA.
                  </h3>
                  <p style={{ fontSize: 14, color: muted, lineHeight: 1.75, marginBottom: 20 }}>
                    Automatically score 100% of conversations, surface coaching priorities, detect compliance risks, and reduce manual review by 80%.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Automated QA", "Compliance monitoring", "Coaching queue", "Risk alerts"].map(tag => (
                      <span key={tag} style={{ padding: "4px 10px", borderRadius: 8, background: `${accent}10`, border: `1px solid ${accent}20`, fontSize: 12, fontWeight: 600, color: accent }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2 — Sales */}
              <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", border: `1px solid ${border}`, background: surface, minHeight: 220 }}>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  {[
                    { top: "15%", left: "60%", text: "Deal lost: pricing objection", icon: "⚠️", color: "#ef4444", delay: "0.3s", size: 12 },
                    { top: "50%", left: "72%", text: "Conversion +23% this week", icon: "📈", color: "#22c55e", delay: "1.6s", size: 12 },
                    { top: "30%", left: "80%", text: "Top phrase: 'Let me show you'", icon: "💡", color: "#f59e0b", delay: "2.8s", size: 11 },
                    { top: "68%", left: "62%", text: "Revenue leakage: $12k/mo", icon: "🔍", color: "#8b5cf6", delay: "1s", size: 12 },
                    { top: "42%", left: "76%", text: "Best closer: Marcus W.", icon: "🏆", color: "#406184", delay: "2.2s", size: 11 },
                  ].map((el, i) => (
                    <div key={i} style={{
                      position: "absolute", top: el.top, left: el.left,
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 20,
                      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.95)",
                      border: `1px solid ${el.color}30`,
                      boxShadow: `0 4px 16px ${el.color}18`,
                      fontSize: el.size, fontWeight: 700, color: ink,
                      animation: `floatCard 4.5s ease-in-out infinite`,
                      animationDelay: el.delay,
                      whiteSpace: "nowrap",
                    }}>
                      <span>{el.icon}</span>
                      <span style={{ color: el.color }}>{el.text}</span>
                    </div>
                  ))}
                  <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "45%", background: `linear-gradient(to left, ${surface}, transparent)` }} />
                </div>

                <div style={{ position: "relative", padding: "36px 40px", maxWidth: "58%", zIndex: 1 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 10, background: "rgba(34,197,94,0.1)", marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>💼</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sales Organizations</span>
                  </div>
                  <h3 style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 900, color: ink, marginBottom: 12, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    Find out exactly why<br />deals are won or lost.
                  </h3>
                  <p style={{ fontSize: 14, color: muted, lineHeight: 1.75, marginBottom: 20 }}>
                    Identify the phrases that close deals, the moments where revenue leaks, and replicate your top performers across the entire team.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Revenue leakage", "Conversion drivers", "Deal intelligence", "Rep benchmarking"].map(tag => (
                      <span key={tag} style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 12, fontWeight: 600, color: "#16a34a" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3 — Collections */}
              <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", border: `1px solid ${border}`, background: surface, minHeight: 220 }}>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  {[
                    { top: "14%", left: "61%", text: "Compliance: ✓ Passed", icon: "🛡️", color: "#22c55e", delay: "0.5s", size: 12 },
                    { top: "48%", left: "74%", text: "Script deviation detected", icon: "⚠️", color: "#ef4444", delay: "1.8s", size: 12 },
                    { top: "27%", left: "81%", text: "Recovery rate +31%", icon: "📈", color: "#406184", delay: "3s", size: 11 },
                    { top: "66%", left: "63%", text: "Tone: empathetic ✓", icon: "💬", color: "#8b5cf6", delay: "1.1s", size: 12 },
                    { top: "40%", left: "77%", text: "Risk flag: aggressive lang.", icon: "🚨", color: "#f59e0b", delay: "2.4s", size: 11 },
                  ].map((el, i) => (
                    <div key={i} style={{
                      position: "absolute", top: el.top, left: el.left,
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 20,
                      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.95)",
                      border: `1px solid ${el.color}30`,
                      boxShadow: `0 4px 16px ${el.color}18`,
                      fontSize: el.size, fontWeight: 700, color: ink,
                      animation: `floatCard 5s ease-in-out infinite`,
                      animationDelay: el.delay,
                      whiteSpace: "nowrap",
                    }}>
                      <span>{el.icon}</span>
                      <span style={{ color: el.color }}>{el.text}</span>
                    </div>
                  ))}
                  <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "45%", background: `linear-gradient(to left, ${surface}, transparent)` }} />
                </div>

                <div style={{ position: "relative", padding: "36px 40px", maxWidth: "58%", zIndex: 1 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 10, background: "rgba(245,158,11,0.1)", marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>💰</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.06em" }}>Collections & Recovery</span>
                  </div>
                  <h3 style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 900, color: ink, marginBottom: 12, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    Compliance by default.<br />Recovery by design.
                  </h3>
                  <p style={{ fontSize: 14, color: muted, lineHeight: 1.75, marginBottom: 20 }}>
                    Monitor every conversation for compliance violations, detect aggressive language before it becomes a liability, and coach your way to higher recovery rates.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Compliance monitoring", "Script adherence", "Risk flagging", "Recovery analytics"].map(tag => (
                      <span key={tag} style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 12, fontWeight: 600, color: "#b45309" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="lp-section" style={{ background: surfaceAlt }}>
          <div className="lp-inner">
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, color: ink }}>Simple, transparent pricing</h2>
              <p style={{ color: muted, fontSize: 17 }}>Start free. Scale as your team grows.</p>
            </div>
            <div className="lp-price-grid">
              {[
                {
                  name: "Starter", price: "$49", per: "/mo",
                  desc: "Perfect for small teams getting started with conversation intelligence.",
                  features: ["Up to 5 agents", "500 conversations/mo", "AI scoring & patterns", "Basic coaching queue", "Email support"],
                  cta: "Start free trial", primary: false,
                },
                {
                  name: "Growth", price: "$199", per: "/mo",
                  desc: "For growing contact centers that need full performance intelligence.",
                  features: ["Up to 25 agents", "5,000 conversations/mo", "Everything in Starter", "Batch scoring engine", "Revenue leakage detection", "Coaching priority engine", "Priority support"],
                  cta: "Get started", primary: true, badge: "Most popular",
                },
                {
                  name: "Enterprise", price: "Custom", per: "",
                  desc: "Full platform for large operations with advanced needs.",
                  features: ["Unlimited agents", "Unlimited conversations", "Everything in Growth", "Multi-team intelligence", "Custom AI rules engine", "SSO / SAML", "Dedicated success manager"],
                  cta: "Contact us", primary: false,
                },
              ].map(plan => (
                <div key={plan.name} style={{
                  background: plan.primary ? accent : surface,
                  border: `1px solid ${plan.primary ? accent : border}`,
                  borderRadius: 24, padding: 32, position: "relative",
                  boxShadow: plan.primary ? `0 24px 60px ${accent}35` : "none",
                  transform: plan.primary ? "scale(1.03)" : "none",
                }}>
                  {(plan as any).badge && (
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 20, background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
                      {(plan as any).badge}
                    </div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 800, color: plan.primary ? "rgba(255,255,255,0.65)" : muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 10 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.05em", color: plan.primary ? "#fff" : ink }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: plan.primary ? "rgba(255,255,255,0.55)" : muted }}>{plan.per}</span>
                  </div>
                  <div style={{ fontSize: 13, color: plan.primary ? "rgba(255,255,255,0.65)" : muted, lineHeight: 1.65, marginBottom: 24, minHeight: 42 }}>{plan.desc}</div>
                  <Link href="/sign-up" style={{ display: "block", textAlign: "center", padding: "12px 20px", borderRadius: 12, background: plan.primary ? "#fff" : accent, color: plan.primary ? accent : "#fff", textDecoration: "none", fontWeight: 800, fontSize: 14, marginBottom: 24 }}>
                    {plan.cta}
                  </Link>
                  <div style={{ borderTop: `1px solid ${plan.primary ? "rgba(255,255,255,0.18)" : border}`, paddingTop: 20 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 10, fontSize: 13, color: plan.primary ? "rgba(255,255,255,0.82)" : muted }}>
                        <span style={{ color: plan.primary ? "#86efac" : "#22c55e", fontWeight: 900, flexShrink: 0 }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", marginTop: 36, fontSize: 14, color: muted }}>
              All plans include a 14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-section" style={{ textAlign: "center" }}>
          <div style={{ maxWidth: 580, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16, color: ink }}>
              Ready to see what your conversations really do?
            </h2>
            <p style={{ color: muted, fontSize: 17, marginBottom: 36, lineHeight: 1.7 }}>
              Import your agents and transcripts. Get first insights in minutes. No engineering required.
            </p>
            <div className="lp-cta-btns">
              <Link href="/sign-up" style={{ padding: "14px 32px", borderRadius: 14, background: accent, color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 16, boxShadow: `0 8px 24px ${accent}40` }}>
                Start free trial →
              </Link>
              <Link href="/app/dashboard" style={{ padding: "14px 32px", borderRadius: 14, background: surface, border: `1px solid ${border}`, color: ink, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>
                Open Dashboard
              </Link>
            </div>
            <p style={{ marginTop: 18, fontSize: 13, color: muted }}>14-day free trial · No credit card required</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${border}`, padding: "24px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/logo-512.png" alt="TalkScope" style={{ width: 26, height: 26, borderRadius: 7 }} />
              <span style={{ fontWeight: 800, fontSize: 14, color: accent }}>TalkScope</span>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/guide" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>📖 Docs</Link>
              <Link href="/privacy" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>🔒 Privacy</Link>
              <Link href="/security" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>🛡️ Security</Link>
              <span style={{ fontSize: 13, color: muted }}>© 2026 TalkScope</span>
            </div>
            <Link href="/app/dashboard" style={{ fontSize: 13, color: accent, textDecoration: "none", fontWeight: 600 }}>Open App →</Link>
          </div>
        </footer>
      </main>
    </>
  );
}
