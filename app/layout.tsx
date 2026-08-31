import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import PwaSupport from "./PwaSupport";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#5b54d6",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  const title = "IELTS Pass — 场景化雅思学习";
  const description = "用真实场景串联词汇、听力、口语和阅读，让每一次练习都进入长期记忆。";
  return {
    title,
    description,
    applicationName: "IELTS Pass",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: "IELTS Pass" },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      shortcut: "/favicon.svg",
      apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
    openGraph: { title, description, images: [{ url: image, width: 1536, height: 1024, alt: "IELTS AI 场景化学习" }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}<PwaSupport /></body></html>;
}
