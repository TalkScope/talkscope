"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND, HEADER_NAV } from "../nav";

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

  // Close menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <style>{`
        /* ── Mobile menu overlay ── */
        .ts-mobile-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 39;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(2px);
          animation: ts-fade-in 0.15s ease;
        }
        .ts-mobile-overlay.open { display: block; }

        /* ── Mobile drawer ── */
        .ts-mobile-drawer {
          display: none;
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(280px, 85vw);
          z-index: 50;
          background: var(--ts-surface);
          border-left: 1px solid var(--ts-border);
          box-shadow: -8px 0 32px rgba(0,0,0,0.18);
          flex-direction: column;
          animation: ts-slide-in 0.2s ease;
        }
        .ts-mobile-drawer.open { display: flex; }

        @keyframes ts-fade-in { from { opacity:0 } to { opacity:1 } }
        @keyframes ts-slide-in { from { transform:translateX(100%) } to { transform:translateX(0) } }

        .ts-mobile-drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--ts-border-soft);
        }
        .ts-mobile-drawer-brand { font-weight: 820; font-size: 15px; letter-spacing: -0.02em; }
        .ts-mobile-close {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid var(--ts-border); background: transparent;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; cursor: pointer; color: var(--ts-ink);
          transition: background 0.1s;
        }
        .ts-mobile-close:hover { background: rgba(64,97,132,0.08); }

        .ts-mobile-nav { display: flex; flex-direction: column; padding: 12px 12px; flex: 1; }
        .ts-mobile-navlink {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 14px; border-radius: 12px;
          font-size: 15px; font-weight: 700;
          color: var(--ts-ink); text-decoration: none;
          transition: background 0.1s;
          border: 1px solid transparent;
        }
        .ts-mobile-navlink:hover { background: rgba(64,97,132,0.07); }
        .ts-mobile-navlink.active {
          background: rgba(64,97,132,0.1);
          border-color: rgba(64,97,132,0.2);
          color: var(--ts-accent);
        }
        .ts-mobile-navlink-icon {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          background: rgba(64,97,132,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }

        .ts-mobile-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--ts-border-soft);
          display: flex; gap: 8px;
        }

        /* ── Hamburger button ── */
        .ts-hamburger {
          display: none;
          width: 38px; height: 38px; border-radius: 10px;
          border: 1px solid var(--ts-border); background: var(--ts-surface);
          flex-direction: column; align-items: center; justify-content: center;
          gap: 5px; cursor: pointer;
          transition: background 0.1s;
        }
        .ts-hamburger:hover { background: rgba(64,97,132,0.08); }
        .ts-hamburger-line {
          width: 18px; height: 2px; border-radius: 2px;
          background: var(--ts-ink); transition: all 0.2s;
        }

        /* ── Desktop nav hidden on mobile ── */
        @media (max-width: 767px) {
          .ts-nav { display: none !important; }
          .ts-hamburger { display: flex; }
          .ts-topbar-refresh { display: none !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      <div
        className={`ts-mobile-overlay ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <div className={`ts-mobile-drawer ${mobileOpen ? "open" : ""}`}>
        <div className="ts-mobile-drawer-head">
          <div className="ts-mobile-drawer-brand">TalkScope</div>
          <button className="ts-mobile-close" onClick={() => setMobileOpen(false)}>✕</button>
        </div>

        <nav className="ts-mobile-nav">
          {HEADER_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const icons: Record<string, string> = {
              "/app/dashboard": "📊",
              "/app/agents": "👥",
              "/app/conversations": "💬",
              "/app/patterns": "🔍",
              "/app/upload": "📂",
            };
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ts-mobile-navlink ${active ? "active" : ""}`}
              >
                <span className="ts-mobile-navlink-icon">{icons[item.href] ?? "•"}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ts-mobile-footer">
          <button
            className="ts-btn"
            style={{ flex: 1, fontSize: 14 }}
            onClick={() => { toggle(); }}
          >
            {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </div>

      {/* Main header */}
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
              const cls = active ? "ts-navlink ts-navlink-active" : "ts-navlink";
              return item.external ? (
                <a key={item.href} href={item.href} className={cls} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href} className={cls}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ts-topbar-right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Dashboard refresh — desktop only */}
            {onDashboard && (
              <button
                type="button"
                className="ts-btn ts-topbar-refresh"
                onClick={() => window.dispatchEvent(new Event("ts:refresh"))}
                title="Refresh dashboard data"
              >
                Refresh
              </button>
            )}

            {/* Theme toggle — desktop */}
            <button
              type="button"
              className="ts-btn"
              onClick={toggle}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{ fontSize: 16, padding: "0 10px", minWidth: 38 }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Hamburger — mobile only */}
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
