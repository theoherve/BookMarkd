const BASE_URL = "https://bookmarkd.app";

export const WebsiteJsonLd = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BookMarkd",
    description:
      "BookMarkd est votre hub lecture social : suivez vos livres, découvrez ceux de vos amis et recevez des recommandations personnalisées.",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
