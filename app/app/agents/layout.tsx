import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
  description: "View and manage all agents in your organization. Filter by team, sort by score or risk, and navigate to individual agent performance profiles.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
