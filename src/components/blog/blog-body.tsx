import Link from "next/link";

type BlogBodyProps = {
  body: string;
};

/**
 * Renders blog body with simple markdown-like syntax:
 * - Paragraphs (double newline)
 * - [text](url) for links
 * - **text** for bold
 */
export const BlogBody = ({ body }: BlogBodyProps) => {
  const paragraphs = body
    .trim()
    .split(/\n\n+/)
    .filter(Boolean);

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
      {paragraphs.map((paragraph, index) => {
        const parts: Array<{ type: "text" | "link" | "bold"; content: string; href?: string }> = [];
        let remaining = paragraph;
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
        const boldRegex = /\*\*([^*]+)\*\*/;

        while (remaining.length > 0) {
          const linkMatch = remaining.match(linkRegex);
          const boldMatch = remaining.match(boldRegex);
          const linkIndex = linkMatch ? remaining.indexOf(linkMatch[0]) : -1;
          const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;

          let nextIndex = -1;
          let match: RegExpMatchArray | null = null;
          let type: "link" | "bold" = "link";

          if (linkIndex >= 0 && (boldIndex < 0 || linkIndex <= boldIndex)) {
            nextIndex = linkIndex;
            match = linkMatch;
            type = "link";
          } else if (boldIndex >= 0) {
            nextIndex = boldIndex;
            match = boldMatch;
            type = "bold";
          }

          if (nextIndex > 0) {
            parts.push({ type: "text", content: remaining.slice(0, nextIndex) });
          }
          if (match) {
            if (type === "link") {
              parts.push({
                type: "link",
                content: match[1] ?? "",
                href: match[2] ?? "",
              });
            } else {
              parts.push({ type: "bold", content: match[1] ?? "" });
            }
            remaining = remaining.slice(nextIndex + match[0].length);
          } else {
            if (remaining.length > 0) {
              parts.push({ type: "text", content: remaining });
            }
            break;
          }
        }

        if (parts.length === 0 && paragraph.length > 0) {
          parts.push({ type: "text", content: paragraph });
        }

        return (
          <p key={index} className="text-foreground text-sm leading-6">
            {parts.map((part, i) => {
              if (part.type === "text") {
                return <span key={i}>{part.content}</span>;
              }
              if (part.type === "bold") {
                return (
                  <strong key={i} className="font-semibold">
                    {part.content}
                  </strong>
                );
              }
              const href = part.href ?? "";
              const isInternal = href.startsWith("/");
              if (isInternal) {
                return (
                  <Link
                    key={i}
                    href={href}
                    className="text-primary underline underline-offset-2 hover:no-underline"
                  >
                    {part.content}
                  </Link>
                );
              }
              return (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:no-underline"
                >
                  {part.content}
                </a>
              );
            })}
          </p>
        );
      })}
    </div>
  );
};
