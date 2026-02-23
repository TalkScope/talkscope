export default function SecurityPage() {
  const accent = "#406184";
  const ink = "#0b1220";
  const muted = "rgba(11,18,32,0.55)";
  const border = "#e4e7ef";
  const soft = "#f6f8fc";

  const pillars = [
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      title: "PII Auto-Redaction",
      color: "#22c55e",
      desc: "Every transcript is scanned before storage. Credit cards, phone numbers, emails, SSNs, passwords — all replaced with safe placeholders automatically. Your customers' sensitive data never touches our database.",
      items: ["Credit card numbers → [CARD-REDACTED]", "Phone numbers → [PHONE-REDACTED]", "Email addresses → [EMAIL-REDACTED]", "SSN, bank accounts, passwords"],
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
      title: "Multi-Tenant Isolation",
      color: "#406184",
      desc: "Every database query is scoped to your organization ID. It is architecturally impossible for data from one workspace to appear in another. Isolation is enforced at the code level on every single API endpoint.",
      items: ["Organization-scoped queries everywhere", "No shared data between customers", "Verified on every API call", "Clerk-authenticated sessions"],
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
      title: "Encryption in Transit",
      color: "#8b5cf6",
      desc: "All data between your browser and our servers is encrypted using TLS 1.3 — the latest and most secure transport protocol available. This includes API calls, file uploads, and authentication.",
      items: ["TLS 1.3 on all connections", "HTTPS enforced, no HTTP fallback", "Secure WebSocket for real-time", "HSTS headers enabled"],
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
      title: "Audio Never Stored",
      color: "#f59e0b",
      desc: "When you upload audio files, they are sent directly to OpenAI Whisper for transcription and immediately discarded. Only the resulting text transcript is saved — and only after PII redaction.",
      items: ["Audio sent to Whisper, then deleted", "Only transcript text is stored", "PII redacted before transcript is saved", "OpenAI does not train on API data"],
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18"/><path d="M9 22V12h6v10"/><path d="M3 22h18"/><path d="M7 7h1"/><path d="M7 11h1"/><path d="M16 7h1"/><path d="M16 11h1"/></svg>,
      title: "Enterprise Infrastructure",
      color: "#ef4444",
      desc: "TalkScope is built on infrastructure trusted by thousands of enterprise companies worldwide. Every provider we use holds SOC 2 Type II certification.",
      items: ["Neon PostgreSQL — SOC 2 Type II", "Vercel — SOC 2 Type II", "Clerk Auth — SOC 2 Type II, GDPR", "AWS underlying infrastructure"],
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
      title: "Your Data, Your Control",
      color: "#06b6d4",
      desc: "You own your data. Delete individual conversations, agents, teams, or your entire organization at any time. Deletion is permanent, cascading, and takes effect immediately.",
      items: ["Delete conversations instantly", "Delete agents + all their data", "Delete organization — removes everything", "Account deletion within 30 days"],
    },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: soft, minHeight: "100vh" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #0b1220 0%, #1a2d45 100%)`, padding: "56px 24px 48px", textAlign: "center" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, textDecoration: "none" }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 }}>← Back to TalkScope</span>
        </a>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(64,97,132,0.3)", border: "1px solid rgba(64,97,132,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#7eb5e8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div></div>
        <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>
          Security & Data Protection
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7 }}>
          TalkScope is built with a security-first architecture. Your conversations contain sensitive business data — we treat them that way.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "PII Auto-Redacted", bg: "rgba(34,197,94,0.2)", color: "#86efac" },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>, text: "Multi-Tenant Isolated", bg: "rgba(64,97,132,0.3)", color: "#93c5fd" },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>, text: "Audio Never Stored", bg: "rgba(245,158,11,0.2)", color: "#fcd34d" },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, text: "GDPR Compliant", bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" },
          ].map(b => (
            <span key={b.text} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: b.bg, color: b.color }}>{b.icon}{b.text}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Security pillars grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 48 }}>
          {pillars.map(p => (
            <div key={p.title} style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${border}`, background: `${p.color}08` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${p.color}15`, border: `1px solid ${p.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {p.icon}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: ink }}>{p.title}</div>
                </div>
                <p style={{ fontSize: 13, color: muted, lineHeight: 1.7 }}>{p.desc}</p>
              </div>
              <div style={{ padding: "14px 20px" }}>
                {p.items.map(item => (
                  <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0", fontSize: 12, color: ink, borderBottom: `1px solid ${border}` }}>
                    <span style={{ color: p.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span style={{ fontFamily: item.includes("→") ? "monospace" : "inherit", opacity: 0.75 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Data flow diagram */}
        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 16, padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: ink, marginBottom: 6, letterSpacing: "-0.02em" }}>How Your Data Flows</h2>
          <p style={{ fontSize: 13, color: muted, marginBottom: 24 }}>Every transcript goes through this pipeline before being stored</p>

          <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap" }}>
            {[
              { step: "1", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>, label: "You upload", desc: "Transcript or audio file", color: accent },
              { step: "→", icon: "", label: "", desc: "", color: "transparent", arrow: true },
              { step: "2", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: "PII Scan", desc: "Cards, phones, emails removed", color: "#22c55e" },
              { step: "→", icon: "", label: "", desc: "", color: "transparent", arrow: true },
              { step: "3", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.91 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.91 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"/></svg>, label: "AI Analysis", desc: "OpenAI scores conversation", color: "#8b5cf6" },
              { step: "→", icon: "", label: "", desc: "", color: "transparent", arrow: true },
              { step: "4", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>, label: "Safe Storage", desc: "Redacted transcript saved", color: "#f59e0b" },
            ].map((s, i) => s.arrow ? (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 8px", color: muted, fontSize: 20, fontWeight: 300 }}>→</div>
            ) : (
              <div key={i} style={{ flex: 1, minWidth: 120, padding: "16px 14px", borderRadius: 12, background: `${s.color}08`, border: `1px solid ${s.color}20`, textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: s.color, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: muted, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 13, color: ink }}>
            <strong style={{ color: "#16a34a" }}>Key guarantee:</strong> Sensitive data is redacted in Step 2, before it ever reaches our database in Step 4. The raw unredacted text exists only in server memory for milliseconds.
          </div>
        </div>

        {/* Infrastructure table */}
        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 16, padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: ink, marginBottom: 6, letterSpacing: "-0.02em" }}>Infrastructure & Certifications</h2>
          <p style={{ fontSize: 13, color: muted, marginBottom: 20 }}>Every provider in our stack holds enterprise-grade security certifications</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: ink }}>
                  {["Provider", "Role", "Certifications", "Data Center"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", color: "#fff", fontWeight: 700, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Neon", "PostgreSQL Database", "SOC 2 Type II, ISO 27001", "AWS us-east-1"],
                  ["Vercel", "App Hosting & CDN", "SOC 2 Type II", "AWS + Cloudflare"],
                  ["Clerk", "Authentication", "SOC 2 Type II, GDPR, CCPA", "AWS"],
                  ["OpenAI", "AI Scoring + Whisper STT", "SOC 2 Type II", "Microsoft Azure"],
                ].map(([provider, role, certs, dc], i) => (
                  <tr key={provider} style={{ background: i % 2 === 0 ? "#fff" : soft }}>
                    <td style={{ padding: "10px 14px", fontWeight: 800, color: accent }}>{provider}</td>
                    <td style={{ padding: "10px 14px", color: ink }}>{role}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {certs.split(", ").map(c => (
                          <span key={c} style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(34,197,94,0.1)", color: "#16a34a", fontSize: 11, fontWeight: 700 }}>{c}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", color: muted, fontSize: 12 }}>{dc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report vulnerability */}
        <div style={{ background: `linear-gradient(135deg, #0b1220, #1a2d45)`, borderRadius: 16, padding: 28, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7eb5e8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg></div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 8 }}>Found a security issue?</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 18, maxWidth: 420, margin: "0 auto 18px" }}>
            We take security reports seriously and respond within 48 hours. Please disclose responsibly.
          </p>
          <a href="mailto:security@talk-scope.com" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 10, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> security@talk-scope.com
          </a>
        </div>

        {/* Footer links */}
        <div style={{ marginTop: 32, textAlign: "center", display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>← Home</a>
          <a href="/about"   style={{ fontSize: 13, color: muted, textDecoration: "none", padding: "10px 12px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>About</a>
          <a href="/guide"   style={{ fontSize: 13, color: muted, textDecoration: "none", padding: "10px 12px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>Documentation</a>
          <a href="/privacy" style={{ fontSize: 13, color: muted, textDecoration: "none", padding: "10px 12px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>Privacy Policy</a>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: muted }}>© 2026 TalkScope</div>
      </div>
    </div>
  );
}
