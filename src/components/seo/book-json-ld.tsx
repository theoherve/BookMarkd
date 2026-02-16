type BookJsonLdProps = {
  name: string;
  author: string;
  image: string | null;
  description: string | null;
  url: string;
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
    bestRating: number;
  };
  datePublished?: number | null;
};

export const BookJsonLd = ({
  name,
  author,
  image,
  description,
  url,
  aggregateRating,
  datePublished,
}: BookJsonLdProps) => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Book",
    name,
    author: {
      "@type": "Person",
      name: author,
    },
    url,
  };

  if (image) {
    schema.image = image;
  }

  if (description) {
    schema.description = description;
  }

  if (aggregateRating && aggregateRating.ratingCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue,
      ratingCount: aggregateRating.ratingCount,
      bestRating: aggregateRating.bestRating,
    };
  }

  if (datePublished) {
    schema.datePublished = String(datePublished);
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
