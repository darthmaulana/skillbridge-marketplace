import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/components/layout/ServiceWorkerRegistration";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: {
    default: "SkillBridge",
    template: "%s | SkillBridge",
  },
  description: "Find jobs, offer skills, and connect safely.",
  applicationName: "SkillBridge",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppStateProvider>{children}</AppStateProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
