/**
 * Root layout for the whole app: loads every Google Font used by the resume
 * "Typography" picker plus the default Geist UI fonts, defines the site-wide
 * `<Metadata>`, and wraps every page in `AppStateProvider` and the `Navbar`.
 */
import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Lato,
  Lora,
  Merriweather,
  Montserrat,
  Nunito,
  Oswald,
  Playfair_Display,
  Poppins,
  Raleway,
  Roboto,
  Space_Mono,
} from "next/font/google";
import { AppStateProvider } from "@/components/AppState";
import Navbar from "@/components/Navbar";
import TawkChat from "@/components/TawkChat";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Resume typography options — each exposes its own CSS variable, picked from
// in the sidebar's "Typography" feature and applied to the resume/preview.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  inter.variable,
  roboto.variable,
  lato.variable,
  montserrat.variable,
  poppins.variable,
  merriweather.variable,
  playfairDisplay.variable,
  lora.variable,
  nunito.variable,
  spaceMono.variable,
  oswald.variable,
  raleway.variable,
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lukasbujdos.com"),
  title: {
    default: "QuickResumeBuilder.com — Free Online Resume Builder",
    template: "%s | QuickResumeBuilder.com",
  },
  description:
    "Build a professional resume in minutes for free. Pick a template, customize colors and fonts, and download a polished PDF — no sign-up required.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: "QuickResumeBuilder.com",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppStateProvider>
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
          <Analytics />
          <SpeedInsights />
          <TawkChat />
        </AppStateProvider>
      </body>
    </html>
  );
}
