import { JgnextAssistant } from "@/components/jgnext-assistant";
import CookieConsent from '@/components/cookie-consent';
import { AppNav } from "@/components/app-nav";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const body = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400","700"], variable: "--font-sans", display: "swap" });
const display = { variable: "--font-display" };

export const metadata: Metadata = {
  title: "Boi Forte",
  description: "Base full-stack: Next.js App Router + NextAuth + Prisma + Stripe.",
};

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5 };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers><AppNav />{children}</Providers>
              <JgnextAssistant />
        <CookieConsent />
      </body>
    </html>
  );
}
