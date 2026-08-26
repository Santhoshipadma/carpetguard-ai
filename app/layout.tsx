import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarpetGuard AI | Visual carpet screening",
  description:
    "A privacy-first visual screening tool that flags unusual carpet patches and helps you decide sensible next steps.",
  openGraph: {
    title: "CarpetGuard AI",
    description: "Visual moisture-risk screening for carpets",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "CarpetGuard AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CarpetGuard AI",
    description: "Visual moisture-risk screening for carpets",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
