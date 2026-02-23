import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pattern Intelligence",
  description: "Discover behavioral patterns across thousands of conversations. Identify conversion drivers, risk triggers, and repeating agent behaviors.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
