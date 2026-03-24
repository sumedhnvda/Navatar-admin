"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { adminData } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <span>{adminData?.hospitalName || "Hospital Dashboard"}</span>
          {adminData?.hospitalId && (
            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-sm font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-mono shadow-sm">
              Hospital ID: {adminData.hospitalId}
            </span>
          )}
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
