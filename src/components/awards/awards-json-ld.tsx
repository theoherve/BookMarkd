type Props = {
  year: number;
  publishedAt: string | null;
  theme: string | null;
  intro: string | null;
  url: string;
};

export const AwardsJsonLd = ({
  year,
  publishedAt,
  theme,
  intro,
  url,
}: Props) => {
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: theme ?? `BookMarkd Awards ${year}`,
    description:
      intro ??
      `Les meilleurs livres, lecteurs, critiques et ressentis de ${year} sur BookMarkd.`,
    startDate: publishedAt ?? `${year + 1}-01-01`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url,
    },
    organizer: {
      "@type": "Organization",
      name: "BookMarkd",
      url: "https://bookmarkd.app",
    },
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};
