import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation & User Guide — TalkScope",
  description: "Complete guide to using TalkScope: dashboard, agent scoring, conversation analysis, pattern intelligence, upload, and AI scoring explained.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
