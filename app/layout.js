import "./globals.css";
import { Inter } from "next/font/google";

// Clean, modern sans — matches the saasevenly look.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const DESCRIPTION =
  "Free, open-source purchasing-power pricing for SaaS. Set one base price in USD; every visitor sees a fair local price and pays it in their own currency, through your own payment gateway. Self-hosted, MIT licensed.";

export const metadata = {
  metadataBase: new URL("https://saasevenly.vercel.app"),
  title: {
    default: "saasevenly — open-source fair pricing, everywhere",
    template: "%s — saasevenly",
  },
  description: DESCRIPTION,
  keywords: [
    "purchasing power parity pricing",
    "PPP pricing",
    "regional pricing",
    "geo pricing",
    "SaaS pricing",
    "open source",
    "self-hosted",
  ],
  openGraph: {
    title: "saasevenly — open-source fair pricing, everywhere",
    description: DESCRIPTION,
    type: "website",
    siteName: "saasevenly",
  },
  twitter: {
    card: "summary_large_image",
    title: "saasevenly — open-source fair pricing, everywhere",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
