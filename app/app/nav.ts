export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export const HEADER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard" },
  { label: "Agents", href: "/app/agents" },
  { label: "Conversations", href: "/app/conversations" },
  { label: "Patterns", href: "/app/patterns" },
  { label: "Upload", href: "/app/upload" },
];

export const FOOTER_NAV: NavItem[] = [
  { label: "Status", href: "/app/status" },
  { label: "Docs", href: "/app/docs" },
];

export const BRAND = {
  name: "TalkScope",
  href: "/app/dashboard",
  tagline: "Conversation Intelligence OS",
};
