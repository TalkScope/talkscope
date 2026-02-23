import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — TalkScope",
  description: "TalkScope pricing starts at $49/mo for small teams. Full conversation intelligence, AI scoring, pattern detection, and coaching — no enterprise contract required.",
  alternates: { canonical: "https://talk-scope.com/pricing" },
  openGraph: {
    title: "TalkScope Pricing — From $49/mo",
    description: "Conversation intelligence for contact centers. AI scoring, pattern detection, revenue leakage — starting at $49/mo.",
    url: "https://talk-scope.com/pricing",
  },
};

const ACCENT = "#406184";

const plans = [
  {
    name: "Starter",
    price: "$49",
    per: "/mo",
    desc: "Perfect for small teams getting started with conversation intelligence.",
    features: [
      "Up to 5 agents",
      "500 conversations / mo",
      "AI scoring & patterns",
      "Basic coaching queue",
      "Email support",
    ],
    cta: "Get started",
    ctaHref: "/sign-up",
    primary: false,
  },
  {
    name: "Growth",
    price: "$199",
    per: "/mo",
    desc: "For growing contact centers that need full performance intelligence.",
    features: [
      "Up to 25 agents",
      "5,000 conversations / mo",
      "Everything in Starter",
      "Batch scoring engine",
      "Revenue leakage detection",
      "Coaching priority engine",
      "Audio transcription (Whisper)",
      "Priority support",
    ],
    cta: "Get started",
    ctaHref: "/sign-up",
    primary: true,
    badge: "Most popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "",
    desc: "Full platform for large operations with advanced needs.",
    features: [
      "Unlimited agents",
      "Unlimited conversations",
      "Everything in Growth",
      "Multi-team intelligence",
      "Custom AI rules engine",
      "SSO / SAML",
      "Dedicated success manager",
      "SLA & compliance docs",
    ],
    cta: "Contact us",
    ctaHref: "mailto:hello@talk-scope.com",
    primary: false,
  },
];

const faq = [
  { q: "Can I try before I pay?", a: "Yes — explore the live demo with 8 agents and 100+ pre-loaded conversations, no login required. Or sign up free and upload your own data." },
  { q: "What counts as a conversation?", a: "Any single transcript uploaded — whether a text file or audio recording. Batch-uploaded files each count as one conversation." },
  { q: "Do you support audio calls?", a: "Yes. Upload MP3, WAV, or M4A files and TalkScope transcribes them via OpenAI Whisper, then scores the result. Audio is never stored." },
  { q: "Can I change plans later?", a: "Absolutely. Upgrade or downgrade any time. Changes take effect at your next billing cycle." },
  { q: "Is there a contract?", a: "No. All plans are monthly, cancel anytime. Enterprise can include an annual option with a discount." },
  { q: "How does the AI scoring work?", a: "The AI reads the full transcript and evaluates 8 behavioral dimensions: rapport building, discovery, objection handling, empathy, closing, compliance, and risk signals." },
];

export default function PricingPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b1220", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: "white" }}>
      {/* Mesh BG */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-5%", right: "-5%", width: "50%", height: "60%", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,97,132,0.3) 0%, transparent 70%)", filter: "blur(90px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-5%", width: "40%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(64,97,132,0.18) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* Top bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: ACCENT, zIndex: 50 }} />

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(11,18,32,0.8)", backdropFilter: "blur(12px)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo-512.png" alt="TalkScope" width={30} height={30} style={{ borderRadius: 9 }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: "white", letterSpacing: "-0.02em" }}>TalkScope</span>
        </Link>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/demo" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "6px 14px" }}>Live demo</Link>
          <Link href="/sign-up" style={{ fontSize: 13, fontWeight: 700, color: "white", textDecoration: "none", padding: "7px 18px", borderRadius: 10, background: ACCENT }}>Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "80px 24px 60px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: "rgba(64,97,132,0.15)", border: "1px solid rgba(64,97,132,0.3)", fontSize: 12, fontWeight: 700, color: "#7eb5e8", marginBottom: 20 }}>
          PRICING
        </div>
        <h1 style={{ fontSize: "clamp(32px,5vw,58px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.08, marginBottom: 18 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", maxWidth: 440, margin: "0 auto 16px" }}>
          Start free. Scale as your team grows. No enterprise contract required.
        </p>
        <Link href="/demo" style={{ fontSize: 14, color: "#7eb5e8", textDecoration: "none", fontWeight: 600 }}>
          Try live demo first → no signup needed
        </Link>
      </section>

      {/* Plans */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1060, margin: "0 auto", padding: "0 24px 80px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            background: plan.primary ? ACCENT : "rgba(255,255,255,0.04)",
            border: `1px solid ${plan.primary ? ACCENT : "rgba(255,255,255,0.1)"}`,
            borderRadius: 24, padding: 32, position: "relative",
            boxShadow: plan.primary ? `0 28px 70px rgba(64,97,132,0.45)` : "none",
            transform: plan.primary ? "translateY(-8px)" : "none",
          }}>
            {plan.badge && (
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", padding: "5px 18px", borderRadius: 20, background: "#22c55e", color: "white", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
                {plan.badge}
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 800, color: plan.primary ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>{plan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 12 }}>
              <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.05em" }}>{plan.price}</span>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>{plan.per}</span>
            </div>
            <p style={{ fontSize: 13, color: plan.primary ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.45)", lineHeight: 1.65, marginBottom: 24, minHeight: 44 }}>{plan.desc}</p>
            <Link href={plan.ctaHref} style={{
              display: "block", textAlign: "center", padding: "12px 20px", borderRadius: 12,
              background: plan.primary ? "white" : "rgba(255,255,255,0.1)",
              color: plan.primary ? ACCENT : "white",
              textDecoration: "none", fontWeight: 800, fontSize: 14, marginBottom: 24,
              border: plan.primary ? "none" : "1px solid rgba(255,255,255,0.15)",
            }}>
              {plan.cta}
            </Link>
            <div style={{ borderTop: `1px solid ${plan.primary ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, color: plan.primary ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.55)" }}>
                  <span style={{ color: "#86efac", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Feature comparison */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto 80px", padding: "0 24px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 32 }}>Everything included</h2>
        {[
          { label: "Core features", items: ["AI conversation scoring", "Sentiment & emotion analysis", "Objection tracking", "Coaching priority queue", "Company rules engine"] },
          { label: "Intelligence", items: ["Pattern Intelligence Engine", "Revenue leakage detection", "Conversion driver analysis", "Risk trigger identification", "Executive summary reports"] },
          { label: "Data & security", items: ["PII auto-redaction", "Audio transcription (Whisper)", "Org-isolated data queries", "Encrypted at rest", "Multi-tenant architecture"] },
        ].map(group => (
          <div key={group.label} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#7eb5e8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>{group.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {group.items.map(item => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(34,197,94,0.15)" /><path d="M8 12l3 3 5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto 80px", padding: "0 24px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 32 }}>Common questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {faq.map(({ q, a }) => (
            <div key={q} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 8 }}>{q}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", background: "rgba(64,97,132,0.12)", border: "1px solid rgba(64,97,132,0.25)", borderRadius: 24, padding: "48px 40px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>Ready to start?</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>Try the live demo or create your workspace in 2 minutes.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" style={{ padding: "12px 28px", borderRadius: 12, background: ACCENT, color: "white", textDecoration: "none", fontWeight: 800, fontSize: 15, boxShadow: "0 8px 28px rgba(64,97,132,0.4)" }}>
              Get started free
            </Link>
            <Link href="/demo" style={{ padding: "12px 28px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)", textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
              Try live demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.07)", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", textDecoration: "none", padding: "10px 0", minHeight: 44, display: "inline-flex", alignItems: "center" }}>← TalkScope</Link>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>© {new Date().getFullYear()} TalkScope</span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[["About", "/about"], ["Privacy", "/privacy"], ["Security", "/security"], ["Guide", "/guide"]].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", padding: "10px 10px", minHeight: 44, display: "inline-flex", alignItems: "center", borderRadius: 8 }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          section:nth-of-type(3) { grid-template-columns: 1fr !important; }
          nav { padding: 14px 20px !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
        }
        @media (max-width: 640px) {
          section:nth-of-type(5) div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
