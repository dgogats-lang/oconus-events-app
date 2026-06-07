import type { Metadata, Viewport } from "next";
import "./globals.css";
import SWRegistration from "./components/SWRegistration";
import OfflineBanner from "./components/OfflineBanner";

export const metadata: Metadata = {
  title: "Ops",
  description: "Travel ops for OCONUS events",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ops",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0C2340",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SWRegistration />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
