import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Profile",
  description: "Individual agent performance profile: AI scores, conversation history, strengths, weaknesses, coaching priority, and pattern analysis.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
