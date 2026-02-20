"use client";

import Link from "next/link";

export default function DemoPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", border: "1px solid #e4e7ef", borderRadius: 24, padding: 40, boxShadow: "0 24px 60px rgba(11,18,32,0.10)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,rgba(64,97,132,0.25),rgba(64,97,132,0.7))", border: "1px solid rgba(64,97,132,0.4)" }} />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px", color: "#0b1220" }}>TalkScope</span>
        </div>

        {/* Live badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: 20 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>Live demo environment</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", color: "#0b1220", marginBottom: 12, lineHeight: 1.2 }}>
          See TalkScope in action
        </h1>
        <p style={{ fontSize: 15, color: "rgba(11,18,32,0.55)", lineHeight: 1.7, marginBottom: 32 }}>
          Explore a live workspace with real agents, conversations, AI scores, and pattern intelligence. No signup required.
        </p>

        {/* What you'll see */}
        <div style={{ background: "#f6f8fc", border: "1px solid #e4e7ef", borderRadius: 16, padding: 20, marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(11,18,32,0.4)", marginBottom: 14 }}>What you'll explore</div>
          {[
            { icon: "📊", text: "Operations dashboard with 8 real agents" },
            { icon: "🧠", text: "AI-generated scores and coaching priorities" },
            { icon: "📈", text: "Score history trends over 8 weeks" },
            { icon: "🎯", text: "Behavioral patterns and revenue signals" },
            { icon: "💬", text: "Real conversation transcripts with analysis" },
          ].map(item => (
            <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, fontSize: 14, color: "rgba(11,18,32,0.7)" }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href="/sign-in?redirect_url=/app/dashboard"
          style={{ display: "block", textAlign: "center", padding: "14px 24px", borderRadius: 14, background: "#406184", color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 16, marginBottom: 14, boxShadow: "0 8px 24px rgba(64,97,132,0.35)" }}
        >
          Enter Demo Dashboard →
        </a>

        <div style={{ textAlign: "center", fontSize: 13, color: "rgba(11,18,32,0.4)", marginBottom: 24 }}>
          Use demo credentials provided by your TalkScope contact
        </div>

        <div style={{ borderTop: "1px solid #e4e7ef", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 13, color: "#406184", textDecoration: "none", fontWeight: 600 }}>← Back to home</Link>
          <Link href="/sign-up" style={{ fontSize: 13, color: "rgba(11,18,32,0.5)", textDecoration: "none" }}>Create your account →</Link>
        </div>
      </div>
    </main>
  );
}
