"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, ListPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FabAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  ariaLabel: string;
};

const fabActions: FabAction[] = [
  {
    label: "Ajouter un livre",
    icon: BookOpen,
    href: "/books/create",
    ariaLabel: "Créer un nouveau livre",
  },
  {
    label: "Créer une liste",
    icon: ListPlus,
    href: "/lists/create",
    ariaLabel: "Créer une nouvelle liste",
  },
];

const MobileFab = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleActionClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      {/* Menu actions */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Actions list */}
          <div className="absolute bottom-16 right-0 flex flex-col gap-2">
            {fabActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  onClick={() => handleActionClick(action.href)}
                  aria-label={action.ariaLabel}
                  className={cn(
                    "h-auto gap-3 rounded-full bg-card px-4 py-3 shadow-lg",
                    "animate-in fade-in slide-in-from-bottom-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </>
      )}

      {/* FAB Button */}
      <Button
        onClick={handleToggle}
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu d'ajout"}
        aria-expanded={isOpen}
        className={cn(
          "size-14 rounded-full bg-accent text-accent-foreground shadow-lg",
          "transition-transform duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          isOpen && "rotate-45",
        )}
      >
        {isOpen ? (
          <X className="size-6" aria-hidden="true" />
        ) : (
          <Plus className="size-6" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
};

export default MobileFab;

