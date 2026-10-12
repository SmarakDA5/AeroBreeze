import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroBreeze | Clean-Air Recreational Routing",
  description: "Navigate urban loops with minimized PM2.5 lung exposure.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-[100dvh] w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
