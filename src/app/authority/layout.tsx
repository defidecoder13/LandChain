"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AuthorityLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="authority">{children}</AuthGuard>;
}
