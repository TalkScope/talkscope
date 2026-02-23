import Header from "./_components/Header";
import Footer from "./_components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "TalkScope",
    template: "%s — TalkScope",
  },
  description: "TalkScope Conversation Intelligence OS — AI scoring, pattern detection, coaching, and revenue intelligence for contact centers.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="ts-app-main">{children}</main>
      <Footer />
    </>
  );
}
