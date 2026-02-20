import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TalkScope — Conversation Intelligence OS",
  description: "AI-powered conversation intelligence, agent scoring, and performance management for contact centers, sales teams, and collections.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
  },
  openGraph: {
    title: "TalkScope — Conversation Intelligence OS",
    description: "AI that analyzes every conversation, scores agents, and tells you exactly why deals are won or lost.",
    url: "https://talkscope.vercel.app",
    siteName: "TalkScope",
    images: [{ url: "/logo-512.png", width: 512, height: 512, alt: "TalkScope Logo" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TalkScope — Conversation Intelligence OS",
    description: "AI that analyzes every conversation, scores agents, and tells you exactly why deals are won or lost.",
    images: ["/logo-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
