export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export const HEADER_NAV: NavItem[] = [
  { label: "Dashboard",     href: "/app/dashboard" },
  { label: "Agents",        href: "/app/agents" },
  { label: "Conversations", href: "/app/conversations" },
  { label: "Patterns",      href: "/app/patterns" },
  { label: "Upload",        href: "/app/upload" },
  { label: "Settings",      href: "/app/settings" },
];

export const FOOTER_NAV: NavItem[] = [
  { label: "About",    href: "/about" },
  { label: "Pricing",  href: "/pricing" },
  { label: "Docs",     href: "/guide" },
  { label: "Privacy",  href: "/privacy" },
  { label: "Security", href: "/security" },
];

export const BRAND = {
  name: "TalkScope",
  href: "/",
  tagline: "Conversation Intelligence OS",
};
