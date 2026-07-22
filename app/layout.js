import "./globals.css";
import { Inter } from "next/font/google";

// Clean, modern sans — matches the saasevenly look.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "saasevenly — fair pricing, everywhere",
  description:
    "Set one base price in USD. Every visitor sees a fair local price, and pays it in their own currency.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
