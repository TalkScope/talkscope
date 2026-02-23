import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload",
  description: "Upload conversation transcripts or audio files for AI scoring. Import agents via CSV or upload MP3/WAV files for automatic transcription.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
