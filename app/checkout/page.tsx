"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckoutRedirectInner() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") as "starter" | "growth" | null;
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) {
      window.location.href = "/pricing";
      return;
    }

    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.url) {
          window.location.href = data.url;
        } else {
          setErr(data.error || "Something went wrong");
          setStatus("error");
        }
      })
      .catch(() => {
        setErr("Network error — please try again");
        setStatus("error");
      });
  }, [plan]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0b1220", fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 13, background: "#406184",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: 15, fontWeight: 900, color: "white",
        }}>TS</div>

        {status === "loading" ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 8 }}>
              Preparing checkout…
            </div>
            <div style={{ fontSize: 14, color: "#64748b" }}>
              You'll be redirected to Stripe in a moment
            </div>
            <div style={{
              marginTop: 24, width: 36, height: 36,
              border: "3px solid rgba(64,97,132,0.3)",
              borderTop: "3px solid #406184",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
              margin: "24px auto 0",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 8 }}>
              Something went wrong
            </div>
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>{err}</div>
            <a href="/pricing" style={{
              display: "inline-block", padding: "10px 22px", background: "#406184",
              color: "white", textDecoration: "none", borderRadius: 10,
              fontWeight: 700, fontSize: 14,
            }}>
              Back to pricing
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutRedirectPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0b1220", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b" }}>Loading…</div>
      </div>
    }>
      <CheckoutRedirectInner />
    </Suspense>
  );
}
