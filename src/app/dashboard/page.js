"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Users, Bot, Clock, CalendarCheck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

export default function DashboardPage() {
  const { adminData } = useAuth();
  const [stats, setStats] = useState({ totalDoctors: 0, totalNavatars: 0, totalSessions: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!adminData?.hospitalId) return;
      try {
        const hospitalId = adminData.hospitalId;

        // 1. Doctors Count
        const doctorSnap = await getDocs(query(collection(db, "doctors"), where("hospitalId", "==", hospitalId)));
        const doctorsCount = doctorSnap.size;

        // 2. Navatar Count
        const navatarCount = adminData.botIds?.length || 0;

        // Analytics Graph Structure
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = subDays(new Date(), 6 - i);
          return { name: format(d, "MMM dd"), sessions: 0, date: format(d, "yyyy-MM-dd") };
        });

        // 3. History: Client-side sorting/limiting to prevent index builds
        let sessionsCount = 0;
        let recentSess = [];
        try {
          const historySnap = await getDocs(
            query(collection(db, "history"), where("hospitalId", "==", hospitalId))
          );
          sessionsCount = historySnap.size;

          const sessionsData = historySnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Sort client-side by sessionStartedAt desc
          sessionsData.sort((a, b) => {
            const t1 = a.sessionStartedAt?.toDate() || new Date(0);
            const t2 = b.sessionStartedAt?.toDate() || new Date(0);
            return t2 - t1;
          });

          recentSess = sessionsData.slice(0, 10);

          sessionsData.forEach(session => {
            if (session.sessionStartedAt) {
              const dateStr = format(session.sessionStartedAt.toDate(), "yyyy-MM-dd");
              const day = last7Days.find(d => d.date === dateStr);
              if (day) day.sessions += 1;
            }
          });
        } catch (e) {
          console.warn("History fetch failed:", e.message);
        }

        // 4. Bookings: Client-side sorting
        let recentBook = [];
        try {
          const bookingsSnap = await getDocs(
            query(collection(db, "bookings"), where("hospitalId", "==", hospitalId))
          );
          
          const bkData = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          // Sort client-side by createdAt desc
          bkData.sort((a, b) => {
            const t1 = a.createdAt?.toDate() || new Date(0);
            const t2 = b.createdAt?.toDate() || new Date(0);
            return t2 - t1;
          });

          recentBook = bkData;
        } catch (e) {
          console.warn("Bookings fetch failed:", e.message);
        }

        setChartData(last7Days);
        setStats({ totalDoctors: doctorsCount, totalNavatars: navatarCount, totalSessions: sessionsCount });
        setRecentSessions(recentSess);
        setRecentBookings(recentBook);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [adminData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white" />
      </div>
    );
  }

  function formatTo12Hr(time) {
    if (!time) return "—";
    if (time.includes("AM") || time.includes("PM")) return time;
    const [h, m] = time.split(":");
    const hrs = parseInt(h, 10);
    const ampm = hrs >= 12 ? "PM" : "AM";
    const formattedHrs = hrs % 12 || 12;
    return `${formattedHrs}:${m} ${ampm}`;
  }

  const statCards = [
    { name: "Total Doctors", value: stats.totalDoctors, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { name: "Deployed Navatars", value: stats.totalNavatars, icon: Bot, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { name: "Total Sessions", value: stats.totalSessions, icon: Clock, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400"> Live data from Firestore.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.name} className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} shadow-inner`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 pb-1">{stat.name}</p>
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Session Activity</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Sessions recorded in the last 7 days</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fff" }} />
                <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">Bookings History</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Latest scheduled accesses</p>

          <div className="space-y-4">
            {recentBookings.length > 0 ? (
              recentBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex gap-3 items-start border-b border-zinc-100 dark:border-zinc-800/60 pb-3 last:border-0 last:pb-0">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{booking.doctorName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 font-mono">{booking.botId}</p>
                    <p className="mt-1 text-xs text-zinc-400">{booking.date} | {formatTo12Hr(booking.start_time)} - {formatTo12Hr(booking.end_time)}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    booking.status === "Cancelled" 
                      ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/60" 
                      : booking.status === "Completed"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/60"
                        : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-400 dark:border-zinc-800/60"
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 text-center py-10">No bookings yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
