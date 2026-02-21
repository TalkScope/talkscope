"use client";
import Link from "next/link";
import { BRAND, FOOTER_NAV } from "../nav";

export default function Footer() {
  return (
    <footer style={{
      background: "#080f1c",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      padding: "32px 24px",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 20,
      }}>
        {/* Brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img
            src="/logo-512.png"
            alt="TalkScope"
            width={28}
            height={28}
            style={{ borderRadius: 8 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span style={{ fontWeight: 800, fontSize: 15, color: "#ffffff", letterSpacing: "-0.02em" }}>
            {BRAND.name}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 2 }}>
            {BRAND.tagline}
          </span>
        </Link>

        {/* Links */}
        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          {FOOTER_NAV.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                style={{ padding: "5px 12px", fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", borderRadius: 8, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                style={{ padding: "5px 12px", fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", borderRadius: 8 }}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Copyright */}
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>
          © {new Date().getFullYear()} {BRAND.name}
        </span>
      </div>
    </footer>
  );
}
