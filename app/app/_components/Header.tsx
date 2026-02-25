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

  const NAV_ICONS: Record<string, React.ReactNode> = {
    "/app/dashboard": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    "/app/agents": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    "/app/conversations": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    "/app/patterns": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    "/app/upload": <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
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
            {isDemo ? (
              <button onClick={handleCreateAccount} className="ts-btn ts-btn-primary" style={{ width: "100%", textAlign: "center" }}>
                Create free account →
              </button>
            ) : (
              <Link href="/app/account" className="ts-mobile-user" style={{ textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(64,97,132,0.15)", border: "1px solid rgba(64,97,132,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406184" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ts-ink)" }}>My Account</span>
              </Link>
            )}
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
