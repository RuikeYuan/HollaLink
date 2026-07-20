import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "荷兰开店通 | Dutch Business Navigator",
  description: "中国创业者进入荷兰市场的 AI 商业顾问",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <header className="bg-navy-900 text-white sticky top-0 z-10 shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-wide">
              荷兰开店通 <span className="text-slate-300 font-normal text-sm ml-1">Dutch Business Navigator</span>
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-slate-300">首页</Link>
              <Link href="/chat" className="hover:text-slate-300">AI 咨询</Link>
              <Link href="/report" className="hover:text-slate-300">生成报告</Link>
              <Link href="/admin" className="hover:text-slate-300">管理后台</Link>
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
      </body>
    </html>
  );
}
