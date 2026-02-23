import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your TalkScope workspace: organization details, company scripts and rules, team settings, and account preferences.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
