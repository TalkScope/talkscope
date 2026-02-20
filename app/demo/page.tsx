"use client";

import { useEffect, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "signing-in" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    handleDemoLogin();
  }, [isLoaded]);

  async function handleDemoLogin() {
    try {
      setStatus("signing-in");

      const r = await fetch("/api/demo-login", { method: "POST" });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Failed to create demo session");

      const result = await signIn!.create({
        strategy: "ticket",
        ticket: data.token,
      });

      if (result.status === "complete") {
        router.push("/app/dashboard");
      } else {
        throw new Error("Sign-in incomplete");
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong");
      setStatus("error");
    }
  }

  const accent = "#406184";

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 420, width: "100%", background: "#fff", border: "1px solid #e4e7ef", borderRadius: 24, padding: 40, boxShadow: "0 24px 60px rgba(11,18,32,0.10)", textAlign: "center" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,rgba(64,97,132,0.25),rgba(64,97,132,0.7))", border: "1px solid rgba(64,97,132,0.4)" }} />
          <span style={{ fontWeight: 800, fontSize: 18, color: "#0b1220" }}>TalkScope</span>
        </div>

        {status !== "error" ? (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(64,97,132,0.15)", borderTopColor: accent, animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0b1220", marginBottom: 8 }}>
              Loading demo workspace…
            </div>
            <div style={{ fontSize: 14, color: "rgba(11,18,32,0.5)" }}>
              Signing you into the live demo
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0b1220", marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 14, color: "rgba(11,18,32,0.5)", marginBottom: 24 }}>{error}</div>
            <button onClick={handleDemoLogin} style={{ padding: "12px 24px", borderRadius: 12, background: accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Try again
            </button>
            <div style={{ marginTop: 16 }}>
              <a href="/" style={{ fontSize: 13, color: accent, textDecoration: "none" }}>← Back to home</a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
