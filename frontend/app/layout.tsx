import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroBreeze | Clean-Air Recreational Routing",
  description: "Navigate urban loops with minimized PM2.5 lung exposure.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
