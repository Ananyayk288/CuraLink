import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CuraLink — Unified Healthcare Gateway',
  description: 'Single sign-on and registration gateway for Doctors, Care Team Fieldworkers, and Pharmacists',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
