"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ReactNode } from "react";

type SessionProviderProps = {
  children: ReactNode;
  session: Session | null;
};

const AuthSessionProvider = ({ children, session }: SessionProviderProps) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default AuthSessionProvider;

