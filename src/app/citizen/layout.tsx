"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="citizen">{children}</AuthGuard>;
}
