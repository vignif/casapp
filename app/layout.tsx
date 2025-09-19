import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Estate Manager",
  description: "Manage properties, maintenance, calendars, and tenants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b sticky top-0 bg-white/80 backdrop-blur z-10">
            <nav className="max-w-5xl mx-auto flex items-center justify-between p-4">
              <a href="/" className="font-semibold">Estate Manager</a>
              <div className="flex gap-4 text-sm">
                <a href="/" className="hover:underline">Dashboard</a>
                <a href="/properties" className="hover:underline">Properties</a>
                <a href="/calendar" className="hover:underline">Calendar</a>
              </div>
            </nav>
          </header>
          <main className="flex-1 max-w-5xl mx-auto w-full p-4">{children}</main>
          <footer className="border-t text-xs text-gray-500 p-4 text-center">© {new Date().getFullYear()} Estate Manager</footer>
        </div>
      </body>
    </html>
  );
}
