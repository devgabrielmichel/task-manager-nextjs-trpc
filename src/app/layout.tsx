import type { Metadata } from "next";
import Link from "next/link";
import { TRPCProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Simple task manager built with Next.js and tRPC",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>
          <div className="container">
            <header className="app-header">
              <Link href="/" className="brand">
                Task Manager
              </Link>
            </header>
            {children}
          </div>
        </TRPCProvider>
      </body>
    </html>
  );
}
