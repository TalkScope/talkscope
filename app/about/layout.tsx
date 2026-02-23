import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About TalkScope — Built by Yevhen & Olena Aliamin",
  description: "TalkScope is an independent AI conversation intelligence platform built by a two-person team. Learn about our mission, values, and the story behind the product.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
