import Header from "./_components/Header";
import Footer from "./_components/Footer";

export const metadata = {
  title: "TalkScope",
  description: "Conversation Intelligence OS",
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
