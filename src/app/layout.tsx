import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

/* TEMP FONT: Licensed Lufga font files not yet present in /fonts.
   Using Plus Jakarta Sans with true Light 300 Italic fallback per addendum spec. */
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TAZQOR — Business Manager",
  description: "Operations and business management system for TAZQOR cleaning products",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TAZQOR",
  },
};

export const viewport: Viewport = {
  themeColor: "#151515",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${plusJakartaSans.variable}`}>
      <body className="min-h-full font-sans antialiased text-foreground selection:bg-[#D7FF00] selection:text-black">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
