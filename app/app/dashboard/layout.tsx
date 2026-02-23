import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Real-time overview of your organization: agent scores, risk zones, coaching queue, top and bottom performers, and batch scoring engine.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
