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
  { text: "Risk detected in call #847",       color: "#ef4444", side: "left",  delay: 0 },
  { text: "Strong opener — +12% conversion",  color: "#22c55e", side: "right", delay: 1.2 },
  { text: "Coaching tip: slow down on pricing",color: "#f59e0b", side: "left",  delay: 2.4 },
  { text: "Score improved +8 pts this week",   color: "#406184", side: "right", delay: 3.6 },
  { text: "Pattern: objection at minute 4",    color: "#8b5cf6", side: "left",  delay: 4.8 },
];

const MOCK_AGENTS = [
  { name: "Sarah Mitchell", score: 91, priority: "Monitor",  initials: "SM", sc: "#22c55e", pc: "#22c55e", pbg: "rgba(34,197,94,0.12)", trend: "+4" },
  { name: "James Rodriguez", score: 74, priority: "Focus",   initials: "JR", sc: "#f59e0b", pc: "#f97316", pbg: "rgba(249,115,22,0.12)", trend: "-2" },
  { name: "Anna Chen",       score: 62, priority: "Urgent",  initials: "AC", sc: "#f59e0b", pc: "#ef4444", pbg: "rgba(239,68,68,0.12)", trend: "+1" },
  { name: "Marcus Webb",     score: 88, priority: "Monitor", initials: "MW", sc: "#22c55e", pc: "#22c55e", pbg: "rgba(34,197,94,0.12)", trend: "+6" },
];

const ICON_SCORING = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const ICON_PATTERN = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="19" cy="18" r="2"/></svg>;
const ICON_REVENUE = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const ICON_GROWTH = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const ICON_RULES = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const ICON_REALTIME = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

const FEATURES = [
  { icon: ICON_SCORING,  title: "AI Conversation Scoring",    desc: "Every conversation scored on communication, conversion, risk, and coaching priority in seconds." },
  { icon: ICON_PATTERN,  title: "Pattern Intelligence",       desc: "Detect repeating behavioral patterns, risk triggers, and conversion drivers across thousands of calls." },
  { icon: ICON_REVENUE,  title: "Revenue Leakage Detection",  desc: "Find exactly where deals are lost, which phrases kill conversions, and how much it costs you." },
  { icon: ICON_GROWTH,   title: "Agent Growth Engine",        desc: "Track score history, identify improvement areas, and prioritize coaching by revenue impact." },
  { icon: ICON_RULES,    title: "Company Rules Engine",       desc: "AI scores against your scripts and standards, not generic ones. Train it on your playbook." },
  { icon: ICON_REALTIME, title: "Real-Time Intelligence",     desc: "Score conversations instantly on upload. No waiting, no batch delays — insights in seconds." },
];

const TESTIMONIALS = [
  {
    quote: "We cut coaching prep time by 70%. TalkScope shows exactly which agents need attention and why — no more guessing.",
    name: "Sarah K.", role: "Head of QA, FinTech", initials: "SK",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
  },
  {
    quote: "The pattern engine found a phrase that was killing 30% of our conversions. We fixed it in a week and saw immediate results.",
    name: "Marcus T.", role: "Sales Director", initials: "MT",
    gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  },
  {
    quote: "Finally a tool built for contact centers, not just sales. The risk detection alone paid for itself in the first month.",
    name: "Elena V.", role: "Operations Manager", initials: "EV",
    gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
  },
];

function WhoTabs({ tabs, isDark, ink, muted, border }: any) {
  const [active, setActive] = useState(0);
  const t = tabs[active];
  const bgCard = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const shadow = isDark ? "none" : "0 2px 24px rgba(0,0,0,0.07)";

  return (
    <div>
      <style>{`
        .who-tab-bar { display:flex; gap:4px; margin-bottom:28px; background:${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}; border-radius:14px; padding:4px; }
        @media(max-width:600px) {
          .who-tab-bar { flex-direction:column; gap:2px; border-radius:12px; }
          .who-tab-btn { justify-content:flex-start !important; padding:12px 16px !important; border-radius:8px !important; border:1px solid transparent; }
          .who-tab-btn.active-tab { border-color:${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} !important; }
          .who-panel { grid-template-columns:1fr !important; }
          .who-panel-right { display:none !important; }
          .who-panel-left { border-right:none !important; padding:28px 24px !important; }
          .cta-float-cards { display:none !important; }
        }
      `}</style>

      {/* Tab bar */}
      <div className="who-tab-bar">
        {tabs.map((tab: any, i: number) => (
          <button key={tab.id} onClick={() => setActive(i)} className={`who-tab-btn${active === i ? " active-tab" : ""}`} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer",
            background: active === i ? (isDark ? "#1a2d45" : "#ffffff") : "transparent",
            color: active === i ? tab.labelColor : muted,
            fontWeight: active === i ? 800 : 600, fontSize: 14,
            boxShadow: active === i ? (isDark ? "none" : "0 1px 8px rgba(0,0,0,0.1)") : "none",
            transition: "all 0.2s", fontFamily: "inherit",
          }}>
            <span style={{ color: active === i ? tab.labelColor : muted, opacity: active === i ? 1 : 0.5 }}>{tab.icon}</span>
            <span className="who-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="who-panel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderRadius: 24, overflow: "hidden", border: `1px solid ${border}`, background: bgCard, boxShadow: shadow, minHeight: 360 }}>

        {/* Left — text */}
        <div className="who-panel-left" style={{ padding: "48px 52px", borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 10, background: t.tagBg, border: `1px solid ${t.tagBorder}`, marginBottom: 20, width: "fit-content" }}>
            <span style={{ color: t.labelColor }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: t.labelColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>{t.label}</span>
          </div>
          <h3 style={{ fontSize: "clamp(20px,2vw,26px)", fontWeight: 900, color: ink, marginBottom: 14, letterSpacing: "-0.02em", lineHeight: 1.25 }}>{t.title}</h3>
          <p style={{ fontSize: 14, color: muted, lineHeight: 1.8, marginBottom: 28 }}>{t.desc}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            {t.tags.map((tag: string) => (
              <span key={tag} style={{ padding: "4px 10px", borderRadius: 8, background: t.tagBg, border: `1px solid ${t.tagBorder}`, fontSize: 12, fontWeight: 600, color: t.tagColor }}>{tag}</span>
            ))}
          </div>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 24, paddingTop: 24, borderTop: `1px solid ${border}` }}>
            {t.stats.map((s: any) => (
              <div key={s.label}>
                <div style={{ fontSize: 24, fontWeight: 900, color: t.labelColor, letterSpacing: "-0.03em" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: muted, marginTop: 2, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — visual with floating cards (hidden on mobile) */}
        <div className="who-panel-right" style={{ position: "relative", background: isDark ? "rgba(255,255,255,0.02)" : t.tagBg, overflow: "hidden", minHeight: 320 }}>
          <div style={{ position: "absolute", top: "20%", left: "20%", width: "60%", height: "60%", borderRadius: "50%", background: `radial-gradient(circle, ${t.tagBorder.replace("0.2", "0.6")} 0%, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />
          {t.floats.map((el: any, i: number) => (
            <div key={i} style={{
              position: "absolute", top: el.top, right: el.right,
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 12,
              background: isDark ? "rgba(15,26,46,0.9)" : "rgba(255,255,255,0.95)",
              border: `1px solid ${el.dot}25`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px ${el.dot}15`,
              backdropFilter: "blur(8px)",
              fontSize: 13, fontWeight: 700, color: ink,
              animation: "floatCard 4s ease-in-out infinite",
              animationDelay: el.delay, whiteSpace: "nowrap",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: el.dot, flexShrink: 0 }} />
              <span style={{ color: el.dot }}>{el.text}</span>
            </div>
          ))}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 80, height: 80, borderRadius: 24, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)", border: `2px solid ${t.tagBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: t.labelColor, boxShadow: `0 8px 32px ${t.tagBorder.replace("0.2", "0.3")}` }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{active === 0 ? <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.91-1.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></> : active === 1 ? <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></> : <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>}</svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isDark, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleInsight, setVisibleInsight] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { isSignedIn } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      // Active section detection
      const sections = ["features", "who", "how", "pricing"];
      let current = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 80) current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        </nav>
        <div className="lp-mob-footer">
          {isSignedIn ? (
            <Link href="/app/dashboard" style={{ display: "block", width: "100%", padding: "11px", borderRadius: 10, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14, textAlign: "center", marginBottom: 8 }}>
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-up" style={{ display: "block", padding: "11px", borderRadius: 10, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14, textAlign: "center", marginBottom: 8 }}>
                Get started
              </Link>
              <Link href="/sign-in" style={{ display: "block", padding: "11px", borderRadius: 10, border: `1px solid ${border}`, color: ink, textDecoration: "none", fontWeight: 600, fontSize: 14, textAlign: "center", marginBottom: 12 }}>
                Sign In
              </Link>
            </>
          )}
          <button onClick={toggle} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${border}`, background: surface, cursor: "pointer", fontSize: 14, fontWeight: 700, color: ink }}>
            {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </div>

      <main style={{ minHeight: "100vh", background: bg, color: ink, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", paddingTop: 64 }}>

        {/* NAV */}
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
          background: scrolled ? navBg : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${border}` : "1px solid transparent",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
          transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: scrolled ? 54 : 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, transition: "height 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <img src="/logo-512.png" alt="TalkScope" style={{ width: scrolled ? 28 : 32, height: scrolled ? 28 : 32, borderRadius: 8, flexShrink: 0, transition: "all 0.3s" }} />
              <span style={{ fontWeight: 800, fontSize: scrolled ? 15 : 16, letterSpacing: "-0.3px", color: ink, transition: "font-size 0.3s" }}>TalkScope</span>
            </div>
            <nav className="lp-nav-links" style={{ display: "flex", gap: 2 }}>
              {([["Features", "#features"], ["Who it's for", "#who"], ["How it works", "#how"], ["Pricing", "#pricing"]] as [string,string][]).map(([l, h]) => {
                const sectionId = h.replace("#", "");
                const isActive = activeSection === sectionId;
                return (
                  <a key={l} href={h} style={{
                    padding: "6px 13px", borderRadius: 8, fontSize: 14, fontWeight: isActive ? 700 : 500,
                    color: isActive ? accent : muted, textDecoration: "none",
                    background: isActive ? `${accent}12` : "transparent",
                    transition: "all 0.2s",
                  }}>{l}</a>
                );
              })}
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
                  {isSignedIn ? "Open Dashboard" : "Get started"}
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
              <div style={{ display: "flex", gap: 32, flexWrap: "nowrap" }}>
                {[
                  { value: 74, suffix: "%", label: "coaching time saved" },
                  { value: 30, suffix: "%", label: "more conversions" },
                  { value: 3, suffix: "s", label: "to score a call" },
                ].map(s => (
                  <div key={s.label} className="lp-stat" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 900, color: accent, letterSpacing: "-0.04em", lineHeight: 1 }}>
                      <AnimatedNumber target={s.value} />{s.suffix}
                    </div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 5, fontWeight: 500, lineHeight: 1.3 }}>{s.label}</div>
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
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: insight.color, flexShrink: 0 }} />
                    <span style={{ color: insight.color, fontWeight: 700 }}>{insight.text}</span>
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
        <section id="features" style={{ borderTop: `1px solid ${border}`, padding: "80px 32px", background: isDark ? "#0d1829" : "#0b1220", position: "relative", overflow: "hidden" }}>
          {/* Mesh background */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,97,132,0.35) 0%, transparent 70%)", filter: "blur(60px)" }} />
            <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,97,132,0.2) 0%, transparent 70%)", filter: "blur(80px)" }} />
            <div style={{ position: "absolute", top: "40%", left: "50%", width: "30%", height: "30%", borderRadius: "50%", background: "radial-gradient(circle, rgba(126,181,232,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
          </div>
          <div className="lp-inner" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: "rgba(126,181,232,0.12)", border: "1px solid rgba(126,181,232,0.2)", color: "#7eb5e8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                Platform
              </div>
              <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, color: "#f7f9fc" }}>Not call tracking. Intelligence.</h2>
              <p style={{ color: "rgba(247,249,252,0.55)", fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>Everything you need to understand what's really happening in your conversations.</p>
            </div>
            <div className="lp-feat-grid">
              {FEATURES.map(f => (
                <div key={f.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, transition: "transform 0.2s, background 0.2s", backdropFilter: "blur(8px)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(126,181,232,0.12)", border: "1px solid rgba(126,181,232,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7eb5e8", marginBottom: 18, flexShrink: 0 }}>{f.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: "#f7f9fc", letterSpacing: "-0.01em" }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: "rgba(247,249,252,0.55)", lineHeight: 1.65 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS — white with grid */}
        <section id="how" style={{ padding: "80px 32px", background: isDark ? "#0f1a2e" : "#ffffff", borderTop: `1px solid ${border}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: isDark ? 0.04 : 0.025, backgroundImage: "linear-gradient(#406184 1px, transparent 1px), linear-gradient(90deg, #406184 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
          <div className="lp-inner" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", color: ink, marginBottom: 14 }}>Live in minutes</h2>
              <p style={{ color: muted, fontSize: 17 }}>Three steps from zero to full intelligence</p>
            </div>
            <div className="lp-steps">
              {[
                { n: "01", title: "Import agents", desc: "Upload a CSV with names, emails, teams. Done in 30 seconds. No engineering required.",
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                { n: "02", title: "Upload conversations", desc: "Drop transcript files, assign to agents, add your company rules and scoring standards.",
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
                { n: "03", title: "Get intelligence", desc: "TalkScope scores everything instantly, detects patterns, and tells you who needs coaching and why.",
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
              ].map((s, i) => (
                <div key={s.n} className="lp-step" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{s.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: accent, opacity: 0.45, letterSpacing: "-0.02em", fontFamily: "DM Mono, monospace" }}>{s.n}</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: ink, marginBottom: 10, letterSpacing: "-0.01em" }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: muted, lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS — dark mesh */}
        <section style={{ padding: "80px 32px", background: isDark ? "#080f1c" : "#0b1220", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: "10%", right: "5%", width: "45%", height: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,97,132,0.3) 0%, transparent 70%)", filter: "blur(80px)" }} />
            <div style={{ position: "absolute", bottom: "10%", left: "5%", width: "35%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(126,181,232,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
          </div>
          <div className="lp-inner" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#f7f9fc", marginBottom: 14 }}>Trusted by performance-driven teams</h2>
              <p style={{ color: "rgba(247,249,252,0.5)", fontSize: 16 }}>Real results from real contact center leaders</p>
            </div>
            <div className="lp-testi-grid">
              {TESTIMONIALS.map(t => (
                <div key={t.name} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, padding: 32, backdropFilter: "blur(12px)", transition: "background 0.2s, transform 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
                  {/* Quote mark */}
                  <div style={{ fontSize: 48, color: "#7eb5e8", marginBottom: 4, opacity: 0.3, lineHeight: 1, fontFamily: "Georgia, serif" }}>"</div>
                  <div style={{ fontSize: 15, color: "rgba(247,249,252,0.8)", lineHeight: 1.75, marginBottom: 28, fontStyle: "italic" }}>{t.quote}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img
                      src={t.photo}
                      alt={t.name}
                      style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.15)", flexShrink: 0 }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
                      }}
                    />
                    <div className="lp-testi-avatar" style={{ background: t.gradient, display: "none" }}>{t.initials}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#f7f9fc" }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(247,249,252,0.5)", marginTop: 3 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR — tabbed */}
        <section id="who" style={{ padding: "80px 32px", background: isDark ? "#0f1a2e" : "#f6f8fc", borderTop: `1px solid ${border}`, overflow: "hidden" }}>
          <div className="lp-inner">
            <div style={{ textAlign: "center", marginBottom: 52 }}>
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

            {(() => {
              const WHO_TABS = [
                {
                  id: "cc",
                  label: "Contact Centers",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.91-1.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                  labelColor: accent, tagBg: `${accent}10`, tagBorder: `${accent}20`, tagColor: accent,
                  title: "Stop listening to every call. Let AI do the QA.",
                  desc: "Automatically score 100% of conversations, surface coaching priorities, detect compliance risks, and reduce manual review by 80%.",
                  tags: ["Automated QA", "Compliance monitoring", "Coaching queue", "Risk alerts"],
                  stats: [{ val: "80%", label: "less manual review" }, { val: "100%", label: "coverage" }, { val: "3×", label: "faster coaching" }],
                  floats: [
                    { top: "18%", right: "12%", text: "QA Score: 91", dot: "#22c55e", delay: "0s" },
                    { top: "42%", right: "5%",  text: "Script compliance 97%", dot: "#406184", delay: "1.4s" },
                    { top: "65%", right: "18%", text: "Coaching queue: 2 agents", dot: "#f59e0b", delay: "2.2s" },
                  ],
                },
                {
                  id: "sales",
                  label: "Sales Teams",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
                  labelColor: "#16a34a", tagBg: "rgba(34,197,94,0.08)", tagBorder: "rgba(34,197,94,0.2)", tagColor: "#16a34a",
                  title: "Find out exactly why deals are won or lost.",
                  desc: "Identify the phrases that close deals, the moments where revenue leaks, and replicate your top performers across the entire team.",
                  tags: ["Revenue leakage", "Conversion drivers", "Deal intelligence", "Rep benchmarking"],
                  stats: [{ val: "+23%", label: "conversion lift" }, { val: "$12k", label: "monthly savings" }, { val: "67%", label: "fewer lost deals" }],
                  floats: [
                    { top: "18%", right: "12%", text: "Deal lost: pricing objection", dot: "#ef4444", delay: "0.3s" },
                    { top: "42%", right: "5%",  text: "Conversion +23% this week", dot: "#22c55e", delay: "1.6s" },
                    { top: "65%", right: "18%", text: "Revenue leakage: $12k/mo", dot: "#8b5cf6", delay: "2.8s" },
                  ],
                },
                {
                  id: "col",
                  label: "Collections",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
                  labelColor: "#b45309", tagBg: "rgba(245,158,11,0.08)", tagBorder: "rgba(245,158,11,0.2)", tagColor: "#b45309",
                  title: "Compliance by default. Recovery by design.",
                  desc: "Monitor every conversation for compliance violations, detect aggressive language before it becomes a liability, and coach your way to higher recovery rates.",
                  tags: ["Compliance monitoring", "Script adherence", "Risk flagging", "Recovery analytics"],
                  stats: [{ val: "+31%", label: "recovery rate" }, { val: "0", label: "compliance gaps" }, { val: "90%", label: "risk coverage" }],
                  floats: [
                    { top: "18%", right: "12%", text: "Compliance: Passed", dot: "#22c55e", delay: "0.5s" },
                    { top: "42%", right: "5%",  text: "Script deviation detected", dot: "#ef4444", delay: "1.8s" },
                    { top: "65%", right: "18%", text: "Recovery rate +31%", dot: "#406184", delay: "3s" },
                  ],
                },
              ];
              return <WhoTabs tabs={WHO_TABS} isDark={isDark} ink={ink} muted={muted} border={border} />;
            })()}
          </div>
        </section>

        {/* PRICING + CTA — unified dark block */}
        <div style={{ background: "#0b1220", position: "relative", overflow: "hidden" }}>
          {/* Shared mesh gradient across both sections */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: "-5%", left: "10%", width: "50%", height: "45%", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,97,132,0.28) 0%, transparent 70%)", filter: "blur(90px)" }} />
            <div style={{ position: "absolute", top: "30%", right: "5%", width: "40%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,97,132,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
            <div style={{ position: "absolute", bottom: "5%", left: "20%", width: "60%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle, rgba(126,181,232,0.08) 0%, transparent 70%)", filter: "blur(70px)" }} />
          </div>

        {/* PRICING */}
        <section id="pricing" style={{ padding: "80px 32px 60px", position: "relative", zIndex: 1 }}>
          <div className="lp-inner" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 14, color: "#f7f9fc" }}>Simple, transparent pricing</h2>
              <p style={{ color: "rgba(247,249,252,0.5)", fontSize: 17 }}>Start free. Scale as your team grows.</p>
            </div>
            <div className="lp-price-grid">
              {[
                {
                  name: "Starter", price: "$49", per: "/mo",
                  desc: "Perfect for small teams getting started with conversation intelligence.",
                  features: ["Up to 5 agents", "500 conversations/mo", "AI scoring & patterns", "Basic coaching queue", "Email support"],
                  cta: "Get started", primary: false,
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
                  background: plan.primary ? accent : "rgba(255,255,255,0.05)",
                  border: `1px solid ${plan.primary ? accent : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 24, padding: 32, position: "relative",
                  boxShadow: plan.primary ? `0 24px 60px ${accent}50` : "none",
                  transform: plan.primary ? "scale(1.03)" : "none",
                  backdropFilter: "blur(12px)",
                }}>
                  {(plan as any).badge && (
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 20, background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
                      {(plan as any).badge}
                    </div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 800, color: plan.primary ? "rgba(255,255,255,0.65)" : "rgba(247,249,252,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 10 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.05em", color: "#f7f9fc" }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: plan.primary ? "rgba(255,255,255,0.55)" : "rgba(247,249,252,0.4)" }}>{plan.per}</span>
                  </div>
                  <div style={{ fontSize: 13, color: plan.primary ? "rgba(255,255,255,0.65)" : "rgba(247,249,252,0.5)", lineHeight: 1.65, marginBottom: 24, minHeight: 42 }}>{plan.desc}</div>
                  <Link href="/sign-up" style={{ display: "block", textAlign: "center", padding: "12px 20px", borderRadius: 12, background: plan.primary ? "#fff" : "rgba(255,255,255,0.12)", color: plan.primary ? accent : "#f7f9fc", textDecoration: "none", fontWeight: 800, fontSize: 14, marginBottom: 24, border: plan.primary ? "none" : "1px solid rgba(255,255,255,0.15)" }}>
                    {plan.cta}
                  </Link>
                  <div style={{ borderTop: `1px solid ${plan.primary ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`, paddingTop: 20 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 10, fontSize: 13, color: plan.primary ? "rgba(255,255,255,0.82)" : "rgba(247,249,252,0.6)" }}>
                        <span style={{ color: "#86efac", fontWeight: 900, flexShrink: 0 }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", marginTop: 36, fontSize: 14, color: "rgba(247,249,252,0.4)" }}>
              All plans include a demo account · No credit card required to start
            </p>
          </div>
        </section>

        {/* FINAL CTA — split layout with photo */}
        <section style={{ position: "relative", zIndex: 1 }}>
          {/* no duplicate mesh — shared above */}

          <style>{`
            .cta-split { display:flex; align-items:stretch; min-height:520px; position:relative; z-index:1; }
            .cta-left  { flex:0 0 52%; padding:80px 56px 80px 32px; display:flex; flex-direction:column; justify-content:center; }
            .cta-right { flex:0 0 48%; position:relative; display:flex; align-items:center; justify-content:center; padding:40px 24px 40px 0; }
            @media(max-width:768px) {
              .cta-split { flex-direction:column; min-height:auto; }
              .cta-left  { flex:none; padding:56px 24px 32px; }
              .cta-right { flex:none; padding:0 24px 48px; justify-content:center; }
            }
          `}</style>
          <div style={{ maxWidth: 1200, margin: "0 auto" }} className="cta-split">

            {/* LEFT — text */}
            <div className="cta-left">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 28, width: "fit-content" }}>
                Try the live demo — no signup needed
              </div>
              <h2 style={{ fontSize: "clamp(28px,3.5vw,46px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 20, color: "#ffffff", lineHeight: 1.1 }}>
                Ready to know what's<br />really happening in<br />your conversations?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 40, lineHeight: 1.75, maxWidth: 440 }}>
                Import your team. Upload conversations. Get AI-powered scores, coaching priorities, and revenue intelligence — in minutes.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/sign-up" style={{ padding: "14px 32px", borderRadius: 12, background: "#ffffff", color: accent, textDecoration: "none", fontWeight: 900, fontSize: 15, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
                  Create free account →
                </Link>
                <Link href="/demo" style={{ padding: "14px 28px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>
                  Try live demo
                </Link>
              </div>
              <p style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                Book a call · See a live demo · Get started in minutes
              </p>
            </div>

            {/* RIGHT — uploaded agent image with branded overlay cards */}
            <div className="cta-right">

              {/* Container that mimics the hexagon composition */}
              <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>

                {/* The image — no clipping, natural transparent bg blends into dark */}
                <img
                  src="/cta-agent.webp"
                  alt="TalkScope agent scoring"
                  style={{ width: "100%", display: "block", filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.5))" }}
                />

                <div className="cta-float-cards">
                {/* TOP LEFT — Overall Score card */}
                <div style={{
                  position: "absolute", top: "2%", left: "0%",
                  background: "rgba(10,18,34,0.92)", backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14,
                  padding: "12px 18px", minWidth: 160,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  animation: "floatCard 5s ease-in-out infinite", animationDelay: "0s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Conversation Score</span>
                    <span style={{ fontSize: 10, fontWeight: 800, background: "#22c55e", color: "#fff", padding: "2px 7px", borderRadius: 6 }}>Excellent</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>94<span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }}>%</span></div>
                </div>

                {/* LEFT SIDE — metric rows */}
                <div style={{
                  position: "absolute", top: "33%", left: "-2%",
                  display: "flex", flexDirection: "column", gap: 8,
                  animation: "floatCard 4.5s ease-in-out infinite", animationDelay: "0.6s",
                }}>
                  {[
                    { label: "Tone & Empathy",     badge: "Excellent", badgeColor: "#22c55e" },
                    { label: "Script Compliance",  badge: "Good",      badgeColor: "#3b82f6" },
                    { label: "Objection Handling", badge: "Good",      badgeColor: "#3b82f6" },
                    { label: "Revenue Signal",     badge: "Excellent", badgeColor: "#22c55e" },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      background: "rgba(10,18,34,0.88)", backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                      padding: "7px 12px", minWidth: 210,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, background: row.badgeColor, color: "#fff", padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{row.badge}</span>
                    </div>
                  ))}
                </div>

                {/* BOTTOM RIGHT — coaching insight card */}
                <div style={{
                  position: "absolute", bottom: "6%", right: "-2%",
                  background: "rgba(10,18,34,0.92)", backdropFilter: "blur(16px)",
                  border: "1px solid rgba(126,181,232,0.25)", borderRadius: 14,
                  padding: "14px 18px", maxWidth: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(126,181,232,0.1)",
                  animation: "floatCard 5.5s ease-in-out infinite", animationDelay: "1.4s",
                }}>
                  <div style={{ fontSize: 11, color: "#7eb5e8", fontWeight: 700, marginBottom: 6 }}>AI Coaching Note</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>
                    "Revenue leakage at minute 4 — address pricing earlier."
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Agent: Sarah K. · Just analyzed</div>
                </div>
                </div>{/* end cta-float-cards */}

              </div>
            </div>

          </div>
        </section>
        </div>{/* end unified dark block */}

        {/* FOOTER — dark */}
        <footer style={{ background: isDark ? "#05080f" : "#080f1c", padding: "36px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/logo-512.png" alt="TalkScope" style={{ width: 28, height: 28, borderRadius: 8 }} />
              <span style={{ fontWeight: 800, fontSize: 15, color: "#ffffff" }}>TalkScope</span>
            </div>
            {/* Links */}
            <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { href: "/guide",    label: "Docs" },
                { href: "/terms",    label: "Terms" },
                { href: "/privacy",  label: "Privacy" },
                { href: "/security", label: "Security" },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>
                  {l.label}
                </Link>
              ))}
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>© 2026 TalkScope</span>
            </div>
            {/* CTA */}
            <Link href="/app/dashboard" style={{ fontSize: 13, color: "#7eb5e8", textDecoration: "none", fontWeight: 700 }}>
              Open App →
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
