"use client";

import Link from "next/link";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const DEMO_EMAIL = "fernando.d.roberts@gmail.com";
const DEMO_PASSWORD = "TalkScope2026!";

export default function DemoPage() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const accent = "#406184";

  async function handleEnterDemo() {
    if (!isLoaded) return;
    setStatus("loading");
    setError("");
    try {
      const result = await signIn.create({
        identifier: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (result.status === "complete") {
        router.push("/app/dashboard");
      } else {
        throw new Error("Sign-in incomplete");
      }
    } catch (e: any) {
      setError(e?.errors?.[0]?.message || e?.message || "Failed to enter demo");
      setStatus("error");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 440, width: "100%", background: "#fff", border: "1px solid #e4e7ef", borderRadius: 24, padding: 40, boxShadow: "0 24px 60px rgba(11,18,32,0.10)" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,rgba(64,97,132,0.25),rgba(64,97,132,0.7))", border: "1px solid rgba(64,97,132,0.4)" }} />
          <span style={{ fontWeight: 800, fontSize: 18, color: "#0b1220" }}>TalkScope</span>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: 20 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>Live demo environment</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "#0b1220", marginBottom: 10, lineHeight: 1.2 }}>
          See TalkScope in action
        </h1>
        <p style={{ fontSize: 14, color: "rgba(11,18,32,0.55)", lineHeight: 1.7, marginBottom: 28 }}>
          Explore a live workspace with 8 agents, AI scores, patterns, and coaching intelligence.
        </p>

        {/* What you'll see */}
        <div style={{ background: "#f6f8fc", border: "1px solid #e4e7ef", borderRadius: 14, padding: 16, marginBottom: 24 }}>
          {[
            { icon: "📊", text: "Operations dashboard with coaching queue" },
            { icon: "🧠", text: "AI scores and behavioral patterns" },
            { icon: "📈", text: "Score trends over 8 weeks" },
            { icon: "🎯", text: "Revenue leakage and risk signals" },
          ].map(item => (
            <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, fontSize: 13, color: "rgba(11,18,32,0.7)" }}>
              <span>{item.icon}</span>{item.text}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleEnterDemo}
          disabled={status === "loading"}
          style={{ width: "100%", padding: "14px 24px", borderRadius: 14, background: accent, color: "#fff", border: "none", fontWeight: 800, fontSize: 16, cursor: status === "loading" ? "default" : "pointer", opacity: status === "loading" ? 0.8 : 1, marginBottom: 14, boxShadow: "0 8px 24px rgba(64,97,132,0.3)" }}
        >
          {status === "loading" ? "Entering demo…" : "Enter live demo →"}
        </button>

        <div style={{ borderTop: "1px solid #e4e7ef", paddingTop: 18, display: "flex", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 13, color: accent, textDecoration: "none", fontWeight: 600 }}>← Back</Link>
          <Link href="/sign-up" style={{ fontSize: 13, color: "rgba(11,18,32,0.45)", textDecoration: "none" }}>Create account →</Link>
        </div>
      </div>
    </main>
  );
}
