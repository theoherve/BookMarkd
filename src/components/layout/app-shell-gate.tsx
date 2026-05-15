"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import AppShell from "@/components/layout/app-shell";

const BYPASS_PREFIXES = ["/admin", "/login", "/signup", "/offline"] as const;

type AppShellGateProps = {
  children: ReactNode;
};

const AppShellGate = ({ children }: AppShellGateProps) => {
  const pathname = usePathname();
  const bypass = BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (bypass) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
};

export default AppShellGate;
