"use client";


export default function AboutPage() {
  const accent = "#406184";
  const ink = "#0b1220";
  const muted = "rgba(11,18,32,0.55)";
  const border = "#e4e7ef";
  const soft = "#f6f8fc";

  const team = [
    {
      name: "Yevhen Aliamin",
      role: "Co-founder & CEO",
      title: "Prompt Engineer & Product Lead",
      skills: ["Seed prompt", "Micro-addons", "Tone discipline"],
      bio: "Builds and evolves the core intelligence layer of TalkScope — the AI prompt system that powers scoring, pattern detection, and coaching recommendations. Responsible for product vision, feature direction, and the editorial consistency rules that make TalkScope reliable at scale.",
      photo: "/team/yevhen.jpg",
      initials: "YA",
      color: "#406184",
      linkedin: null,
    },
    {
      name: "Olena Aliamina",
      role: "Co-founder & CTO",
      title: "AI Architect & System Designer",
      skills: ["System design", "Domain intelligence", "Quality control"],
      bio: "Designs the full publishing stack behind TalkScope — domain cores, scheduling strategy, relevance guards, and the logic that keeps editorial output consistent across multi-site networks. Responsible for the architecture decisions that keep TalkScope fast, isolated, and secure.",
      photo: "/team/olena.jpg",
      initials: "OA",
      color: "#7c3aed",
      linkedin: null,
    },
  ];

  const values = [
    {
      icon: "crosshair",
      title: "Decision over data",
      desc: "We don't believe in dashboards for the sake of dashboards. Every feature in TalkScope is designed to tell you what to do next — not just show you numbers.",
    },
    {
      icon: "zap",
      title: "Speed without compromise",
      desc: "Intelligence should be instant. TalkScope scores a conversation in seconds, not minutes. Real-time feedback changes behavior; delayed reports don't.",
    },
    {
      icon: "lock",
      title: "Privacy by default",
      desc: "Your conversations contain sensitive business data. We treat it that way. PII is redacted automatically, audio is never stored, and your data is never used to train models.",
    },
    {
      icon: "globe",
      title: "Built for the middle",
      desc: "Enterprise tools are too expensive and too complex for most teams. We build for the contact center manager with 30 agents — not just the Fortune 500.",
    },
  ];

  const timeline = [
    { year: "2024", label: "Idea", desc: "Identified the gap: powerful conversation intelligence exists only for enterprise at $500+/mo. Mid-market has nothing." },
    { year: "2025", label: "Build", desc: "Built the core AI scoring engine, pattern intelligence, and batch processing pipeline from scratch." },
    { year: "2026", label: "Launch", desc: "TalkScope goes live. First customers. Full platform: scoring, patterns, coaching queue, real-time intelligence." },
    { year: "Next", label: "Scale", desc: "CRM integrations, real-time assist, multi-language support, and partnerships with contact center platforms." },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: soft, minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .team-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(11,18,32,0.12) !important; }
        .team-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .value-card:hover { background: white !important; }
        .value-card { transition: background 0.2s ease; }
        @media (max-width: 700px) {
          .timeline-row { flex-direction: column !important; gap: 8px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0b1220 0%, #1a2d45 100%)",
        padding: "56px 24px 52px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Back link */}
        <a href="/" style={{ position: "absolute", top: 24, left: 24, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600 }}>← Back to TalkScope</span>
        </a>

        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, background: "radial-gradient(circle, rgba(64,97,132,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 240, height: 240, background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(64,97,132,0.2)", border: "1px solid rgba(64,97,132,0.4)", borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em" }}>ABOUT TALKSCOPE</span>
        </div>

        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: 16 }}>
          Built by people who believe<br />
          <span style={{ color: "#7eb5e8" }}>every conversation matters.</span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 17, maxWidth: 560, margin: "0 auto 0", lineHeight: 1.7 }}>
          TalkScope is an independent product built by a two-person team.
          No VC money. No enterprise bureaucracy. Just a relentless focus on
          making contact centers smarter.
        </p>
      </div>

      {/* ── Mission ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 0" }}>
        <div style={{ background: "white", borderRadius: 16, border: `1px solid ${border}`, padding: "40px 48px", marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${accent}, #7eb5e8)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: ink, marginBottom: 12 }}>Our Mission</h2>
              <p style={{ color: muted, fontSize: 15, lineHeight: 1.8, marginBottom: 14 }}>
                We started TalkScope because we saw the same problem everywhere: contact center managers
                had gut feelings about why deals were lost, but no tools to confirm them. Enterprise
                platforms like Gong existed — but at $500+ per user per month, they were out of reach
                for the teams that needed them most.
              </p>
              <p style={{ color: muted, fontSize: 15, lineHeight: 1.8, marginBottom: 14 }}>
                So we built what we wished existed: an AI platform that scores every conversation,
                surfaces the patterns that matter, and tells you exactly who to coach and why — at a
                price that works for a 20-agent team, not just a Fortune 500.
              </p>
              <p style={{ color: ink, fontSize: 15, lineHeight: 1.8, fontWeight: 600 }}>
                TalkScope is not a reporting tool. It is a decision engine. It tells you what to do next.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <style>{`
          .about-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12; margin-bottom: 56px; }
          @media (max-width: 600px) { .about-stats { grid-template-columns: repeat(2, 1fr) !important; } }
          .about-team-grid { display: flex; gap: 20px; margin-bottom: 64px; }
          @media (max-width: 700px) { .about-team-grid { flex-direction: column !important; } }
          .about-values { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 64px; }
          @media (max-width: 600px) { .about-values { grid-template-columns: 1fr !important; } }
        `}</style>
        <div className="about-stats">
          {[
            { value: "100+", label: "Conversations analyzed" },
            { value: "8", label: "Scoring dimensions" },
            { value: "3 sec", label: "To score a call" },
            { value: "2026", label: "Founded" },
          ].map((s) => (
            <div key={s.label} style={{ background: "white", border: `1px solid ${border}`, borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: accent, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: muted, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Team ── */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: ink, marginBottom: 8 }}>The Team</h2>
        <p style={{ color: muted, fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
          Two people. One product. Fully committed.
        </p>

        <div className="about-team-grid">
          {team.map((member) => (
            <div key={member.name} className="team-card" style={{
              flex: 1,
              background: "white",
              borderRadius: 20,
              border: `1px solid ${border}`,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(11,18,32,0.06)",
            }}>
              {/* Top color bar */}
              <div style={{ height: 5, background: `linear-gradient(90deg, ${member.color}, ${member.color}88)` }} />

              <div style={{ padding: "32px 28px" }}>
                {/* Photo / avatar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${member.color}22, ${member.color}44)`,
                    border: `3px solid ${member.color}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, fontWeight: 800, color: member.color,
                    overflow: "hidden",
                  }}>
                    <img
                      src={member.photo}
                      alt={member.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerText = member.initials;
                      }}
                    />
                  </div>
                </div>

                {/* Name & role */}
                <h3 style={{ fontSize: 20, fontWeight: 800, color: ink, marginBottom: 4 }}>{member.name}</h3>
                <div style={{ fontSize: 13, fontWeight: 700, color: member.color, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{member.role}</div>
                <div style={{ fontSize: 13, color: muted, marginBottom: 16 }}>{member.title}</div>

                {/* Skills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                  {member.skills.map((s) => (
                    <span key={s} style={{
                      fontSize: 11, fontWeight: 600, color: member.color,
                      background: `${member.color}12`,
                      border: `1px solid ${member.color}30`,
                      borderRadius: 6, padding: "3px 10px",
                    }}>{s}</span>
                  ))}
                </div>

                {/* Bio */}
                <p style={{ fontSize: 14, color: muted, lineHeight: 1.75 }}>{member.bio}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Values ── */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: ink, marginBottom: 8 }}>What we believe</h2>
        <p style={{ color: muted, fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
          The principles behind every product decision we make.
        </p>

        <div className="about-values">
          {values.map((v) => (
            <div key={v.title} className="value-card" style={{
              background: soft,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: "24px 22px",
            }}>
              <div style={{ marginBottom: 12 }}>
                {v.icon === "crosshair" && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>}
                {v.icon === "zap" && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                {v.icon === "lock" && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                {v.icon === "globe" && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: ink, marginBottom: 8 }}>{v.title}</h4>
              <p style={{ fontSize: 13.5, color: muted, lineHeight: 1.75 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Timeline ── */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: ink, marginBottom: 8 }}>How we got here</h2>
        <p style={{ color: muted, fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
          From idea to a working product.
        </p>

        <div style={{ marginBottom: 64 }}>
          {timeline.map((t, i) => (
            <div key={t.year} className="timeline-row" style={{ display: "flex", gap: 20, marginBottom: 4 }}>
              {/* Left: year + connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 72, flexShrink: 0 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: i === timeline.length - 1 ? soft : `linear-gradient(135deg, ${accent}, #7eb5e8)`,
                  border: i === timeline.length - 1 ? `2px dashed ${accent}` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800,
                  color: i === timeline.length - 1 ? accent : "white",
                }}>
                  {t.year}
                </div>
                {i < timeline.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: border, minHeight: 24, margin: "4px 0" }} />
                )}
              </div>
              {/* Right: content */}
              <div style={{ background: "white", border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", flex: 1, marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{t.label}</div>
                <p style={{ fontSize: 14, color: muted, lineHeight: 1.7 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div style={{
          background: "linear-gradient(135deg, #0b1220 0%, #1a2d45 100%)",
          borderRadius: 20,
          padding: "48px 40px",
          textAlign: "center",
          marginBottom: 64,
        }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 12 }}>
            Want to see what TalkScope can do?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 28, maxWidth: 460, margin: "0 auto 28px" }}>
            Explore our live demo — 8 pre-loaded agents, 100+ conversations, full AI scoring. No login required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/demo" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: accent, color: "white",
              padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15,
            }}>
              Try live demo →
            </a>
            <a href="/pricing" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
              padding: "13px 28px", borderRadius: 10, fontWeight: 600, fontSize: 15,
            }}>
              View pricing
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: `1px solid ${border}`, padding: "24px", textAlign: "center" }}>
        <p style={{ color: muted, fontSize: 13 }}>
          © 2026 TalkScope ·{" "}
          <a href="/privacy" style={{ color: muted }}>Privacy</a> ·{" "}
          <a href="/security" style={{ color: muted }}>Security</a> ·{" "}
          <a href="/" style={{ color: accent }}>talk-scope.com</a>
        </p>
      </div>
    </div>
  );
}
