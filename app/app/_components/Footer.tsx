import Link from "next/link";
import { BRAND, FOOTER_NAV } from "../nav";

export default function Footer() {
  return (
    <footer className="ts-footer">
      <div className="ts-container ts-footer-inner">
        <div className="ts-footer-left">
          <div className="ts-footer-brand">{BRAND.name}</div>
          <div className="ts-footer-muted">{BRAND.tagline}</div>
        </div>

        <div className="ts-footer-links" aria-label="Footer">
          {FOOTER_NAV.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                className="ts-footer-link"
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="ts-footer-link">
                {item.label}
              </Link>
            )
          )}
        </div>

        <div className="ts-footer-right ts-footer-muted">
          © {new Date().getFullYear()} {BRAND.name}
        </div>
      </div>
    </footer>
  );
}
