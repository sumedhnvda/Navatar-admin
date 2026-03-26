"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
import { ArrowLeft, Clock, MessageSquare, User, Calendar, Timer, Bot } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, formatDuration, intervalToDuration } from "date-fns";

function formatSecs(secs) {
  if (!secs) return "—";
  if (secs < 60) return Math.round(secs) + "s";
  const d = intervalToDuration({ start: 0, end: secs * 1000 });
  return formatDuration(d, { format: ["minutes", "seconds"] });
}

function formatTo12Hr(time) {
  if (!time) return "—";
  if (time.includes("AM") || time.includes("PM")) return time;
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const h = parts[0];
  const m = parts[1];
  const hrs = parseInt(h, 10);
  const ampm = hrs >= 12 ? "PM" : "AM";
  const formattedHrs = hrs % 12 || 12;
  return formattedHrs + ":" + m + " " + ampm;
}

export default function NavatarHistoryPage() {
  const { id } = useParams();
  const { adminData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [navatarInfo, setNavatarInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [avgDuration, setAvgDuration] = useState("—");
  const [totalDuration, setTotalDuration] = useState("—");
  const [activeTab, setActiveTab] = useState("sessions");
  const [visibleSessions, setVisibleSessions] = useState(5);
  const [visibleBookings, setVisibleBookings] = useState(5);

  useEffect(() => {
    if (!adminData?.hospitalId || !id) return;
    
    // 1. Real-time Status Listener
    const unsubNavatar = onSnapshot(doc(db, "navatars", id), (snap) => {
      if (snap.exists()) {
        setNavatarInfo(snap.data());
      } else {
        setNavatarInfo(null);
      }
    });

    async function fetchHistory() {
      setLoading(true);
      try {
        // 2. Fetch History (Sessions)
        const sessionsSnap = await getDocs(
          query(collection(db, "history"), where("botId", "==", id))
        );
        const sessionsData = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        sessionsData.sort((a, b) => {
          const t1 = a.sessionStartedAt?.toDate() || new Date(0);
          const t2 = b.sessionStartedAt?.toDate() || new Date(0);
          return t2 - t1;
        });
        setSessions(sessionsData);

        // 3. Fetch Bookings
        const bookingsSnap = await getDocs(
          query(collection(db, "bookings"), where("botId", "==", id))
        );
        const bookingsData = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        bookingsData.sort((a, b) => {
          const t1 = a.createdAt?.toDate() || new Date(0);
          const t2 = b.createdAt?.toDate() || new Date(0);
          return t2 - t1;
        });
        setBookings(bookingsData);

        // 4. Stats
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = subDays(new Date(), 6 - i);
          return { name: format(d, "MMM dd"), sessions: 0, date: format(d, "yyyy-MM-dd") };
        });

        let durationSum = 0;
        let durationCount = 0;

        sessionsData.forEach(session => {
          if (session.sessionStartedAt) {
            const dateStr = format(session.sessionStartedAt.toDate(), "yyyy-MM-dd");
            const day = last7Days.find(d => d.date === dateStr);
            if (day) day.sessions += 1;
          }
          if (session.durationSeconds) {
            durationSum += Number(session.durationSeconds);
            durationCount += 1;
          }
        });

        setChartData(last7Days);

        if (durationCount > 0) {
          setAvgDuration(formatSecs(durationSum / durationCount));
          setTotalDuration(formatSecs(durationSum));
        }
      } catch (err) {
        console.error("Error fetching history:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
    return () => unsubNavatar();
  }, [adminData, id]);

  const isInUse = navatarInfo?.activeDoctorId;
  const statusLower = navatarInfo?.status?.toLowerCase() || "";
  const isOffline = statusLower === "offline";
  const exists = !!navatarInfo;

  const toggleStatus = async () => {
    if (!exists) return;
    const nextStatus = isOffline ? "available" : "offline";
    try {
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "navatars", id), { status: nextStatus });
      // Local state will be updated via onSnapshot
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <Link href="/dashboard/navatars" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
          <ArrowLeft className="h-5 w-5 text-zinc-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold">{navatarInfo?.name || (exists ? "Loading..." : "Navatar Detail")}</h2>
            <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono font-bold">{id}</span>
            <div className="flex items-center gap-2 ml-auto">
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${
                !exists
                  ? "bg-zinc-50 text-zinc-400 border-zinc-200"
                  : isOffline 
                    ? "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-500" 
                    : isInUse 
                      ? "bg-blue-50 text-blue-600 border-blue-200" 
                      : "bg-emerald-50 text-emerald-600 border-emerald-200"
              }`}>
                {!exists ? "Bot Not Setup" : isOffline ? "Offline" : isInUse ? `Engaged — ${navatarInfo.activeDoctorName}` : "Available"}
              </span>
              
              {exists && (
                <button 
                  onClick={toggleStatus}
                  className={`text-[10px] font-bold px-3 py-1 rounded transition-all border ${
                    isOffline 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" 
                      : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  }`}
                >
                  {isOffline ? "MAKE AVAILABLE" : "MAKE OFFLINE"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!exists && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-zinc-200 border-dashed dark:border-zinc-800">
          <Bot className="h-10 w-10 text-zinc-400 mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Configuration Pending</h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">
            This Navatar has not been set up yet. Once the bot is activated, its statistics and history will appear here.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: MessageSquare, label: "Total Sessions", val: sessions.length, bg: "bg-blue-50 dark:bg-blue-900/20", color: "text-blue-600" },
          { icon: Clock, label: "Avg. Duration", val: avgDuration, bg: "bg-purple-50 dark:bg-purple-900/20", color: "text-purple-600" },
          { icon: Timer, label: "Total Time", val: totalDuration, bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-600" }
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${c.bg}`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
            <div><p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{c.label}</p><p className="text-2xl font-bold">{c.val}</p></div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
        <h3 className="text-base font-semibold mb-1">Session Frequency Rates</h3>
        <p className="text-sm text-zinc-500 mb-6">Last 7 days strictly mapped based on actual session starts.</p>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" opacity={0.15} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="sessions" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 px-6 py-2 flex items-center gap-4">
          {["sessions", "bookings"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`py-3 text-sm font-semibold border-b-2 ${activeTab === t ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50" : "border-transparent text-zinc-500"}`}>
              {t === "sessions" ? "Access Log" : "Bookings"}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {activeTab === "sessions" ? (
            sessions.length === 0 ? <p className="p-6 text-center text-zinc-500">No sessions recorded.</p> : (
              <div className="space-y-4">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800"><thead className="bg-zinc-50/80 dark:bg-zinc-900/40"><tr><th className="px-6 py-3 text-left text-xs font-semibold">Doctor</th><th className="px-6 py-3 text-left text-xs font-semibold">Start</th><th className="px-6 py-3 text-left text-xs font-semibold">Duration</th></tr></thead><tbody>{sessions.slice(0, visibleSessions).map(s => (
                  <tr key={s.id} className="hover:bg-zinc-50/80 transition-colors"><td className="px-6 py-4"><div><p className="text-sm font-medium">{s.doctorName || "Unknown"}</p></div></td><td className="px-6 py-4 text-sm">{s.sessionStartedAt ? format(s.sessionStartedAt.toDate(), "MMM d, hh:mm a") : "—"}</td><td className="px-6 py-4 text-sm font-mono">{formatSecs(s.durationSeconds)}</td></tr>
                ))}</tbody></table>
                {sessions.length > visibleSessions && (
                  <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60">
                    <button onClick={() => setVisibleSessions(prev => prev + 5)} className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">Load More</button>
                  </div>
                )}
              </div>
            )
          ) : (
            bookings.length === 0 ? <p className="p-6 text-center text-zinc-500">No bookings available.</p> : (
              <div className="space-y-4">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800"><thead className="bg-zinc-50/80 dark:bg-zinc-900/40"><tr><th className="px-6 py-3 text-left text-xs font-semibold">Doctor</th><th className="px-6 py-3 text-left text-xs font-semibold">Date</th><th className="px-6 py-3 text-left text-xs font-semibold">Slot</th><th className="px-6 py-3 text-left text-xs font-semibold">Status</th></tr></thead><tbody>{bookings.slice(0, visibleBookings).map(b => (
                  <tr key={b.id} className="hover:bg-zinc-50/80 transition-colors"><td className="px-6 py-4"><div><p className="text-sm font-medium">{b.doctorName || "Unknown"}</p></div></td><td className="px-6 py-4 text-sm">{b.date}</td><td className="px-6 py-4 text-sm">{formatTo12Hr(b.start_time)} - {formatTo12Hr(b.end_time)}</td><td className="px-6 py-4 text-sm"><span className={`p-1 rounded ${b.status === "Cancelled" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : b.status === "Completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900/20 dark:text-zinc-400"}`}>{b.status}</span></td></tr>
                ))}</tbody></table>
                {bookings.length > visibleBookings && (
                  <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60">
                    <button onClick={() => setVisibleBookings(prev => prev + 5)} className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">Load More</button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
