"use client";

import { useEffect, useTransition, useState } from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getUnreadCount } from "@/server/actions/notifications";

const NotificationBell = () => {
  const [count, setCount] = useState<number>(0);
  const [isPending] = useTransition();

  useEffect(() => {
    void (async () => {
      const result = await getUnreadCount();
      if (result.success) {
        setCount(result.count);
      }
    })();
  }, []);

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative"
      disabled={isPending}
      aria-label="Voir les notifications"
    >
      <Link href="/notifications">
        {count > 0 ? (
          <BellRing className="h-5 w-5 text-accent-foreground" aria-hidden />
        ) : (
          <Bell className="h-5 w-5" aria-hidden />
        )}
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold leading-none text-accent-foreground">
            {count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
};

export default NotificationBell;


