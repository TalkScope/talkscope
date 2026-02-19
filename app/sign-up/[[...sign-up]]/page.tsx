import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--background)",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg,rgba(64,97,132,0.2),rgba(64,97,132,0.6))",
            border: "1px solid rgba(64,97,132,0.3)",
            margin: "0 auto 16px",
          }} />
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Create your account
          </div>
          <div style={{ fontSize: 14, color: "var(--ts-muted)", marginTop: 6 }}>
            Get started with TalkScope
          </div>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: { width: "100%" },
              card: {
                boxShadow: "var(--ts-shadow-md)",
                border: "1px solid var(--ts-border)",
                borderRadius: "18px",
                background: "var(--ts-surface)",
              },
              headerTitle: { display: "none" },
              headerSubtitle: { display: "none" },
            },
          }}
        />
      </div>
    </div>
  );
}
