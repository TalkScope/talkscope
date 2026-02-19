"use client";

import { UserProfile } from "@clerk/nextjs";

export default function AccountPage() {
  return (
    <>
      <style>{`
        .ts-account-wrap {
          max-width: 900px;
          margin: 0 auto;
        }
      `}</style>

      <div className="ts-container">
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Account</div>
            <div className="ts-subtitle">Manage your profile, security, and connected accounts</div>
          </div>
        </div>

        <div className="ts-account-wrap">
          <UserProfile
            appearance={{
              elements: {
                rootBox: { width: "100%" },
                card: {
                  boxShadow: "var(--ts-shadow-sm)",
                  border: "1px solid var(--ts-border)",
                  borderRadius: "18px",
                  background: "var(--ts-surface)",
                  width: "100%",
                },
                navbar: {
                  background: "var(--ts-bg-soft)",
                  borderRight: "1px solid var(--ts-border-soft)",
                },
                navbarButton: { color: "var(--ts-ink)" },
                navbarButtonActive: { color: "var(--ts-accent)" },
                headerTitle: { color: "var(--ts-ink)" },
                headerSubtitle: { color: "var(--ts-muted)" },
                formFieldLabel: { color: "var(--ts-ink)" },
                formFieldInput: {
                  background: "var(--ts-surface)",
                  border: "1px solid var(--ts-border)",
                  borderRadius: "10px",
                  color: "var(--ts-ink)",
                },
                badge: { background: "rgba(64,97,132,0.1)", color: "var(--ts-accent)" },
              },
            }}
          />
        </div>
      </div>
    </>
  );
}
