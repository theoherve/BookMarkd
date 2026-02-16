import AppShell from "@/components/layout/app-shell";
import { FaqJsonLd } from "@/components/seo/faq-json-ld";

const FAQ_ITEMS = [
  {
    question: "BookMarkd, qu'est-ce que c'est ?",
    answer:
      "BookMarkd est une application web qui vous permet de suivre vos lectures (livres à lire, en cours, terminés), de les noter, d'écrire des avis, de créer des listes personnelles ou collaboratives, et de suivre l'activité de vos amis pour découvrir des recommandations.",
  },
  {
    question: "Comment créer une liste ?",
    answer:
      "Depuis la page Listes, cliquez sur « Créer une liste ». Donnez-lui un titre et une description, choisissez sa visibilité (publique, non répertoriée ou privée) et ajoutez des livres depuis votre bibliothèque ou la recherche.",
  },
  {
    question: "Mes données sont-elles privées ?",
    answer:
      "Vous choisissez la visibilité de chaque liste (publique, non répertoriée ou privée). Les avis et statuts de lecture peuvent être publics, réservés aux amis ou privés. Seules les informations que vous rendez publiques sont visibles par les autres utilisateurs.",
  },
  {
    question: "Comment ajouter un livre à ma bibliothèque ?",
    answer:
      "Utilisez la recherche (barre de recherche ou page Recherche) pour trouver un livre. Vous pouvez importer depuis Google Books ou Open Library si le livre n'existe pas encore. Une fois trouvé, ajoutez-le avec un statut : à lire, en cours ou terminé.",
  },
];

export const metadata = {
  title: "FAQ",
  description:
    "Questions fréquentes sur BookMarkd : présentation, listes, confidentialité et utilisation.",
  openGraph: {
    title: "FAQ · BookMarkd",
    description:
      "Questions fréquentes sur BookMarkd : présentation, listes, confidentialité et utilisation.",
    url: "https://bookmarkd.app/faq",
    siteName: "BookMarkd",
    type: "website",
  },
};

const FaqPage = () => {
  return (
    <AppShell>
      <FaqJsonLd
        items={FAQ_ITEMS.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))}
      />
      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Questions fréquentes
          </h1>
          <p className="text-muted-foreground text-sm">
            Réponses aux questions les plus posées sur BookMarkd.
          </p>
        </header>
        <dl className="space-y-6">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-card/80 p-6"
            >
              <dt className="font-semibold text-foreground">
                {item.question}
              </dt>
              <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </AppShell>
  );
};

export default FaqPage;
