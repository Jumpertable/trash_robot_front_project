"use client";

import { Audiowide } from "next/font/google";
import { ThemeProvider } from "next-themes";

const audiowide = Audiowide({ weight: "400", subsets: ["latin"] });

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className={`${audiowide.className} antialiased`}>
        {children}
      </div>
    </ThemeProvider>
  );
}
