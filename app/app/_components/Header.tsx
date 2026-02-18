"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND, HEADER_NAV } from "../nav";

function isActive(pathname: string, href: string) {
  if (!href.startsWith("/")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Header() {
  const pathname = usePathname() || "/";

  return (
    <header className="ts-topbar">
      <div className="ts-container ts-topbar-inner">
        <div className="ts-topbar-left">
          <Link href={BRAND.href} className="ts-brand" aria-label={BRAND.name}>
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
              <a
                key={item.href}
                href={item.href}
                className={cls}
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={cls}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ts-topbar-right">
          <Link href="/" className="ts-btn ts-btn-primary">
            Home
          </Link>
        </div>
      </div>
    </header>
  );
}
