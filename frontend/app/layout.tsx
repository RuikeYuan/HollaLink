import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dutch Business Navigator",
  description: "AI business advisor for international entrepreneurs entering the Dutch market",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-navy-900 text-white sticky top-0 z-10 shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-wide">
              Dutch Business Navigator
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-slate-300">Home</Link>
              <Link href="/roadmap" className="hover:text-slate-300">Compliance Roadmap</Link>
              <Link href="/chat" className="hover:text-slate-300">AI Consultation</Link>
              <Link href="/report" className="hover:text-slate-300">Generate Report</Link>
              <Link href="/admin" className="hover:text-slate-300">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
      </body>
    </html>
  );
}
