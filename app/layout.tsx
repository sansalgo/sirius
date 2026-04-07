import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://sirius.app");

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Sirius — Employee Recognition & Rewards",
    template: "%s | Sirius",
  },
  description:
    "Sirius helps teams run employee recognition, point budgets, rewards, and challenges from a single workspace.",
  keywords: ["employee recognition", "rewards", "team engagement", "points", "challenges"],
  authors: [{ name: "Sirius" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "Sirius",
    title: "Sirius — Employee Recognition & Rewards",
    description:
      "Sirius helps teams run employee recognition, point budgets, rewards, and challenges from a single workspace.",
    // Replace with your actual OG image path under /public
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sirius — Employee Recognition & Rewards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sirius — Employee Recognition & Rewards",
    description:
      "Sirius helps teams run employee recognition, point budgets, rewards, and challenges from a single workspace.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    // Replace with your actual favicon paths
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
