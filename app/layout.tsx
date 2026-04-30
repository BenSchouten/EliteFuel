import type { Metadata } from "next";
import "./globals.css";
import "@/lib/types";

export const metadata: Metadata = {
  title: "EliteFuel",
  description: "AI-powered youth sports nutrition operations for clubs."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
