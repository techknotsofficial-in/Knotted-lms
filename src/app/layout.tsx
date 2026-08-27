import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/layout/cookie-banner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Knotted LMS — Modern Technical Learning Architecture",
  description:
    "An enterprise-grade Learning Management System with zero-egress Cloudflare R2 video streaming, dynamic anti-piracy deterrence, and live cohort classrooms.",
  icons: {
    icon: "/knotted_lms_icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-[#FAFAFA] text-[#09090B] selection:bg-[#09090B] selection:text-white"
      >
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
