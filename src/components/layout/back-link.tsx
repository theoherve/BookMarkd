import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href: string;
  label: string;
  ariaLabel?: string;
  className?: string;
};

const backLinkClassName =
  "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md w-fit";

const BackLink = ({
  href,
  label,
  ariaLabel,
  className,
}: BackLinkProps) => {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      className={className ?? backLinkClassName}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
};

export default BackLink;
