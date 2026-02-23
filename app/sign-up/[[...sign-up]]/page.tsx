import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--background)",
      padding: "24px",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Logo + heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/logo-512.png" alt="TalkScope" style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px", display: "block" }} />
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Create your account
          </div>
          <div style={{ fontSize: 14, color: "var(--ts-muted)", marginTop: 6 }}>
            Get started with TalkScope — free to try
          </div>
        </div>

        {/* Clerk SignUp form */}
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
              footer: { display: "none" },
            },
          }}
        />

        {/* Terms consent — below the form */}
        <p style={{
          textAlign: "center",
          fontSize: 12,
          color: "var(--ts-muted)",
          marginTop: 14,
          lineHeight: 1.7,
          padding: "0 8px",
        }}>
          By creating an account you agree to our{" "}
          <Link href="/terms" style={{ color: "#406184", fontWeight: 600, textDecoration: "none", display: "inline-block", padding: "4px 2px", minHeight: 44, lineHeight: "44px" }}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" style={{ color: "#406184", fontWeight: 600, textDecoration: "none", display: "inline-block", padding: "4px 2px", minHeight: 44, lineHeight: "44px" }}>
            Privacy Policy
          </Link>.
        </p>

      </div>
    </div>
  );
}
