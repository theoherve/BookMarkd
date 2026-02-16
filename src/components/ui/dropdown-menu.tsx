"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

const useDropdownMenu = () => {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenu components must be used within DropdownMenu.Root");
  return ctx;
};

type DropdownMenuRootProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DropdownMenuRoot = ({ children, open: controlledOpen, onOpenChange }: DropdownMenuRootProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );
  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);
  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

type DropdownMenuTriggerProps = React.ComponentProps<"button"> & {
  asChild?: boolean;
};

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { open, setOpen } = useDropdownMenu();
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      setOpen(!open);
    };
    const handleClickGeneric = (e: React.MouseEvent<unknown>) => {
      handleClick(e as React.MouseEvent<HTMLButtonElement>);
    };
    if (asChild && React.isValidElement(children)) {
      // eslint-disable-next-line react-hooks/rules-of-hooks -- Merging refs with cloneElement is a valid pattern
      const mergedRef = React.useCallback(
        (node: unknown) => {
          if (typeof ref === "function") {
            ref(node as HTMLButtonElement);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node as HTMLButtonElement;
          }
          const childRef = (children as React.ReactElement & { ref?: React.Ref<unknown> }).ref;
          if (typeof childRef === "function") {
            childRef(node);
          } else if (childRef) {
            (childRef as React.MutableRefObject<unknown>).current = node;
          }
        },
        [ref, children]
      );
      return React.cloneElement(children, {
        ref: mergedRef,
        onClick: handleClickGeneric,
        "aria-expanded": open,
        "aria-haspopup": "menu",
      } as React.Attributes & { ref?: React.Ref<unknown>; onClick?: (e: React.MouseEvent<unknown>) => void; "aria-expanded"?: boolean; "aria-haspopup"?: string });
    }
    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

type DropdownMenuContentProps = React.ComponentProps<"div"> & {
  align?: "start" | "end" | "center";
};

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "end", children, ...props }, ref) => {
    const { open, setOpen } = useDropdownMenu();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (contentRef.current?.contains(target)) return;
        const trigger = (e.currentTarget as Document).querySelector("[aria-haspopup='menu']");
        if (trigger?.contains(target)) return;
        setOpen(false);
      };
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [open, setOpen]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        role="menu"
        aria-orientation="vertical"
        className={cn(
          "absolute z-50 mt-2 min-w-40 overflow-hidden rounded-md border border-border bg-card p-1 text-foreground shadow-lg",
          align === "end" && "right-0",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

type DropdownMenuItemProps = React.ComponentProps<"div"> & {
  asChild?: boolean;
};

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const { setOpen } = useDropdownMenu();
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        (e.currentTarget as HTMLElement).click();
      }
    };
    const handleClick = () => setOpen(false);
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
      // eslint-disable-next-line react-hooks/rules-of-hooks -- Merging refs with cloneElement is a valid pattern
      const mergedRef = React.useCallback(
        (node: unknown) => {
          if (typeof ref === "function") {
            ref(node as HTMLDivElement);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node as HTMLDivElement;
          }
          const childRef = (child as React.ReactElement & { ref?: React.Ref<unknown> }).ref;
          if (typeof childRef === "function") {
            childRef(node);
          } else if (childRef) {
            (childRef as React.MutableRefObject<unknown>).current = node;
          }
        },
        [ref, child]
      );
      const mergedProps = {
        ref: mergedRef,
        role: "menuitem",
        onKeyDown: handleKeyDown,
        onClick: (e: React.MouseEvent) => {
          child.props.onClick?.(e);
          handleClick();
        },
      };
      return React.cloneElement(child, mergedProps as React.Attributes & { ref?: React.Ref<unknown>; role?: string; onKeyDown?: (e: React.KeyboardEvent) => void; onClick?: (e: React.MouseEvent) => void });
    }
    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={0}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
          className
        )}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div role="separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
);

export {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
