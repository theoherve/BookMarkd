type ProfileJsonLdProps = {
  name: string;
  url: string;
  description?: string | null;
  image?: string | null;
};

export const ProfileJsonLd = ({ name, url, description, image }: ProfileJsonLdProps) => {
  const mainEntity: Record<string, unknown> = {
    "@type": "Person",
    name,
    url,
  };
  if (description) mainEntity.description = description;
  if (image) mainEntity.image = image;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
