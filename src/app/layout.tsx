import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaserPlays | Professional Laser Equipment",
  description:
    "High-performance laser systems engineered for precision. JGX3-120 Laser Cannon — 120W output, 10m range.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
