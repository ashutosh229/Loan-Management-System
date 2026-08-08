"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";

/**
 * Client-side gate. This is a UX convenience only (hides the page/menu item) —
 * the real enforcement happens on the backend via requireAuth + requireRole
 * middleware, which rejects unauthorized API calls regardless of what the
 * frontend shows.
 */
export default function RequireRole({
  allowed,
  children,
}: {
  allowed: Role[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin" && !allowed.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, loading, allowed, router]);

  if (loading || !user) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }
  if (user.role !== "admin" && !allowed.includes(user.role)) {
    return <div className="p-8 text-slate-500">Redirecting…</div>;
  }

  return <>{children}</>;
}
