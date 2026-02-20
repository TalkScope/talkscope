"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
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
  const isDemo = user?.id === DEMO_USER_ID;

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
      <style>{`
        .ts-mobile-overlay {
          display:none; position:fixed; inset:0; z-index:39;
          background:rgba(0,0,0,0.4); backdrop-filter:blur(2px);
          animation:ts-fade-in 0.15s ease;
        }
        .ts-mobile-overlay.open { display:block; }

        .ts-mobile-drawer {
          display:none; position:fixed; top:0; right:0; bottom:0;
          width:min(280px,85vw); z-index:50;
          background:var(--ts-surface); border-left:1px solid var(--ts-border);
          box-shadow:-8px 0 32px rgba(0,0,0,0.18);
          flex-direction:column; animation:ts-slide-in 0.2s ease;
        }
        .ts-mobile-drawer.open { display:flex; }

        @keyframes ts-fade-in { from{opacity:0}to{opacity:1} }
        @keyframes ts-slide-in { from{transform:translateX(100%)}to{transform:translateX(0)} }

        .ts-mobile-drawer-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:16px 20px; border-bottom:1px solid var(--ts-border-soft);
        }
        .ts-mobile-drawer-brand { font-weight:820; font-size:15px; letter-spacing:-0.02em; color:var(--ts-ink); }

        .ts-mobile-close {
          width:36px; height:36px; border-radius:10px;
          border:1px solid var(--ts-border); background:transparent;
          display:flex; align-items:center; justify-content:center;
          font-size:18px; cursor:pointer; color:var(--ts-ink); transition:background 0.1s;
        }
        .ts-mobile-close:hover { background:rgba(64,97,132,0.08); }

        .ts-mobile-nav { display:flex; flex-direction:column; padding:12px; flex:1; gap:2px; }
        .ts-mobile-navlink {
          display:flex; align-items:center; gap:10px;
          padding:12px 14px; border-radius:12px;
          font-size:15px; font-weight:700; color:var(--ts-ink);
          text-decoration:none; transition:background 0.1s;
          border:1px solid transparent;
        }
        .ts-mobile-navlink:hover { background:rgba(64,97,132,0.07); }
        .ts-mobile-navlink.active {
          background:rgba(64,97,132,0.1); border-color:rgba(64,97,132,0.2); color:var(--ts-accent);
        }
        .ts-mobile-navlink-icon {
          width:32px; height:32px; border-radius:8px; flex-shrink:0;
          background:rgba(64,97,132,0.1);
          display:flex; align-items:center; justify-content:center; font-size:15px;
        }

        .ts-mobile-footer {
          padding:16px 20px; border-top:1px solid var(--ts-border-soft); display:flex; flex-direction:column; gap:10px;
        }

        .ts-mobile-user {
          display:flex; align-items:center; gap:10px; padding:12px 14px;
          border-radius:12px; border:1px solid var(--ts-border);
          background:var(--ts-bg-soft);
        }

        .ts-hamburger {
          display:none; width:38px; height:38px; border-radius:10px;
          border:1px solid var(--ts-border); background:var(--ts-surface);
          flex-direction:column; align-items:center; justify-content:center;
          gap:5px; cursor:pointer; transition:background 0.1s;
        }
        .ts-hamburger:hover { background:rgba(64,97,132,0.08); }
        .ts-hamburger-line { width:18px; height:2px; border-radius:2px; background:var(--ts-ink); }

        /* UserButton customization */
        .ts-user-btn .cl-userButtonAvatarBox { width:34px !important; height:34px !important; }
        .ts-user-btn .cl-userButtonTrigger { border-radius:10px !important; }

        @media (max-width: 767px) {
          .ts-nav { display:none !important; }
          .ts-hamburger { display:flex; }
          .ts-topbar-refresh { display:none !important; }
          .ts-signin-btn-desktop { display:none !important; }
        }
        @media (min-width: 768px) {
          .ts-signin-btn-mobile { display:none !important; }
        }
      `}</style>

      {/* Overlay */}
      <div className={`ts-mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile Drawer */}
      <div className={`ts-mobile-drawer ${mobileOpen ? "open" : ""}`}>
        <div className="ts-mobile-drawer-head">
          <span className="ts-mobile-drawer-brand">TalkScope</span>
          <button className="ts-mobile-close" onClick={() => setMobileOpen(false)}>✕</button>
        </div>

        <nav className="ts-mobile-nav">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`ts-mobile-navlink ${isActive(pathname, item.href) ? "active" : ""}`}
            >
              <span className="ts-mobile-navlink-icon">{NAV_ICONS[item.href] ?? "•"}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ts-mobile-footer">
          {/* User info in drawer */}
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
          <button
            className="ts-btn"
            style={{ width: "100%", fontSize: 14 }}
            onClick={toggle}
          >
            {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </div>

      {/* Demo Banner */}
      {isDemo && (
        <div style={{ background: "linear-gradient(90deg, #406184, #5a7fa8)", color: "#fff", padding: "9px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 13, fontWeight: 600, flexWrap: "wrap", textAlign: "center" }}>
          <span>👀 You're exploring a live demo workspace · Data is read-only</span>
          <Link href="/sign-up" style={{ padding: "4px 14px", borderRadius: 20, background: "#fff", color: "#406184", textDecoration: "none", fontWeight: 800, fontSize: 12, whiteSpace: "nowrap" }}>
            Create your account →
          </Link>
        </div>
      )}

      {/* Header */}
      <header className="ts-topbar">
        <div className="ts-container ts-topbar-inner">
          <div className="ts-topbar-left">
            <Link href="/" className="ts-brand" aria-label={BRAND.name}>
              <span className="ts-brand-mark" />
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
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: { width: 34, height: 34, borderRadius: 10 },
                    },
                  }}
                />
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
