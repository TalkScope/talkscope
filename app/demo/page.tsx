"use client";


import Link from "next/link";
import { useState } from "react";

const ACCENT = "#406184";
const DARK = "#0b1220";

export default function DemoPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleEnterDemo() {
    setStatus("loading");
    setError("");
    try {
      const r = await fetch("/api/demo-login", { method: "POST" });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Failed to create demo session");
      window.location.href = `/sign-in?__clerk_ticket=${data.token}&redirect_url=/app/dashboard`;
    } catch (e: any) {
      setError(e?.message || "Failed to enter demo");
      setStatus("error");
    }
  }

  const features = [
    { icon: "📊", title: "Operations Dashboard", desc: "Org-wide view with coaching queue, risk flags, and score trends" },
    { icon: "🧠", title: "AI Conversation Scoring", desc: "8 behavioral dimensions scored per conversation in seconds" },
    { icon: "🔍", title: "Pattern Intelligence", desc: "Recurring issues, conversion drivers, revenue leakage patterns" },
    { icon: "🎯", title: "Coaching Priority Engine", desc: "Prioritized list of agents who need intervention most urgently" },
  ];

  const stats = [
    { value: "8", label: "Agents" },
    { value: "100+", label: "Conversations" },
    { value: "6", label: "Modules" },
    { value: "3 min", label: "To first insight" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: DARK, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "55%", height: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,97,132,0.35) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "50%", height: "60%", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,97,132,0.2) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(64,97,132,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(64,97,132,0.04) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: ACCENT }} />
      <nav style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo-512.png" alt="TalkScope" width={32} height={32} style={{ borderRadius: 9 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: "white", letterSpacing: "-0.02em" }}>TalkScope</span>
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", padding: "6px 14px" }}>← Back</Link>
          <Link href="/sign-up" style={{ fontSize: 13, fontWeight: 700, color: "white", textDecoration: "none", padding: "7px 18px", borderRadius: 10, background: ACCENT }}>Create account</Link>
        </div>
      </nav>

      <div className="demo-grid" style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "60px 40px", display: "grid", gridTemplateColumns: "1fr 420px", gap: 60, alignItems: "start" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", marginBottom: 28 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Live demo — pre-loaded with real data</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px,4vw,54px)", fontWeight: 900, letterSpacing: "-0.03em", color: "white", lineHeight: 1.1, marginBottom: 20 }}>
            See exactly how<br /><span style={{ color: "#7eb5e8" }}>TalkScope works</span>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
            Explore a fully operational workspace. Real agents, real AI scores, real pattern intelligence — no setup, no signup needed.
          </p>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 48 }}>
            {stats.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 30, fontWeight: 900, color: "#7eb5e8", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {features.map(f => (
              <div key={f.title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "sticky", top: 40 }}>
          <div style={{ background: "rgba(15,24,42,0.95)", border: "1px solid rgba(64,97,132,0.35)", borderRadius: 24, padding: 36, boxShadow: "0 32px 80px rgba(0,0,0,0.5)", backdropFilter: "blur(20px)" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 6, letterSpacing: "-0.02em" }}>Enter live demo</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 24 }}>One click. No login. Full access with pre-loaded data.</div>
            {["Operations dashboard with 8 agents", "AI conversation scores & history", "Pattern Intelligence reports", "Revenue leakage signals", "Coaching priority queue"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(34,197,94,0.15)" /><path d="M8 12l3 3 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{item}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "22px 0" }} />
            {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button onClick={handleEnterDemo} disabled={status === "loading"} style={{ width: "100%", padding: "15px 24px", borderRadius: 14, background: status === "loading" ? "rgba(64,97,132,0.6)" : ACCENT, color: "white", border: "none", fontWeight: 800, fontSize: 16, cursor: status === "loading" ? "default" : "pointer", boxShadow: status === "loading" ? "none" : "0 8px 28px rgba(64,97,132,0.4)", fontFamily: "inherit", letterSpacing: "-0.01em" }}>
              {status === "loading" ? "Preparing workspace…" : "Enter live demo →"}
            </button>
            <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Read-only · No credit card · No signup</div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "20px 0" }} />
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Ready to use your own data? </span>
              <Link href="/sign-up" style={{ fontSize: 13, fontWeight: 700, color: "#7eb5e8", textDecoration: "none" }}>Create free account →</Link>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>3 seconds to score a conversation</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>No waiting. AI insights appear instantly.</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .demo-grid { grid-template-columns: 1fr !important; padding: 32px 20px !important; gap: 32px !important; }
          .demo-grid > div:last-child { position: static !important; }
          nav { padding: 16px 20px !important; }
        }
        @media (max-width: 480px) {
          .demo-grid > div > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
