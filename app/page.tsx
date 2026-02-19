import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>

      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,26,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,rgba(64,97,132,0.3),rgba(64,97,132,0.7))", border: "1px solid rgba(64,97,132,0.4)" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px" }}>TalkScope</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>Conversation Intelligence OS</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 6 }}>
            {["Features", "Use Cases", "Pricing"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`} style={{ padding: "6px 14px", borderRadius: 8, color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>{l}</a>
            ))}
          </nav>
          <Link href="/app/dashboard" style={{ padding: "9px 20px", borderRadius: 10, background: "#406184", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            Open App →
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: "rgba(64,97,132,0.15)", border: "1px solid rgba(64,97,132,0.3)", color: "#7eb5e8", fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            AI-Powered · Contact Center · Revenue Intelligence
          </div>
          <h1 style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 24, maxWidth: 800, margin: "0 auto 24px" }}>
            Turn every conversation<br />
            <span style={{ color: "#7eb5e8" }}>into revenue intelligence</span>
          </h1>
          <p style={{ fontSize: 18, color: "#64748b", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
            TalkScope analyzes agent conversations, detects behavioral patterns, scores performance, and tells you exactly why deals are won or lost.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/app/dashboard" style={{ padding: "13px 28px", borderRadius: 12, background: "#406184", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Open Dashboard
            </Link>
            <Link href="/app/upload" style={{ padding: "13px 28px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Import Your Data
            </Link>
          </div>
        </div>

        {/* MOCK DASHBOARD PREVIEW */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Avg Score", val: "74.2", color: "#eab308" },
              { label: "High Risk", val: "3", color: "#ef4444" },
              { label: "Top Performer", val: "92.1", color: "#22c55e" },
              { label: "Coaching Queue", val: "5", color: "#f97316" },
            ].map((k) => (
              <div key={k.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: "-0.04em" }}>{k.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Coaching Queue — Top Priority Agents</div>
            {[
              { name: "Sarah Mitchell", score: 74, risk: 42, priority: "High" },
              { name: "James Rodriguez", score: 61, risk: 71, priority: "Urgent" },
              { name: "Anna Chen", score: 58, risk: 65, priority: "Urgent" },
            ].map((a) => (
              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(64,97,132,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#7eb5e8" }}>
                  {a.name.split(" ").map((w) => w[0]).join("")}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: a.priority === "Urgent" ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.15)", color: a.priority === "Urgent" ? "#ef4444" : "#f97316", border: `1px solid ${a.priority === "Urgent" ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.3)"}` }}>{a.priority}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: a.score >= 70 ? "#22c55e" : a.score >= 60 ? "#eab308" : "#ef4444" }}>{a.score}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "80px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>Not call tracking. Intelligence.</h2>
            <p style={{ color: "#64748b", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>Everything you need to understand what's happening inside your conversations.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { icon: "🧠", title: "AI Conversation Scoring", desc: "Every conversation scored on communication, conversion, risk, and coaching priority." },
              { icon: "📊", title: "Pattern Intelligence", desc: "Detect repeating behavioral patterns, risk triggers, and conversion drivers across your team." },
              { icon: "🎯", title: "Revenue Leakage Detection", desc: "Find exactly where deals are lost, which phrases kill conversions, and who loses the most." },
              { icon: "📈", title: "Agent Performance Growth", desc: "Track score history, identify improvement areas, and prioritize coaching by ROI." },
              { icon: "📋", title: "Company Rules Engine", desc: "Upload your scripts and standards. AI scores against your actual requirements, not generic ones." },
              { icon: "⚡", title: "Batch & Real-Time Processing", desc: "Score hundreds of conversations at once or get instant analysis right after upload." },
            ].map((f) => (
              <div key={f.title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px" }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 750, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "80px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>Built for performance-driven teams</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {[
              { icon: "📞", title: "Contact Centers", desc: "Monitor agent quality at scale. Spot compliance risks before they become problems. Coach the right people at the right time." },
              { icon: "💼", title: "Sales Organizations", desc: "Understand why deals close or die. Identify the top performers' patterns and replicate them across the team." },
              { icon: "💰", title: "Collections & Recovery", desc: "Detect risk signals early. Find the phrases that increase payment rates. Reduce escalations." },
              { icon: "🏢", title: "Enterprise Support", desc: "Track de-escalation effectiveness, empathy quality, and resolution patterns across hundreds of agents." },
            ].map((u) => (
              <div key={u.title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px", display: "flex", gap: 20 }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>{u.icon}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 750, marginBottom: 8 }}>{u.title}</div>
                  <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{u.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "80px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>Ready to see what your conversations really do?</h2>
          <p style={{ color: "#64748b", fontSize: 16, marginBottom: 36 }}>Import your agents and transcripts. Get your first insights in minutes.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/app/dashboard" style={{ padding: "14px 32px", borderRadius: 12, background: "#406184", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Open Dashboard →
            </Link>
            <Link href="/app/upload" style={{ padding: "14px 32px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Import Data
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "28px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#406184" }}>TalkScope</div>
          <div style={{ fontSize: 13, color: "#334155" }}>© 2026 TalkScope · Conversation Intelligence OS</div>
          <Link href="/app/dashboard" style={{ fontSize: 13, color: "#406184", textDecoration: "none" }}>Open App →</Link>
        </div>
      </footer>

    </main>
  );
}
