"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { adminData } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {adminData?.hospitalName || "Hospital Dashboard"}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {adminData && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex flex-col items-end">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {adminData.contactName || "Admin"}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                {adminData.adminEmail}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
