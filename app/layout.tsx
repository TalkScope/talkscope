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

const SITE_URL = "https://talk-scope.com";
const SITE_NAME = "TalkScope";
const TITLE = "TalkScope — AI Conversation Intelligence for Contact Centers";
const DESC = "TalkScope scores every conversation with AI, detects revenue leakage, prioritizes coaching, and shows exactly why deals are won or lost. Built for contact centers, sales teams, and collections.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESC,
  keywords: [
    "conversation intelligence",
    "contact center AI",
    "agent scoring",
    "call analysis AI",
    "revenue intelligence",
    "sales conversation analytics",
    "coaching automation",
    "QA automation contact center",
    "call center performance management",
    "AI call scoring",
    "pattern intelligence",
    "revenue leakage detection",
    "Gong alternative",
    "CallRail alternative",
    "Observe AI alternative",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESC,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "TalkScope — AI Conversation Intelligence Platform",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@talkscope",
    creator: "@talkscope",
    title: TITLE,
    description: DESC,
    images: [OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/logo-512.png",
    shortcut: "/logo-512.png",
  },
  manifest: "/site.webmanifest",
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: SITE_NAME,
        url: SITE_URL,
        description: DESC,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "49",
          highPrice: "799",
          offerCount: "3",
        },
        featureList: [
          "AI Conversation Scoring",
          "Pattern Intelligence Engine",
          "Revenue Leakage Detection",
          "Coaching Priority AI",
          "Audio Transcription",
          "Real-Time Agent Assist",
        ],
        screenshot: OG_IMAGE,
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo-512.png`,
          width: 512,
          height: 512,
        },
        sameAs: [],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DESC,
        publisher: { "@id": `${SITE_URL}/#org` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/guide?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "What is TalkScope?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "TalkScope is an AI-powered conversation intelligence platform that scores every agent conversation, detects revenue leakage, identifies behavioral patterns, and prioritizes coaching — built for contact centers, sales teams, and collections organizations.",
            },
          },
          {
            "@type": "Question",
            name: "How is TalkScope different from Gong or CallRail?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CallRail tracks call attribution. Gong focuses on enterprise sales deal intelligence. TalkScope is a performance operating system for mid-market contact centers — with AI agent scoring, revenue leakage detection, coaching prioritization, and pattern intelligence that neither competitor offers at this price point.",
            },
          },
          {
            "@type": "Question",
            name: "Does TalkScope support audio call transcription?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. TalkScope supports MP3, WAV, and M4A audio uploads. Audio is transcribed via OpenAI Whisper, then immediately discarded — only the redacted text transcript is saved to the database.",
            },
          },
          {
            "@type": "Question",
            name: "How much does TalkScope cost?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "TalkScope starts at $49/month for small teams (Starter plan), $199/month for growing contact centers (Growth plan), and custom pricing for enterprise organizations.",
            },
          },
        ],
      },
    ],
  };

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
