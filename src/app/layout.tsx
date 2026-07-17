import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat, Oswald, Roboto } from "next/font/google";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareBar } from "@/components/compare/CompareBar";
import { IntroGate } from "@/components/IntroGate";
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${oswald.variable} ${roboto.variable} font-sans antialiased`}>
        <Script
          id="orient-intro-gate"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(sessionStorage.getItem("orient-intro-seen")!=="1"){document.documentElement.classList.add("intro-pending");}}catch(e){document.documentElement.classList.add("intro-pending");}})();`,
          }}
        />
        <CompareProvider>
          <IntroGate>
            <AnnouncementBar />
            <Header />
            <main className="min-h-[60vh] pb-24">{children}</main>
            <Footer />
            <CompareBar />
          </IntroGate>
        </CompareProvider>
      </body>
    </html>
  );
}
