"use client";

import { UserProfile } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type SubData = {
  plan: string;
  status: string;
  isActive: boolean;
  isPastDue: boolean;
  currentPeriodEnd: string | null;
  hasStripe: boolean;
  orgName: string;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter — $49/mo",
  growth: "Growth — $199/mo",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  inactive: "#94a3b8",
  canceled: "#ef4444",
  past_due: "#f59e0b",
};

export default function AccountPage() {
  const [sub, setSub] = useState<SubData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  useEffect(() => {
    fetch("/api/subscription")
      .then(r => r.json())
      .then(d => { if (d.ok) setSub(d); })
      .catch(() => {});
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" });
      const d = await r.json();
      if (d.ok && d.url) window.location.href = d.url;
    } catch {}
    setPortalLoading(false);
  }

  return (
    <>
      <style>{`
        .ts-account-wrap { max-width: 900px; margin: 0 auto; }
        .ts-billing-card {
          background: var(--ts-surface); border: 1px solid var(--ts-border);
          border-radius: 18px; padding: 28px 32px; margin-bottom: 28px;
          box-shadow: var(--ts-shadow-sm);
        }
        .ts-billing-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
        }
        .ts-billing-title { font-size: 17px; font-weight: 800; letter-spacing: -0.02em; }
        .ts-billing-subtitle { font-size: 13px; color: var(--ts-muted); margin-top: 2px; }
        .ts-plan-row {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px; background: var(--ts-bg-soft);
          border: 1px solid var(--ts-border-soft); border-radius: 12px;
          margin-bottom: 12px;
        }
        .ts-plan-icon {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          background: rgba(64,97,132,0.1); border: 1px solid rgba(64,97,132,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .ts-plan-name { font-size: 15px; font-weight: 800; }
        .ts-plan-meta { font-size: 12px; color: var(--ts-muted); margin-top: 2px; }
        .ts-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ts-billing-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
      `}</style>

      <div className="ts-container">
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Account</div>
            <div className="ts-subtitle">Manage your profile, billing, and security</div>
          </div>
        </div>

        <div className="ts-account-wrap">

          {checkoutSuccess && (
            <div style={{
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 14, padding: "14px 20px", marginBottom: 24,
              display: "flex", alignItems: "center", gap: 12, fontSize: 14,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span><strong style={{ color: "#22c55e" }}>Subscription activated!</strong> Your plan is now active.</span>
            </div>
          )}

          <div className="ts-billing-card">
            <div className="ts-billing-head">
              <div>
                <div className="ts-billing-title">Subscription & Billing</div>
                <div className="ts-billing-subtitle">{sub?.orgName ? `Workspace: ${sub.orgName}` : "Loading…"}</div>
              </div>
            </div>

            {sub ? (
              <>
                <div className="ts-plan-row">
                  <div className="ts-plan-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="ts-plan-name">{PLAN_LABELS[sub.plan] ?? sub.plan}</div>
                    <div className="ts-plan-meta">
                      {sub.currentPeriodEnd
                        ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                        : sub.plan === "free" ? "No active subscription" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="ts-status-dot" style={{ background: STATUS_COLORS[sub.status] ?? "#94a3b8" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[sub.status] ?? "#94a3b8", textTransform: "capitalize" }}>
                      {sub.status}
                    </span>
                  </div>
                </div>

                {sub.isPastDue && (
                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#f59e0b", marginBottom: 12 }}>
                    Payment failed. Please update your payment method to keep access.
                  </div>
                )}

                <div className="ts-billing-actions">
                  {sub.hasStripe ? (
                    <button className="ts-btn ts-btn-primary" onClick={openPortal} disabled={portalLoading}>
                      {portalLoading ? "Opening…" : "Manage billing →"}
                    </button>
                  ) : (
                    <a href="/pricing" className="ts-btn ts-btn-primary" style={{ textDecoration: "none" }}>
                      Upgrade plan →
                    </a>
                  )}
                  {sub.plan === "free" && (
                    <a href="/pricing" className="ts-btn" style={{ textDecoration: "none" }}>View plans</a>
                  )}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--ts-muted)", fontSize: 14 }}>Loading billing info…</div>
            )}
          </div>

          <UserProfile
            appearance={{
              elements: {
                rootBox: { width: "100%" },
                card: { boxShadow: "var(--ts-shadow-sm)", border: "1px solid var(--ts-border)", borderRadius: "18px", background: "var(--ts-surface)", width: "100%" },
                navbar: { background: "var(--ts-bg-soft)", borderRight: "1px solid var(--ts-border-soft)" },
                navbarButton: { color: "var(--ts-ink)" },
                navbarButtonActive: { color: "var(--ts-accent)" },
                headerTitle: { color: "var(--ts-ink)" },
                headerSubtitle: { color: "var(--ts-muted)" },
                formFieldLabel: { color: "var(--ts-ink)" },
                formFieldInput: { background: "var(--ts-surface)", border: "1px solid var(--ts-border)", borderRadius: "10px", color: "var(--ts-ink)" },
                badge: { background: "rgba(64,97,132,0.1)", color: "var(--ts-accent)" },
              },
            }}
          />
        </div>
      </div>
    </>
  );
}
