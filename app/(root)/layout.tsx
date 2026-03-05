import BottomNav from "@/components/BottomNav";
import Navigation from "@/components/Navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <Navigation />

      {children}
      <BottomNav />
    </main>
  );
}
