"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    async function doLogout() {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("vsla_active_group_id");
        }
        await logout();
      } catch (e) {
        console.error("Logout failed", e);
      } finally {
        router.push("/login");
      }
    }
    doLogout();
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#2D7A52] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium text-sm">Logging out...</p>
      </div>
    </div>
  );
}
