type ArticleJsonLdProps = {
  headline: string;
  description: string;
  url: string;
  datePublished: Date;
  dateModified?: Date;
  image?: string;
  author?: string;
};

export const ArticleJsonLd = ({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  image,
  author = "BookMarkd",
}: ArticleJsonLdProps) => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    datePublished: datePublished.toISOString(),
    author: {
      "@type": "Organization",
      name: author,
    },
  };

  if (dateModified) {
    schema.dateModified = dateModified.toISOString();
  }

  if (image) {
    schema.image = image;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
