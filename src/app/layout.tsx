import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { DM_Sans, JetBrains_Mono, Syne } from "next/font/google";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareBar } from "@/components/compare/CompareBar";
import { IntroGate } from "@/components/IntroGate";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChatBot } from "@/components/ChatBot";
import { SITE, SITE_URL } from "@/lib/types";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isAdmin = (await headers()).get("x-orient-admin") === "1";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${syne.variable} ${dmSans.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        {/* Always mounted so soft-nav between /admin and the storefront never loses context */}
        <CompareProvider>
          {isAdmin ? (
            children
          ) : (
            <>
              <Script
                id="orient-intro-gate"
                strategy="beforeInteractive"
                dangerouslySetInnerHTML={{
                  __html: `(function(){try{var q=new URLSearchParams(location.search);if(q.get("skipIntro")==="1"){sessionStorage.setItem("orient-intro-seen","1");return;}if(sessionStorage.getItem("orient-intro-seen")!=="1"){document.documentElement.classList.add("intro-pending");}}catch(e){}})();`,
                }}
              />
              <MotionRoot>
                <IntroGate>
                  <AnnouncementBar />
                  <Header />
                  <main className="min-h-[60vh] pb-24">{children}</main>
                  <Footer />
                  <CompareBar />
                  <ChatBot />
                  <WhatsAppButton />
                </IntroGate>
              </MotionRoot>
            </>
          )}
        </CompareProvider>
      </body>
    </html>
  );
}
