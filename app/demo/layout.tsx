import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Demo — TalkScope Conversation Intelligence",
  description: "Try TalkScope live. Explore AI-scored agents, real conversation analysis, pattern intelligence, and the coaching queue — no login required.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
