"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</div>
        </main>
        <MobileNav />
      </div>
    </SessionProvider>
  );
}
