import type { Metadata } from "next";
import { Quicksand, Pacifico } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-sans",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-display",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Felicia's Plants",
  description: "Plant care guide with watering schedules",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${quicksand.variable} ${pacifico.variable} antialiased cute-bg min-h-screen`}>
        <header className="sticky top-0 z-40 backdrop-blur-md bg-white/60 border-b border-pink-200/60">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-3 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-200/70 text-pink-700 text-lg shadow-sm">💘</span>
            <div className="flex flex-col">
              <span className="font-display text-xl sm:text-2xl text-emerald-700 drop-shadow-[0_1px_0_rgba(255,255,255,.8)]">Felicia's Plants</span>
              <span className="text-[12px] text-pink-700/80">Cute care guide for happy plants</span>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2 text-pink-700/80 text-sm">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink-100/70 text-pink-700">💖 <span className="hidden md:inline">Made with love</span></span>
            </div>
          </div>
        </header>
        <main className="relative">
          {children}
        </main>
      </body>
    </html>
  );
}
