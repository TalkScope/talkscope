"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton, SignedIn, SignedOut, useUser, useClerk } from "@clerk/nextjs";
import { BRAND, HEADER_NAV } from "../nav";

const DEMO_USER_ID = "user_39vlY625s0Maj4GvJp5vPJvB7xU";

function isActive(pathname: string, href: string) {
  if (!href.startsWith("/")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ts-theme") as "light" | "dark" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ts-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return { theme, toggle };
}

export default function Header() {
  const pathname = usePathname() || "/";
  const onDashboard = pathname === "/app/dashboard" || pathname.startsWith("/app/dashboard/");
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const isDemo = user?.id === DEMO_USER_ID;

  async function handleCreateAccount() {
    await signOut();
    window.location.href = "/sign-up";
  }

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const NAV_ICONS: Record<string, string> = {
    "/app/dashboard": "📊",
    "/app/agents": "👥",
    "/app/conversations": "💬",
    "/app/patterns": "🔍",
    "/app/upload": "📂",
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div className={`ts-mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile Drawer */}
      <div className={`ts-mobile-drawer ${mobileOpen ? "open" : ""}`}>
        <div className="ts-mobile-drawer-head">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img
              src="/logo-512.png"
              alt="TalkScope"
              width={28} height={28}
              style={{ borderRadius: 8 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="ts-mobile-drawer-brand">TalkScope</span>
          </Link>
          <button className="ts-mobile-close" onClick={() => setMobileOpen(false)}>✕</button>
        </div>

        <nav className="ts-mobile-nav">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`ts-mobile-navlink ${isActive(pathname, item.href) ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="ts-mobile-navlink-icon">{NAV_ICONS[item.href] ?? "•"}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ts-mobile-footer">
          <SignedIn>
            <div className="ts-mobile-user">
              <UserButton afterSignOutUrl="/" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ts-ink)" }}>Account</span>
            </div>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="ts-btn ts-btn-primary" style={{ textAlign: "center", display: "block" }}>
              Sign In
            </Link>
          </SignedOut>
          <button className="ts-btn" style={{ width: "100%", fontSize: 14 }} onClick={toggle}>
            {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </div>

      {/* Demo Banner */}
      {isDemo && (
        <div style={{ background: "linear-gradient(90deg, #406184, #5a7fa8)", color: "#fff", padding: "9px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 13, fontWeight: 600, flexWrap: "wrap", textAlign: "center" }}>
          <span>👀 You're exploring a live demo workspace · Data is read-only</span>
          <button
            onClick={handleCreateAccount}
            style={{ padding: "4px 14px", borderRadius: 20, background: "#fff", color: "#406184", border: "none", fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit" }}
          >
            Create your account →
          </button>
        </div>
      )}

      {/* Header */}
      <header className="ts-topbar">
        <div className="ts-container ts-topbar-inner">
          <div className="ts-topbar-left">
            <Link href="/" className="ts-brand" aria-label={BRAND.name}>
              <img
                src="/logo-512.png"
                alt="TalkScope"
                width={34} height={34}
                style={{ borderRadius: 10, flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="ts-brand-text">
                <span className="ts-brand-name">{BRAND.name}</span>
                <span className="ts-brand-tag">{BRAND.tagline}</span>
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="ts-nav" aria-label="Primary">
            {HEADER_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return item.external ? (
                <a key={item.href} href={item.href} className={active ? "ts-navlink ts-navlink-active" : "ts-navlink"} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href} className={active ? "ts-navlink ts-navlink-active" : "ts-navlink"}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ts-topbar-right" style={{ display: "flex", gap: 8, alignItems: "center" }}>

            {/* Dashboard refresh — desktop */}
            {onDashboard && (
              <button
                type="button"
                className="ts-btn ts-topbar-refresh"
                onClick={() => window.dispatchEvent(new Event("ts:refresh"))}
                title="Refresh"
              >
                Refresh
              </button>
            )}

            {/* Theme toggle */}
            <button
              type="button"
              className="ts-btn"
              onClick={toggle}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              style={{ fontSize: 16, padding: "0 10px", minWidth: 38 }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Auth — desktop */}
            <SignedIn>
              <div className="ts-user-btn ts-signin-btn-desktop">
                {isDemo ? (
                  <button
                    onClick={handleCreateAccount}
                    style={{ padding: "7px 16px", borderRadius: 10, background: "#406184", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Sign up free →
                  </button>
                ) : (
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{ elements: { avatarBox: { width: 34, height: 34, borderRadius: 10 } } }}
                  />
                )}
              </div>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="ts-btn ts-btn-primary ts-signin-btn-desktop" style={{ fontSize: 13 }}>
                Sign In
              </Link>
            </SignedOut>

            {/* Hamburger — mobile */}
            <button
              className="ts-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span className="ts-hamburger-line" />
              <span className="ts-hamburger-line" />
              <span className="ts-hamburger-line" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
