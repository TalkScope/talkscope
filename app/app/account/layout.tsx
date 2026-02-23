import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your TalkScope account: profile information, subscription, billing, and security settings.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
