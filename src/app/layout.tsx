import type { Metadata } from "next";
import { Cabin } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const cabin = Cabin({
  variable: "--font-cabin",
  subsets: ["latin"],
  display: "swap",
});

const iosevkaCharonMono = localFont({
  variable: "--font-iosevka-charon-mono",
  display: "swap",
  src: [
    {
      path: "./fonts/iosevka-charon-mono/IosevkaCharonMono-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/iosevka-charon-mono/IosevkaCharonMono-300Italic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/iosevka-charon-mono/IosevkaCharonMono-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/iosevka-charon-mono/IosevkaCharonMono-400Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/iosevka-charon-mono/IosevkaCharonMono-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/iosevka-charon-mono/IosevkaCharonMono-500Italic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/iosevka-charon-mono/IosevkaCharonMono-700.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/iosevka-charon-mono/IosevkaCharonMono-700Italic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
});

export const metadata: Metadata = {
  title: "Terapi Bio Elektrik Deepublish",
  description: "Reservasi jadwal Terapi Bio Elektrik secara online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cabin.variable} ${iosevkaCharonMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
