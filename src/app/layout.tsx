import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project WAR by TinTin",
  description: "Daily nutrition, WHOOP recovery, and gear tracking dashboard for client and coach.",
  metadataBase: new URL("https://tintincoach.vercel.app"),
  openGraph: {
    title: "Project WAR by TinTin",
    description: "Daily nutrition, WHOOP recovery, and gear tracking dashboard for client and coach.",
    url: "https://tintincoach.vercel.app",
    siteName: "Project WAR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
