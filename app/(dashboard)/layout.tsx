import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/dashboard/navbar";
import TelegramPopup from "@/components/dashboard/telegramPop";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <TelegramPopup/>
      {children}
      <BottomNav/>
    </main>
  );
}
