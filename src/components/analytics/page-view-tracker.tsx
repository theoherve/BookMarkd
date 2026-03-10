"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const getSessionId = () => {
  if (typeof window === "undefined") return undefined;
  let id = sessionStorage.getItem("bm_sid");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("bm_sid", id);
  }
  return id;
};

export const PageViewTracker = () => {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    // Don't track admin pages
    if (pathname.startsWith("/admin")) return;

    const sessionId = getSessionId();

    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
        sessionId,
      }),
    }).catch(() => {
      // Silently fail - analytics should never break UX
    });
  }, [pathname]);

  return null;
};
