export default function TermsPage() {
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
        .t-h2 { font-size: 18px; font-weight: 800; color: ${ink}; margin: 36px 0 10px; letter-spacing: -0.02em; padding-top: 8px; border-top: 1px solid ${border}; }
        .t-h3 { font-size: 14px; font-weight: 700; color: ${ink}; margin: 18px 0 6px; }
        .t-p  { font-size: 14px; color: rgba(11,18,32,0.7); line-height: 1.85; margin-bottom: 10px; }
        .t-li { font-size: 14px; color: rgba(11,18,32,0.7); line-height: 1.85; margin-bottom: 6px; padding-left: 16px; position: relative; }
        .t-li::before { content: "→"; position: absolute; left: 0; color: ${accent}; font-weight: 700; }
        a { color: ${accent}; }
      `}</style>

      {/* Header */}
      <div style={{ background: ink, padding: "52px 24px 44px", textAlign: "center" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, textDecoration: "none" }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 }}>← Back to TalkScope</span>
        </a>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
        <h1 style={{ color: "#fff", fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 10 }}>Terms of Service</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.7 }}>
          Please read these terms carefully before using TalkScope. By creating an account, you agree to be bound by these terms.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: "📅", text: `Effective: ${updated}` },
            { icon: "🌍", text: "Governing law: International" },
            { icon: "📧", text: "Questions: legal@talk-scope.com" },
          ].map(b => (
            <span key={b.text} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)" }}>
              {b.icon} {b.text}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* TL;DR */}
        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 32, borderLeft: `4px solid ${accent}` }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: accent, marginBottom: 12 }}>TL;DR — Plain English Summary</div>
          {[
            "TalkScope is a paid SaaS service — free trial available, then subscription required",
            "You own your data — we process it to provide the service, nothing more",
            "Don't use TalkScope for illegal purposes or to harm others",
            "We can suspend accounts that violate these terms",
            "Our liability is limited to the amount you paid us in the last 3 months",
            "We may update these terms with 14 days notice",
          ].map((item, i) => (
            <div key={i} className="t-li" style={{ marginBottom: 8 }}>{item}</div>
          ))}
        </div>

        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 16, padding: 32 }}>

          <h2 className="t-h2" style={{ borderTop: "none", marginTop: 0 }}>1. Acceptance of Terms</h2>
          <p className="t-p">
            By accessing or using TalkScope ("Service", "Platform"), operated at talk-scope.com, you ("User", "Customer", "you") agree to be bound by these Terms of Service ("Terms"). If you are using TalkScope on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
          </p>
          <p className="t-p">
            If you do not agree to these Terms, do not use TalkScope. Your continued use of the Service constitutes ongoing acceptance of any updates to these Terms.
          </p>

          <h2 className="t-h2">2. Description of Service</h2>
          <p className="t-p">
            TalkScope is an AI-powered conversation intelligence platform that provides agent performance scoring, behavioral pattern detection, coaching recommendations, and revenue intelligence for contact centers, sales organizations, and collections teams.
          </p>
          <p className="t-p">The Service includes:</p>
          {[
            "AI-powered conversation analysis and scoring",
            "Agent performance dashboards and reporting",
            "Pattern intelligence and behavioral analytics",
            "Audio transcription via OpenAI Whisper",
            "Coaching priority recommendations",
            "Batch processing and automation tools",
          ].map((item, i) => <div key={i} className="t-li">{item}</div>)}

          <h2 className="t-h2">3. Accounts and Registration</h2>
          <h3 className="t-h3">Account Creation</h3>
          <p className="t-p">
            To use TalkScope, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
          </p>
          <h3 className="t-h3">Account Security</h3>
          <p className="t-p">
            You must notify us immediately at <strong>security@talk-scope.com</strong> if you suspect unauthorized access to your account. TalkScope is not liable for losses resulting from unauthorized use of your account where you failed to notify us promptly.
          </p>
          <h3 className="t-h3">Demo Account</h3>
          <p className="t-p">
            TalkScope offers a demo account for evaluation purposes. The demo account contains pre-loaded sample data and has restricted functionality. Data uploaded to the demo account may be visible to other demo users and is not private. Do not upload confidential or real customer data to the demo account.
          </p>

          <h2 className="t-h2">4. Subscriptions and Payment</h2>
          <h3 className="t-h3">Subscription Plans</h3>
          <p className="t-p">
            TalkScope offers subscription plans as described on our pricing page. Plans are billed monthly or annually in advance. Prices are in USD and exclude applicable taxes.
          </p>
          <h3 className="t-h3">Free Trial</h3>
          <p className="t-p">
            We may offer a free trial period. At the end of the trial, your account will automatically convert to a paid subscription unless you cancel before the trial ends. We will notify you before any charges occur.
          </p>
          <h3 className="t-h3">Payment Processing</h3>
          <p className="t-p">
            Payments are processed by our third-party payment provider. By providing payment information, you authorize us to charge your payment method for all fees due. All fees are non-refundable except as expressly stated in these Terms.
          </p>
          <h3 className="t-h3">Refund Policy</h3>
          <p className="t-p">
            If you are not satisfied with TalkScope within the first 14 days of your first paid subscription, contact us at <strong>billing@talk-scope.com</strong> for a full refund. After 14 days, fees are non-refundable. Annual subscriptions cancelled mid-term are not eligible for prorated refunds.
          </p>
          <h3 className="t-h3">Price Changes</h3>
          <p className="t-p">
            We may change subscription prices with 30 days advance notice. Price changes take effect at your next billing cycle. Continued use after a price change constitutes acceptance of the new price.
          </p>

          <h2 className="t-h2">5. Acceptable Use</h2>
          <p className="t-p">You agree to use TalkScope only for lawful purposes. You must not:</p>
          {[
            "Upload conversations without obtaining required consent from all parties under applicable law (e.g. two-party consent states/countries)",
            "Process conversations containing data of minors under 16 years of age",
            "Use TalkScope to harass, discriminate against, or harm individuals",
            "Attempt to reverse engineer, decompile, or extract TalkScope's AI models or source code",
            "Share your account credentials with unauthorized third parties",
            "Use TalkScope to build a competing product or service",
            "Upload malicious files, viruses, or code designed to disrupt the Service",
            "Circumvent usage limits or access controls",
            "Use automated scripts to scrape or bulk-extract data beyond normal API usage",
          ].map((item, i) => <div key={i} className="t-li">{item}</div>)}
          <p className="t-p" style={{ marginTop: 12 }}>
            <strong>Call Recording Consent:</strong> You are solely responsible for ensuring you have obtained all legally required consents before recording and uploading conversations to TalkScope. Requirements vary by jurisdiction — consult legal counsel if unsure.
          </p>

          <h2 className="t-h2">6. Your Data and Intellectual Property</h2>
          <h3 className="t-h3">Your Data</h3>
          <p className="t-p">
            You retain full ownership of all conversation transcripts, audio files, agent data, and other content you upload to TalkScope ("Your Data"). You grant TalkScope a limited, non-exclusive license to process Your Data solely to provide the Service to you.
          </p>
          <h3 className="t-h3">AI Training</h3>
          <p className="t-p">
            We do not use Your Data to train our AI models without your explicit written consent. By default, your data is used only to generate insights and scores within your own account.
          </p>
          <h3 className="t-h3">TalkScope IP</h3>
          <p className="t-p">
            TalkScope retains all rights to the platform, AI models, scoring algorithms, pattern detection systems, user interface, and all related intellectual property. These Terms do not grant you any ownership rights in TalkScope.
          </p>
          <h3 className="t-h3">Feedback</h3>
          <p className="t-p">
            If you provide feedback, suggestions, or feature requests, you grant TalkScope a perpetual, royalty-free license to use such feedback without obligation to you.
          </p>

          <h2 className="t-h2">7. Privacy and Data Protection</h2>
          <p className="t-p">
            Your use of TalkScope is governed by our <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference. By using TalkScope, you consent to the data practices described in the Privacy Policy.
          </p>
          <p className="t-p">
            TalkScope automatically applies PII redaction to all uploaded transcripts before storage. However, you remain responsible for ensuring your use of the Service complies with applicable data protection laws including GDPR, CCPA, and any other applicable regulations.
          </p>

          <h2 className="t-h2">8. Third-Party Services</h2>
          <p className="t-p">
            TalkScope integrates with third-party services including OpenAI (AI scoring and transcription), Clerk (authentication), Neon (database), and Vercel (hosting). Your use of TalkScope is subject to those providers' terms and policies. TalkScope is not responsible for the availability or performance of third-party services.
          </p>

          <h2 className="t-h2">9. Service Availability and SLA</h2>
          <p className="t-p">
            We strive to maintain high availability but do not guarantee uninterrupted access to the Service. Scheduled maintenance will be announced in advance where possible. TalkScope is not liable for downtime caused by third-party infrastructure providers, force majeure events, or circumstances outside our reasonable control.
          </p>
          <p className="t-p">
            We reserve the right to modify, suspend, or discontinue any feature of the Service with reasonable notice, except where urgent security or legal reasons require immediate action.
          </p>

          <h2 className="t-h2">10. Termination and Suspension</h2>
          <h3 className="t-h3">By You</h3>
          <p className="t-p">
            You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period. Your data will be retained for 30 days after cancellation, after which it will be permanently deleted.
          </p>
          <h3 className="t-h3">By TalkScope</h3>
          <p className="t-p">
            We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent activity, fail to pay fees when due, or if required by law. We will provide notice where reasonably possible. Upon termination for cause, no refund is owed.
          </p>

          <h2 className="t-h2">11. Disclaimers and Limitation of Liability</h2>
          <h3 className="t-h3">Disclaimer of Warranties</h3>
          <p className="t-p">
            TalkScope is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that AI-generated scores, insights, or recommendations are accurate, complete, or suitable for any specific purpose.
          </p>
          <p className="t-p">
            <strong>AI scores and coaching recommendations are informational tools only.</strong> Employment decisions, disciplinary actions, or personnel evaluations should not be based solely on TalkScope outputs without human review.
          </p>
          <h3 className="t-h3">Limitation of Liability</h3>
          <p className="t-p">
            To the maximum extent permitted by law, TalkScope's total liability to you for any claims arising from these Terms or use of the Service shall not exceed the greater of (a) the fees you paid to TalkScope in the three months preceding the claim, or (b) $100 USD.
          </p>
          <p className="t-p">
            TalkScope shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, data, or business opportunities, even if advised of the possibility of such damages.
          </p>

          <h2 className="t-h2">12. Indemnification</h2>
          <p className="t-p">
            You agree to indemnify and hold harmless TalkScope and its officers, directors, employees, and agents from any claims, damages, losses, and expenses (including reasonable legal fees) arising from your use of the Service, violation of these Terms, infringement of third-party rights, or failure to obtain required consents for call recordings.
          </p>

          <h2 className="t-h2">13. Governing Law and Disputes</h2>
          <p className="t-p">
            These Terms are governed by and construed in accordance with applicable international commercial law principles. For disputes under $10,000 USD, you agree to attempt resolution through binding arbitration before initiating any legal proceedings. Either party may seek injunctive relief in any court of competent jurisdiction to prevent irreparable harm.
          </p>
          <p className="t-p">
            Before initiating any dispute resolution process, you agree to contact us at <strong>legal@talk-scope.com</strong> and attempt to resolve the matter informally for at least 30 days.
          </p>

          <h2 className="t-h2">14. Changes to Terms</h2>
          <p className="t-p">
            We may update these Terms at any time. We will notify you by email at least 14 days before material changes take effect. Your continued use of TalkScope after the effective date constitutes acceptance of the updated Terms. If you do not agree to updated Terms, you must cancel your subscription before they take effect.
          </p>

          <h2 className="t-h2">15. General Provisions</h2>
          {[
            { title: "Entire Agreement", text: "These Terms, together with the Privacy Policy, constitute the entire agreement between you and TalkScope regarding the Service." },
            { title: "Severability", text: "If any provision of these Terms is found unenforceable, the remaining provisions remain in full force and effect." },
            { title: "No Waiver", text: "Failure to enforce any right or provision does not constitute a waiver of that right or provision." },
            { title: "Assignment", text: "You may not assign your rights under these Terms without our prior written consent. TalkScope may assign its rights in connection with a merger, acquisition, or sale of assets." },
            { title: "Force Majeure", text: "TalkScope is not liable for delays or failures caused by circumstances beyond our reasonable control." },
          ].map(item => (
            <div key={item.title} style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: ink }}>{item.title}: </span>
              <span style={{ fontSize: 14, color: "rgba(11,18,32,0.7)", lineHeight: 1.85 }}>{item.text}</span>
            </div>
          ))}

          <h2 className="t-h2">16. Contact</h2>
          <div style={{ padding: "16px 20px", borderRadius: 12, background: soft, border: `1px solid ${border}`, fontSize: 13, color: ink, lineHeight: 2 }}>
            <strong>TalkScope Legal</strong><br />
            Email: legal@talk-scope.com<br />
            Billing questions: billing@talk-scope.com<br />
            Security issues: security@talk-scope.com<br />
            Response time: within 5 business days
          </div>
        </div>

        {/* Footer links */}
        <div style={{ marginTop: 32, textAlign: "center", display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>← Home</a>
          <a href="/privacy" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>🔒 Privacy Policy</a>
          <a href="/security" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>🛡️ Security</a>
          <a href="/guide" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>📖 Docs</a>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: muted }}>
          © 2026 TalkScope · Last updated {updated}
        </div>
      </div>
    </div>
  );
}
