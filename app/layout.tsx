// layout.tsx (Server Component)
import type { Metadata } from "next";
import ClientWrapper from "./ClientWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trash Robot Dashboard",
  description: "Control your Trash Robot from your browser",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
