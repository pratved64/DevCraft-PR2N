import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevCraft – Pokémon Event Platform",
  description: "Scan stalls, catch Pokémon, earn rewards and view live crowd analytics.",
  manifest: "/manifest.json",
  icons: [
    { rel: "apple-touch-icon", url: "/file.svg" },
    { rel: "icon", url: "/file.svg" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#8bac0f",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  userScalable: false, // "shrink-to-fit=no" is not standard in viewport object, userScalable handles similar logic often
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
