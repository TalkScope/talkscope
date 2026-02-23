import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — TalkScope",
  description: "TalkScope Privacy Policy. We never sell your data, auto-redact PII from all transcripts, and give you full control over your data at any time.",
  alternates: { canonical: "https://talk-scope.com/privacy" },
  openGraph: {
    title: "Privacy Policy — TalkScope",
    description: "TalkScope Privacy Policy. We never sell your data, auto-redact PII from all transcripts, and give you full control over your data at any time.",
    url: "https://talk-scope.com/privacy",
    siteName: "TalkScope",
    type: "website",
  },
};

export default function PrivacyPage() {
  const accent = "#406184";
  const ink = "#0b1220";
  const muted = "rgba(11,18,32,0.55)";
  const border = "#e4e7ef";
  const soft = "#f6f8fc";
  const updated = "February 20, 2026";

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: soft, minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pp-h2 { font-size: 18px; font-weight: 800; color: ${ink}; margin: 36px 0 10px; letter-spacing: -0.02em; padding-top: 8px; border-top: 1px solid ${border}; }
        .pp-h3 { font-size: 14px; font-weight: 700; color: ${ink}; margin: 18px 0 6px; }
        .pp-p  { font-size: 14px; color: rgba(11,18,32,0.7); line-height: 1.85; margin-bottom: 10px; }
        .pp-li { font-size: 14px; color: rgba(11,18,32,0.7); line-height: 1.85; margin-bottom: 6px; padding-left: 16px; position: relative; }
        .pp-li::before { content: "→"; position: absolute; left: 0; color: ${accent}; font-weight: 700; }
        .pp-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
      `}</style>

      {/* Header */}
      <div style={{ background: accent, padding: "52px 24px 44px", textAlign: "center" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, textDecoration: "none" }}>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600 }}>← Back to TalkScope</span>
        </a>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><div style={{ width:52, height:52, borderRadius:14, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div></div>
        <h1 style={{ color: "#fff", fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 10 }}>Privacy Policy</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, maxWidth: 480, margin: "0 auto 20px" }}>
          We take your data seriously. This policy explains exactly what we collect, how we protect it, and what rights you have.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, text: "GDPR compliant", bg: "rgba(34,197,94,0.2)", color: "#86efac" },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "PII auto-redacted", bg: "rgba(255,255,255,0.15)", color: "#fff" },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, text: `Last updated: ${updated}`, bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)" },
          ].map(b => (
            <span key={b.text} className="pp-badge" style={{ background: b.bg, color: b.color, gap: 6 }}>
              {b.icon} {b.text}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* TL;DR box */}
        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 32, borderLeft: `4px solid ${accent}` }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: accent, marginBottom: 12 }}>TL;DR — Plain English Summary</div>
          {[
            "We automatically remove credit cards, phone numbers, emails, and other PII from transcripts before they're stored",
            "We never sell your data to third parties — ever",
            "Your workspace is fully isolated — no other customer can see your data",
            "You can delete all your data at any time from Settings",
            "We use OpenAI Whisper for audio transcription — audio is not stored after transcription",
            "You own your data — we're just the tool that processes it",
          ].map((item, i) => (
            <div key={i} className="pp-li" style={{ marginBottom: 8 }}>{item}</div>
          ))}
        </div>

        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 16, padding: 32 }}>

          <h2 className="pp-h2" style={{ borderTop: "none", marginTop: 0 }}>1. Who We Are</h2>
          <p className="pp-p">
            TalkScope ("we", "our", "us") is a conversation intelligence platform operated at talk-scope.com.
            We provide AI-powered analysis of business conversations to help organizations improve agent performance,
            coaching effectiveness, and revenue outcomes.
          </p>
          <p className="pp-p">
            For privacy-related questions, contact us at: <strong>privacy@talk-scope.com</strong>
          </p>

          <h2 className="pp-h2">2. What Data We Collect</h2>

          <h3 className="pp-h3">Account Data</h3>
          <p className="pp-p">When you create an account we collect:</p>
          {["Email address", "Name (optional)", "Organization name", "Password (hashed, never stored in plaintext)"].map((i, k) => <div key={k} className="pp-li">{i}</div>)}

          <h3 className="pp-h3" style={{ marginTop: 16 }}>Conversation Data</h3>
          <p className="pp-p">When you upload conversations we collect:</p>
          {[
            "Transcript text — after automatic PII redaction (see Section 4)",
            "AI-generated scores and analysis (stored as structured JSON)",
            "Agent metadata: name, email, team assignment",
            "Upload timestamp",
          ].map((i, k) => <div key={k} className="pp-li">{i}</div>)}

          <h3 className="pp-h3" style={{ marginTop: 16 }}>Usage Data</h3>
          <p className="pp-p">We automatically collect basic usage data:</p>
          {[
            "Pages visited and features used",
            "Browser type and device type",
            "IP address (used for rate limiting, not stored long-term)",
            "Error logs (no personal data included)",
          ].map((i, k) => <div key={k} className="pp-li">{i}</div>)}

          <h2 className="pp-h2">3. Audio Files</h2>
          <p className="pp-p">
            When you upload audio files for transcription, the file is sent to <strong>OpenAI Whisper API</strong> for
            speech-to-text conversion. The audio file itself is <strong>never stored</strong> on our servers —
            only the resulting transcript text is saved, and only after PII redaction has been applied.
          </p>
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 13, color: ink, marginTop: 12 }}>
            <strong style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Note on OpenAI:</strong> Audio files are processed by OpenAI under their{" "}
            <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener" style={{ color: accent }}>Privacy Policy</a>.
            OpenAI states they do not use API data to train their models.
          </div>

          <h2 className="pp-h2">4. PII Automatic Redaction</h2>
          <p className="pp-p">
            Before any transcript is saved to our database, TalkScope's <strong>PII Redaction Engine</strong> automatically
            scans and removes sensitive personal data. This happens server-side before storage — the raw data is never persisted.
          </p>
          <p className="pp-p">The following data is automatically redacted:</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "12px 0 16px" }}>
            {[
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label: "Credit & debit card numbers", replace: "[CARD-REDACTED]" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.34h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.9z"/></svg>, label: "Phone numbers", replace: "[PHONE-REDACTED]" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label: "Email addresses", replace: "[EMAIL-REDACTED]" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M15 11h4"/><path d="M15 14h2"/></svg>, label: "Social Security Numbers", replace: "[SSN-REDACTED]" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18"/><path d="M9 22V12h6v10"/><path d="M3 22h18"/></svg>, label: "Bank account numbers", replace: "[ACCOUNT-REDACTED]" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>, label: "Passwords and PINs", replace: "[CREDENTIAL-REDACTED]" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: "Dates of birth", replace: "[DOB-REDACTED]" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, label: "IP addresses", replace: "[IP-REDACTED]" },
            ].map(item => (
              <div key={item.label} style={{ padding: "10px 12px", borderRadius: 10, background: soft, border: `1px solid ${border}`, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, display:"flex", alignItems:"center" }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ink }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: muted, fontFamily: "monospace", marginTop: 2 }}>{item.replace}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="pp-p">
            This means even if a customer accidentally says their credit card number during a call,
            it will be replaced with <code style={{ background: soft, padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>[CARD-REDACTED]</code> before the transcript reaches our database.
          </p>

          <h2 className="pp-h2">5. How We Use Your Data</h2>
          <p className="pp-p">We use your data exclusively to:</p>
          {[
            "Provide the TalkScope service — scoring, analysis, pattern detection, coaching recommendations",
            "Authenticate your account and maintain session security",
            "Send transactional emails (account confirmation, password reset)",
            "Improve our AI models — only with your explicit opt-in consent (default: off)",
            "Monitor system performance and fix bugs",
          ].map((i, k) => <div key={k} className="pp-li">{i}</div>)}
          <p className="pp-p" style={{ marginTop: 12 }}>
            <strong>We never use your data for advertising. We never sell your data. Period.</strong>
          </p>

          <h2 className="pp-h2">6. Data Storage & Security</h2>
          <h3 className="pp-h3">Infrastructure</h3>
          {[
            "Database: Neon PostgreSQL — hosted on AWS, SOC 2 Type II certified",
            "Application: Vercel — hosted on AWS/Cloudflare edge network",
            "Authentication: Clerk — SOC 2 Type II, GDPR compliant",
            "All data in transit is encrypted with TLS 1.3",
          ].map((i, k) => <div key={k} className="pp-li">{i}</div>)}

          <h3 className="pp-h3" style={{ marginTop: 16 }}>Multi-Tenant Isolation</h3>
          <p className="pp-p">
            Every database query is scoped to your organization ID. It is architecturally impossible
            for one customer's data to appear in another customer's account. Isolation is enforced
            at the query level on every API endpoint.
          </p>

          <h2 className="pp-h2">7. Data Retention</h2>
          <p className="pp-p">
            We retain your data for as long as your account is active. If you delete your account,
            all associated data — organizations, teams, agents, conversations, scores, and patterns —
            is permanently deleted within 30 days. Deletion is cascading and irreversible.
          </p>
          <p className="pp-p">
            You can manually delete individual conversations, agents, or your entire organization at any time
            from the Settings page without deleting your account.
          </p>

          <h2 className="pp-h2">8. Your Rights (GDPR)</h2>
          <p className="pp-p">If you are in the European Economic Area, you have the right to:</p>
          {[
            "Access — request a copy of all data we hold about you",
            "Rectification — correct inaccurate personal data",
            "Erasure — request deletion of your personal data ('right to be forgotten')",
            "Portability — receive your data in a machine-readable format",
            "Restriction — request we limit how we process your data",
            "Object — opt out of certain types of processing",
            "Withdraw consent — at any time, without affecting prior processing",
          ].map((i, k) => <div key={k} className="pp-li">{i}</div>)}
          <p className="pp-p" style={{ marginTop: 12 }}>
            To exercise any of these rights, email <strong>privacy@talk-scope.com</strong>. We will respond within 30 days.
          </p>

          <h2 className="pp-h2">9. Cookies</h2>
          <p className="pp-p">
            We use only essential cookies necessary to operate the service:
          </p>
          {[
            "Session cookies — to keep you logged in (managed by Clerk)",
            "CSRF tokens — to protect against cross-site request forgery",
          ].map((i, k) => <div key={k} className="pp-li">{i}</div>)}
          <p className="pp-p" style={{ marginTop: 12 }}>
            We do not use advertising cookies, third-party tracking pixels, or analytics that identify individual users.
          </p>

          <h2 className="pp-h2">10. Third-Party Services</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: accent }}>
                  {["Service", "Purpose", "Data shared", "Policy"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", color: "#fff", fontWeight: 700, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Clerk", "Authentication", "Email, name", "clerk.com/legal/privacy"],
                  ["Neon", "Database hosting", "All app data", "neon.tech/privacy"],
                  ["Vercel", "App hosting", "Request logs", "vercel.com/legal/privacy"],
                  ["OpenAI", "Whisper STT, AI scoring", "Transcripts, audio", "openai.com/policies/privacy"],
                ].map(([svc, purpose, data, policy], i) => (
                  <tr key={svc} style={{ background: i % 2 === 0 ? "#fff" : soft }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: accent }}>{svc}</td>
                    <td style={{ padding: "8px 12px", color: ink }}>{purpose}</td>
                    <td style={{ padding: "8px 12px", color: muted }}>{data}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <a href={`https://${policy}`} target="_blank" rel="noopener" style={{ color: accent, fontSize: 11 }}>↗ View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="pp-h2">11. Children's Privacy</h2>
          <p className="pp-p">
            TalkScope is a B2B enterprise product not intended for use by individuals under 16 years of age.
            We do not knowingly collect data from children.
          </p>

          <h2 className="pp-h2">12. Changes to This Policy</h2>
          <p className="pp-p">
            We may update this policy to reflect changes in our practices or legal requirements.
            We will notify you by email at least 14 days before any material changes take effect.
            Continued use of TalkScope after the effective date constitutes acceptance of the updated policy.
          </p>

          <h2 className="pp-h2">13. Contact</h2>
          <p className="pp-p">For any privacy-related questions or requests:</p>
          <div style={{ padding: "16px 20px", borderRadius: 12, background: soft, border: `1px solid ${border}`, fontSize: 13, color: ink, lineHeight: 2 }}>
            <strong>TalkScope Privacy Team</strong><br />
            Email: privacy@talk-scope.com<br />
            Response time: within 30 days<br />
            For urgent data deletion requests: within 72 hours
          </div>

        </div>

        {/* Footer links */}
        <div style={{ marginTop: 32, textAlign: "center", display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>← Home</a>
          <a href="/about"    style={{ fontSize: 13, color: muted, textDecoration: "none", padding: "10px 12px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>About</a>
          <a href="/guide"    style={{ fontSize: 13, color: muted, textDecoration: "none", padding: "10px 12px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>Documentation</a>
          <a href="/security" style={{ fontSize: 13, color: muted, textDecoration: "none", padding: "10px 12px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>Security</a>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: muted }}>
          © 2026 TalkScope · Last updated {updated}
        </div>
      </div>
    </div>
  );
}
