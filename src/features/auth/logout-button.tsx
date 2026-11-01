"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "./actions";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    try {
      const res = await signOut();
      if (res?.success) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
    >
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}