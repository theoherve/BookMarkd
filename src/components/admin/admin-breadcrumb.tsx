"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  users: "Utilisateurs",
  books: "Livres",
  feedback: "Feedback",
  tags: "Tags & Ressentis",
  analytics: "Analytiques",
  emails: "Emails",
  blog: "Blog",
  system: "Santé système",
  new: "Nouveau",
  edit: "Modifier",
};

type AdminBreadcrumbProps = {
  pathname: string;
};

export const AdminBreadcrumb = ({ pathname }: AdminBreadcrumbProps) => {
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = SEGMENT_LABELS[segment] ?? segment;
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
          {item.isLast ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "text-muted-foreground hover:text-foreground transition-colors"
              )}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
