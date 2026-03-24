"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle Firebase Auth state exactly once
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const qPrimary = query(collection(db, "hospitals"), where("adminEmail", "==", firebaseUser.email), where("status", "==", "active"));
          const snapshotPrimary = await getDocs(qPrimary);
          
          let hospitalDoc = null;
          if (!snapshotPrimary.empty) {
            hospitalDoc = snapshotPrimary.docs[0];
          } else {
            const qSecondary = query(collection(db, "hospitals"), where("additionalAdmins", "array-contains", firebaseUser.email), where("status", "==", "active"));
            const snapshotSecondary = await getDocs(qSecondary);
            if (!snapshotSecondary.empty) {
              hospitalDoc = snapshotSecondary.docs[0];
            }
          }
          
          if (hospitalDoc) {
            setAdminData({
              hospitalId: hospitalDoc.id,
              ...hospitalDoc.data(),
              currentUserEmail: firebaseUser.email,
              isPrimaryAdmin: hospitalDoc.data().adminEmail === firebaseUser.email
            });
          } else {
            console.error("Unauthorized email:", firebaseUser.email);
            await signOut(auth); // Force log out unauthorized users globally
            setAdminData(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching admin data:", error);
          setAdminData(null);
          setUser(null);
        }
      } else {
        setUser(null);
        setAdminData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Route Protection separately to avoid unmounting the auth listener
  useEffect(() => {
    if (loading) return;

    if (user && adminData) {
      // Authenticated admin
      if (pathname === "/login" || pathname === "/") {
        router.replace("/dashboard");
      }
    } else {
      // Not authenticated or not an admin
      if (pathname !== "/login") {
        router.replace("/login");
      }
    }
  }, [user, adminData, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, adminData, loading }}>
      {!loading ? children : (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white" />
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
