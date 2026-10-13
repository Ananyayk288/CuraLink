import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/shared/pwa-register";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1e3a8a",
};

export const metadata: Metadata = {
  title: "CuraLink — Pharmacy Portal",
  description:
    "Integrated Healthcare Coordination & Sticker Adherence Platform. Safe Physical-to-Digital Dispensing Portal.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/curalink-symbol.png",
    apple: "/curalink-symbol.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CuraLink",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/curalink-symbol.png" type="image/png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="min-h-dvh bg-slate-50 text-slate-900 flex flex-col antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
