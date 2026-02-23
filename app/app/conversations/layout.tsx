import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversations",
  description: "Browse all uploaded conversations across your organization. Filter by agent, team, score range, and date. Access transcripts and AI analysis.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
