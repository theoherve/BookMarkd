"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type DetailItem = {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  href?: string;
};

type StatCardWithDetailProps = {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  className?: string;
  detailType: string;
  detailTitle?: string;
};

const DetailItemRow = ({ item }: { item: DetailItem }) => {
  const initial = item.primary[0]?.toUpperCase() ?? "?";

  const content = (
    <div className="flex items-center gap-2 min-w-0">
      {item.coverUrl ? (
        <div className="relative h-9 w-6 shrink-0 overflow-hidden rounded">
          <Image
            src={item.coverUrl}
            alt={item.primary}
            fill
            className="object-cover"
            sizes="24px"
          />
        </div>
      ) : item.avatarUrl ? (
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
          <Image
            src={item.avatarUrl}
            alt={item.primary}
            fill
            className="object-cover"
            sizes="24px"
          />
        </div>
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {initial}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium leading-tight">{item.primary}</p>
        {item.secondary && (
          <p className="truncate text-xs text-muted-foreground">{item.secondary}</p>
        )}
      </div>
      {item.meta && (
        <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
      )}
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="block rounded-md px-1 py-1 transition-colors hover:bg-muted/60"
      >
        {content}
      </Link>
    );
  }

  return <div className="px-1 py-1">{content}</div>;
};

const DetailSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-2 px-1">
        <Skeleton className="h-6 w-6 rounded-full shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-3 w-12 shrink-0" />
      </div>
    ))}
  </div>
);

const DetailContent = ({
  items,
  loading,
}: {
  items: DetailItem[] | null;
  loading: boolean;
}) => {
  if (loading) return <DetailSkeleton />;
  if (!items?.length)
    return <p className="text-sm text-muted-foreground">Aucun élément</p>;

  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <DetailItemRow key={item.id} item={item} />
      ))}
    </div>
  );
};

export const StatCardWithDetail = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  className,
  detailType,
  detailTitle,
}: StatCardWithDetailProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [items, setItems] = useState<DetailItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const isEmpty = Number(String(value).replace(/\s/g, "")) === 0;
  const isPositive = change !== undefined && change >= 0;

  const fetchData = async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats/${detailType}`);
      const json = await res.json();
      setItems(json.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHoverOpen = (open: boolean) => {
    if (open) fetchData();
  };

  const handleValueClick = () => {
    fetchData();
    setSheetOpen(true);
  };

  const popoverTitle = detailTitle ?? title;

  const cardContent = (
    <Card className={cn("gap-0 py-4", !isEmpty && "cursor-pointer", className)}>
      <CardContent className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          {isEmpty ? (
            <p className="text-2xl font-bold">{value}</p>
          ) : (
            <button
              onClick={handleValueClick}
              className="block text-2xl font-bold underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 transition-colors hover:text-foreground/70 cursor-pointer"
            >
              {value}
            </button>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <ArrowUp className="size-3 text-green-600" />
              ) : (
                <ArrowDown className="size-3 text-red-500" />
              )}
              <span
                className={cn(
                  "font-medium",
                  isPositive ? "text-green-600" : "text-red-500",
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-md bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isEmpty) {
    return cardContent;
  }

  return (
    <>
      <HoverCard onOpenChange={handleHoverOpen} openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>{cardContent}</HoverCardTrigger>
        <HoverCardContent className="w-80 p-3" side="bottom" align="start">
          <p className="mb-2 text-sm font-semibold">{popoverTitle}</p>
          <DetailContent items={items} loading={loading} />
        </HoverCardContent>
      </HoverCard>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{popoverTitle}</SheetTitle>
          </SheetHeader>
          <DetailContent items={items} loading={loading} />
        </SheetContent>
      </Sheet>
    </>
  );
};
