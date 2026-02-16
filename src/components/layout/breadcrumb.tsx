import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  /** If true, renders JSON-LD BreadcrumbList for SEO */
  withJsonLd?: boolean;
};

export const Breadcrumb = ({ items, withJsonLd = true }: BreadcrumbProps) => {
  return (
    <>
      {withJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: items.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.label,
                item: item.href.startsWith("http") ? item.href : `https://bookmarkd.app${item.href}`,
              })),
            }),
          }}
        />
      )}
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-x-2">
              {index > 0 ? (
                <span aria-hidden className="text-muted-foreground/60">
                  /
                </span>
              ) : null}
              {index < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};
