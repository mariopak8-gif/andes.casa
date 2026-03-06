import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/dashboard/navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      {children}
      <BottomNav/>
    </main>
  );
}
