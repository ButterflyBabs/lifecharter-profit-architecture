import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Profit Architecture",
  description: "Business assessment, profitability analysis, and ongoing advisory platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
