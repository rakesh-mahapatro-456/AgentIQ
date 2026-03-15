import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata = {
  title: "AgentIQ — Agent Workspace",
  description: "Research, draft, and sync Salesforce proposals",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ background: "#06090F" }}>
      <body
        className={`${syne.variable} ${dmSans.variable} antialiased`}
        style={{ background: "#06090F", color: "#e4e4e7", height: "100dvh", overflow: "hidden" }}
      >
        {children}
      </body>
    </html>
  );
}