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

  const btnStyle = {
    display: "block", width: "100%", textAlign: "center" as const,
    padding: "13px 20px", borderRadius: 12,
    fontWeight: 800, fontSize: 15, border: "none",
    background: primary ? "white" : "rgba(255,255,255,0.08)",
    color: primary ? ACCENT : "white",
    cursor: "pointer" as const,
    transition: "opacity 0.15s",
    textDecoration: "none",
  };

  // Enterprise — just a link
  if (!plan) {
    return (
      <a href={href} style={{ ...btnStyle, border: primary ? "none" : "1px solid rgba(255,255,255,0.15)" }}>
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
        // Logged in + org exists → go straight to Stripe
        window.location.href = data.url;
      } else if (res.status === 401 || res.status === 403) {
        // Not logged in → sign up, then return to /checkout?plan=xxx which auto-starts checkout
        const returnUrl = encodeURIComponent(`/checkout?plan=${plan}`);
        window.location.href = `/sign-up?redirect_url=${returnUrl}`;
      } else if (data.error === "No organization found") {
        // Logged in but no org yet → go to onboarding, then pricing
        window.location.href = `/app/dashboard`;
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
      <button onClick={handleClick} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Redirecting…" : label}
      </button>
      {err && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#fca5a5", textAlign: "center" }}>{err}</div>
      )}
    </div>
  );
}
