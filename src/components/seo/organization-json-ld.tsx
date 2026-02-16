const BASE_URL = "https://bookmarkd.app";

export const OrganizationJsonLd = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BookMarkd",
    url: BASE_URL,
    description:
      "BookMarkd est votre hub lecture social : suivez vos livres, découvrez ceux de vos amis et recevez des recommandations personnalisées.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
