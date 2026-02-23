"use client";

import { useState } from "react";

const ACCENT = "#406184";

type PlanKey = "starter" | "growth";

export default function PricingCTA({
  plan,
  primary,
  label,
  href,
}: {
  plan?: PlanKey;
  primary: boolean;
  label: string;
  href: string;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Enterprise or non-stripe plans — just link
  if (!plan) {
    return (
      <a
        href={href}
        style={{
          display: "block", textAlign: "center", padding: "13px 20px",
          borderRadius: 12, fontWeight: 800, fontSize: 15,
          background: primary ? "white" : "rgba(255,255,255,0.08)",
          color: primary ? ACCENT : "white",
          border: primary ? "none" : "1px solid rgba(255,255,255,0.15)",
          textDecoration: "none", cursor: "pointer",
        }}
      >
        {label}
      </a>
    );
  }

  async function handleClick() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (data.ok && data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        // Not logged in — redirect to sign up
        window.location.href = `/sign-up?redirect=/pricing`;
      } else if (res.status === 403) {
        window.location.href = `/sign-up?redirect=/pricing`;
      } else {
        setErr(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      setErr("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: "block", width: "100%", textAlign: "center",
          padding: "13px 20px", borderRadius: 12,
          fontWeight: 800, fontSize: 15, border: "none",
          background: primary ? "white" : "rgba(255,255,255,0.08)",
          color: primary ? ACCENT : "white",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {err && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#fca5a5", textAlign: "center" }}>
          {err}
        </div>
      )}
    </div>
  );
}
