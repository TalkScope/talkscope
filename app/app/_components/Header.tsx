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

  return (
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

        <div className="ts-topbar-right" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {onDashboard && (
            <button
              type="button"
              className="ts-btn"
              onClick={() => window.dispatchEvent(new Event("ts:refresh"))}
              aria-label="Refresh dashboard data"
              title="Refresh dashboard data"
            >
              Refresh
            </button>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            className="ts-btn"
            onClick={toggle}
            aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{ fontSize: 16, padding: "0 10px", minWidth: 38 }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

        </div>
      </div>
    </header>
  );
}
