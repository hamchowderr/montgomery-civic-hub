import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ConvexClientProvider } from "@/components/ConvexProvider";
import { TourWrapper } from "@/components/TourWrapper";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://montgomery-civichub.otakusolutions.io"),
  title: "Montgomery Civic Hub",
  description: "A civic engagement platform for Montgomery County",
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
          <ConvexClientProvider>
            <TourWrapper>{children}</TourWrapper>
            <Toaster richColors closeButton />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
