import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MP2 Response System",
  description: "The Manhattan Project 2 — Response Processing System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-stone-950 text-stone-100 antialiased">
        <nav className="border-b border-stone-800 bg-stone-900 px-6 py-3 flex items-center gap-6 flex-shrink-0">
          <span className="text-amber-400 font-bold tracking-wide text-sm uppercase">
            Manhattan Project 2
          </span>
          <span className="text-stone-600">|</span>
          <Link href="/" className="text-stone-300 hover:text-white text-sm transition-colors">Dashboard</Link>
          <Link href="/intake" className="text-stone-300 hover:text-white text-sm transition-colors">New Response</Link>
          <Link href="/queue" className="text-stone-300 hover:text-white text-sm transition-colors">Routing Queue</Link>
          <Link href="/book" className="text-stone-300 hover:text-white text-sm transition-colors">Book Export</Link>
        </nav>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
