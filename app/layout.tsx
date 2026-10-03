import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Customer Service Operations Console",
  description: "Operations console for searching customers and creating service requests.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
