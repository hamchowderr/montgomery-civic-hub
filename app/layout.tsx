import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ActiveThemeProvider } from "@/components/active-theme";
import { ConvexClientProvider } from "@/components/ConvexProvider";
import { TourWrapper } from "@/components/TourWrapper";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://montgomery-civic-hub.vercel.app"),
  title: "Montgomery Civic Hub",
  description:
    "A four-portal civic dashboard for Montgomery, Alabama — real-time city data, AI-powered insights, interactive maps, and public safety analytics.",
  icons: {
    icon: "/montgomery-seal.png",
    apple: "/montgomery-seal.png",
  },
  openGraph: {
    title: "Montgomery Civic Hub",
    description:
      "Real-time civic data, AI-powered insights, and interactive maps for Montgomery, Alabama.",
    url: "https://montgomery-civic-hub.vercel.app",
    siteName: "Montgomery Civic Hub",
    images: [
      {
        url: "/montgomery-seal.png",
        width: 512,
        height: 512,
        alt: "City of Montgomery Seal",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Montgomery Civic Hub",
    description:
      "Real-time civic data, AI-powered insights, and interactive maps for Montgomery, Alabama.",
    images: ["/montgomery-seal.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.className} ${dmSans.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ActiveThemeProvider>
            <ConvexClientProvider>
              <TourWrapper>{children}</TourWrapper>
              <Toaster richColors closeButton />
            </ConvexClientProvider>
          </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
