"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AddDoctorPage() {
  const router = useRouter();
  const { adminData } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminData?.hospitalId) return;
    
    setLoading(true);
    setError("");

    try {
      // Validate duplicate email
      const q = query(collection(db, "doctors"), where("email", "==", formData.email));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        throw new Error("A doctor with this email already exists.");
      }

      // Save to Firestore
      await addDoc(collection(db, "doctors"), {
        ...formData,
        hospitalId: adminData.hospitalId,
        status: "active",
        createdAt: serverTimestamp(),
      });

      router.push("/dashboard/doctors");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to add doctor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <Link 
          href="/dashboard/doctors"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-500" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Add New Doctor</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create a profile to grant them access to hospital Navatars.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-5">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-900 dark:text-zinc-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Dr. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-zinc-900 dark:text-zinc-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="john.doe@hospital.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="designation" className="text-sm font-medium text-zinc-900 dark:text-zinc-300">
                Designation <span className="text-red-500">*</span>
              </label>
              <input
                id="designation"
                type="text"
                required
                placeholder="e.g. Senior Cardiologist"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/doctors"
            className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-950"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Doctor"}
          </button>
        </div>
      </form>
    </div>
  );
}
