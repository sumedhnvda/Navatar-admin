"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Bot, Activity, UserCheck } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function NavatarsPage() {
  const { adminData } = useAuth();
  const [navatars, setNavatars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNavatars() {
      if (!adminData?.botIds || !Array.isArray(adminData.botIds) || adminData.botIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Query the navatars collection using the hospital's assigned botIds
        // Firestore `in` queries support up to 30 items; slice if needed
        const subset = adminData.botIds.slice(0, 30);
        const q = query(collection(db, "navatars"), where("__name__", "in", subset));
        const snap = await getDocs(q);

        // Build a map of fetched docs keyed by ID
        const fetchedMap = {};
        snap.docs.forEach(d => { fetchedMap[d.id] = d.data(); });

        // Preserve the order from botIds; fallback gracefully if doc doesn't exist yet
        const docsData = adminData.botIds.map(botId => ({
          id: botId,
          ...(fetchedMap[botId] || {}),
        }));

        setNavatars(docsData);
      } catch (err) {
        console.error("Error fetching navatars:", err);
        // Fallback: still show the botIds without live data
        setNavatars(adminData.botIds.map(botId => ({ id: botId })));
      } finally {
        setLoading(false);
      }
    }
    loadNavatars();
  }, [adminData]);

  const isInUse = (nav) => !!nav.activeDoctorId;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Deployed Navatars</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Live status of your hospital&apos;s AI assistants. Green = available, blue = in session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white" />
          </div>
        ) : navatars.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-zinc-200 border-dashed dark:border-zinc-800">
            <Bot className="h-10 w-10 text-zinc-400 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">No Navatars Deployed</h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-sm">
              Your hospital does not have any Navatars provisioned yet. Contact Super Admin to request bots.
            </p>
          </div>
        ) : (
          navatars.map((nav) => {
            const inUse = isInUse(nav);
            return (
              <div key={nav.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-inner ${inUse ? "bg-blue-50 dark:bg-blue-900/20" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                      <Bot className={`h-6 w-6 ${inUse ? "text-blue-600 dark:text-blue-400" : "text-indigo-600 dark:text-indigo-400"}`} />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide border ${
                      inUse
                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                    }`}>
                      {inUse ? "In Session" : "Available"}
                    </span>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 font-mono">{nav.id}</h3>

                    {inUse ? (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
                        <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{nav.activeDoctorName || "Unknown Doctor"}</p>
                          <p className="text-[11px] text-blue-500 dark:text-blue-500 font-mono">{nav.activeDoctorId}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No active session</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800/60 dark:bg-zinc-900/50">
                  <div className="flex w-full items-center justify-end">
                    <Link
                      href={`/dashboard/navatars/${nav.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      View History
                      <Activity className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
