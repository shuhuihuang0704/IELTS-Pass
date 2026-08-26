import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IELTS AI — 场景化雅思学习",
  description: "用真实场景串联词汇、听力、口语和阅读，让每一次练习都进入长期记忆。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
