"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ShieldCheck, Plus, Trash2, Mail, AlertCircle } from "lucide-react";

export default function AdminsPage() {
  const { adminData } = useAuth();
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Create a combined list to render
  const primaryAdmin = adminData?.adminEmail || "";
  const additionalAdmins = adminData?.additionalAdmins || [];

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminData?.hospitalId) return;
    if (!newAdminEmail.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    if (newAdminEmail === primaryAdmin || additionalAdmins.includes(newAdminEmail)) {
      setError("This email is already an admin.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const hospitalRef = doc(db, "hospitals", adminData.hospitalId);
      await updateDoc(hospitalRef, {
        additionalAdmins: arrayUnion(newAdminEmail)
      });
      // The auth context snapshot doesn't auto-update dynamically since it's only retrieved once on mount. 
      // For instant UI reflex without forced reload, we can mutate our local context/state conceptually. 
      // Typically, listening via onSnapshot is better, but since adminData is provided by Context, we just refresh.
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      setError("Failed to add admin. Permission denied.");
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (emailToRemove) => {
    if (!adminData?.hospitalId) return;
    if (!confirm(`Are you sure you want to remove \${emailToRemove}?`)) return;

    try {
      const hospitalRef = doc(db, "hospitals", adminData.hospitalId);
      await updateDoc(hospitalRef, {
        additionalAdmins: arrayRemove(emailToRemove)
      });
      window.location.reload();
    } catch (err) {
      alert("Failed to remove admin.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Hospital Administrators</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage authorized personnel who have access to this hospital dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Current Admins</h3>
            </div>
            
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {/* Primary Admin */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                    <span className="text-indigo-700 dark:text-indigo-300 font-bold">{primaryAdmin.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{primaryAdmin}</p>
                    <p className="text-xs text-zinc-500">Primary Administrator</p>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  Owner
                </span>
              </div>

              {/* Additional Admins */}
              {additionalAdmins.map((email) => (
                <div key={email} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <span className="text-zinc-600 dark:text-zinc-400 font-bold">{email.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{email}</p>
                      <p className="text-xs text-zinc-500">Additional Administrator</p>
                    </div>
                  </div>
                  
                  {/* Only primary admin or the user themselves can typically orchestrate this, but for simplicity allow all admins */}
                  <button 
                    onClick={() => handleRemoveAdmin(email)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20"
                    title="Remove Admin"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <form onSubmit={handleAddAdmin} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-1">Add Administrator</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Grant dashboard access to a new email.</p>
            
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400 mt-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="sr-only">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    required
                    placeholder="admin@hospital.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || !newAdminEmail}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-white dark:border-zinc-400 dark:border-t-zinc-950" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Invite Admin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
