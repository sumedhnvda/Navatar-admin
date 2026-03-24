"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { MessageSquare, Star } from "lucide-react";
import { format } from "date-fns";

export default function FeedbackPage() {
  const { adminData } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalFeedback: 0, avgRating: 0 });

  useEffect(() => {
    async function fetchFeedback() {
      if (!adminData?.hospitalId) return;
      setLoading(true);
      try {
        const hospitalId = adminData.hospitalId;

        // Query strictly by hospitalId from the 'feedbacks' collection
        const feedbackSnap = await getDocs(
          query(collection(db, "feedbacks"), where("hospitalId", "==", hospitalId))
        );

        let fbData = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort by createdAt desc
        fbData.sort((a, b) => {
          const t1 = a.createdAt?.toDate() || new Date(0);
          const t2 = b.createdAt?.toDate() || new Date(0);
          return t2 - t1;
        });

        setFeedbacks(fbData);

        // Calculate stats
        const total = fbData.length;
        const sumRating = fbData.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
        const avg = total > 0 ? (sumRating / total).toFixed(1) : "—";

        setStats({ totalFeedback: total, avgRating: avg });
      } catch (err) {
        console.error("Error fetching feedback:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
  }, [adminData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">User Feedback</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">View customer feedback for your Navatars.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { name: "Total Feedback", value: stats.totalFeedback, icon: MessageSquare, bg: "bg-blue-50 dark:bg-blue-900/20", color: "text-blue-600 dark:text-blue-400" },
          { name: "Average Rating", value: stats.avgRating, icon: Star, bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-600 dark:text-amber-400" },
        ].map((stat) => (
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

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          {feedbacks.length === 0 ? (
            <p className="p-10 text-center text-zinc-500">No feedback submitted yet.</p>
          ) : (
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50/80 dark:bg-zinc-900/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100">Navatar</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100">Comment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {feedbacks.map((fb) => (
                  <tr key={fb.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{fb.botId || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{fb.doctorName || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold">{fb.rating || "—"}</span>
                        {fb.rating && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-md truncate hover:text-clip hover:max-w-none transition-all">
                        {fb.feedback || "No comment"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {fb.createdAt ? format(fb.createdAt.toDate(), "MMM d, hh:mm a") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
