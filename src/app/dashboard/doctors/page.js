"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
import { Plus, Trash2, Ban, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function DoctorsPage() {
  const { adminData } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      if (!adminData?.hospitalId) return;
      setLoading(true);
      try {
        const q = query(collection(db, "doctors"), where("hospitalId", "==", adminData.hospitalId));
        const snap = await getDocs(q);
        const docsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDoctors(docsData);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, [adminData]);

  const handleDelete = async (doctor) => {
    if (!confirm(`Are you sure you want to delete Dr. ${doctor.name}?`)) return;
    try {
      // 1. Delete from UploadThing if image exists
      if (doctor.photoUrl) {
        try {
          const fileKey = doctor.photoUrl.split("/f/")[1];
          if (fileKey) {
            await fetch("/api/uploadthing/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileKeys: [fileKey] }),
            });
          }
        } catch (err) {
          console.error("Failed to delete image from UploadThing:", err);
        }
      }

      // 2. Delete from Firestore
      await deleteDoc(doc(db, "doctors", doctor.id));
      setDoctors(doctors.filter(d => d.id !== doctor.id));
    } catch (e) {
      alert("Failed to delete doctor");
    }
  };

  const handleToggleStatus = async (doctor) => {
    const newStatus = doctor.status === "disabled" ? "active" : "disabled";
    try {
      await updateDoc(doc(db, "doctors", doctor.id), { status: newStatus });
      setDoctors(doctors.map(d => d.id === doctor.id ? { ...d, status: newStatus } : d));
    } catch (e) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Doctors Registry</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your hospital&apos;s doctors and their Navatar access levels.
          </p>
        </div>
        <Link
          href="/dashboard/doctors/add"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
        >
          <Plus className="h-4 w-4" />
          Add Doctor
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/40">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">Doctor</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">Designation</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">Status</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex justify-center items-center">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white" />
                    </div>
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center text-zinc-500">
                    <p className="text-sm font-medium">No doctors found.</p>
                    <p className="text-sm mt-1">Start by adding a doctor to your hospital registry.</p>
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-zinc-50/80 transition-colors dark:hover:bg-zinc-900/30">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-4">
                         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                           {doctor.photoUrl ? (
                             <Image 
                               src={doctor.photoUrl} 
                               alt={doctor.name} 
                               width={40} 
                               height={40} 
                               className="h-full w-full object-cover"
                             />
                           ) : (
                             <span className="text-zinc-600 dark:text-zinc-400 text-sm font-bold">
                               {doctor.name?.charAt(0)?.toUpperCase() || "D"}
                             </span>
                           )}
                         </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{doctor.name}</div>
                          <div className="text-[13px] mt-0.5 text-zinc-500 dark:text-zinc-400">{doctor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{doctor.designation || "Not specified"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        doctor.status === 'disabled' 
                          ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      }`}>
                        {doctor.status === 'disabled' ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleToggleStatus(doctor)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg hover:text-amber-600 transition-colors dark:hover:bg-zinc-800" title={doctor.status === 'disabled' ? 'Enable' : 'Disable'}>
                          {doctor.status === 'disabled' ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleDelete(doctor)} className="p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors dark:hover:bg-red-950/30" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
