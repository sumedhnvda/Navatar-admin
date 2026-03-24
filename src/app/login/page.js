"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { Bot, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      const qPrimary = query(collection(db, "hospitals"), where("adminEmail", "==", result.user.email), where("status", "==", "active"));
      const snapPrimary = await getDocs(qPrimary);
      
      if (snapPrimary.empty) {
        const qSecondary = query(collection(db, "hospitals"), where("additionalAdmins", "array-contains", result.user.email), where("status", "==", "active"));
        const snapSecondary = await getDocs(qSecondary);
        if (snapSecondary.empty) {
          await signOut(auth); // Disqualify
          throw new Error("Your email is not authorized as a hospital administrator. Please contact Super Admin.");
        }
      }
      
      // Valid admin; the AuthContext listener will pick this up automatically and redirect.
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white dark:bg-zinc-950 p-10 shadow-2xl border border-zinc-100 dark:border-zinc-900 transition-all">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 shadow-inner">
            <Bot className="h-8 w-8 text-blue-600 dark:text-blue-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-center">
            Navatar Admin Console
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
            Sign in with authorized hospital credentials to continue deployment configurations.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="font-medium text-[13px]">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-900 px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 dark:focus:ring-white dark:focus:ring-offset-zinc-950"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-white dark:border-zinc-400 dark:border-t-zinc-950" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
