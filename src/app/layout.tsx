import type { Metadata } from "next";
import { Montserrat, Oswald, Roboto } from "next/font/google";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE, SITE_URL } from "@/lib/types";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} | LED Lighting Pakistan`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Orient Lighting by Photon Electric Pvt Ltd — residential, commercial and industrial LED lighting since 1996.",
  openGraph: {
    title: SITE.name,
    description: "LED lighting for homes, offices and industry across Pakistan.",
    url: SITE_URL,
    siteName: SITE.name,
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${oswald.variable} ${roboto.variable} font-sans antialiased`}>
        <AnnouncementBar />
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
