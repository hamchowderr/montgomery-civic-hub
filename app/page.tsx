import type { Metadata } from "next";
import { DM_Serif_Display } from "next/font/google";
import { Homepage } from "@/components/Homepage";

const displayFont = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Montgomery Civic Hub — AI-Powered Civic Engagement",
  description:
    "Your gateway to city data, services, and insights for Montgomery, Alabama.",
};

export default function Page() {
  return (
    <div className={displayFont.variable}>
      <Homepage />
    </div>
  );
}
