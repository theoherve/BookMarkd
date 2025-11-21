/**
 * Script de seed pour les mots-clés de ressenti
 * À exécuter après la migration feeling_keywords
 */

import db from "../src/lib/supabase/db";

const FEELING_KEYWORDS = [
  "Émouvant",
  "Captivant",
  "Drôle",
  "Déstabilisant",
  "Inspirant",
  "Poétique",
  "Violent",
  "Contemplatif",
  "Anxiogène",
  "Réconfortant",
  "Percutant",
  "Sombre",
  "Envoûtant",
  "Bouleversant",
  "Intrigant",
  "Mystérieux",
  "Hypnotique",
  "Époustouflant",
  "Lancinant",
  "Électrisant",
  "Énigmatique",
  "Profond",
  "Doux-amer",
  "Grisant",
  "Oppressant",
  "Déchirant",
  "Lumineux",
  "Onirique",
  "Rythmé",
  "Énergisant",
  "Glacial",
  "Chaleureux",
  "Dissonant",
  "Dérangeant",
  "Léger",
  "Puissant",
  "Subtil",
  "Immersif",
  "Rassurant",
  "Étrange",
  "Saisissant",
  "Revigorant",
  "Tragique",
  "Fiévreux",
  "Intense",
  "Palpitant",
  "Bouillant",
  "Fulgurant",
  "Dévastateur",
  "Renversant",
  "Exaltant",
  "Éprouvant",
  "Étourdissant",
  "Ravageur",
  "Tourmenté",
  "Vibrant",
  "Mélancolique",
  "Apaisant",
  "Délicat",
  "Brumeux",
  "Velouté",
  "Doucereux",
  "Paisible",
  "Flottant",
  "Moelleux",
  "Lisse",
  "Tendre",
];

const generateSlug = (label: string): string => {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplace les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, ""); // Supprime les tirets en début et fin
};

const seedFeelingKeywords = async () => {
  console.log("🌱 Seeding feeling keywords...");

  try {
    for (const label of FEELING_KEYWORDS) {
      const slug = generateSlug(label);

      // Utiliser upsert pour éviter les doublons
      const { error } = await db.client.from("feeling_keywords").upsert(
        [
          {
            label,
            slug,
            source: "admin",
            created_by: null, // Admin keywords
          },
        ],
        {
          onConflict: "slug",
          ignoreDuplicates: true,
        }
      );

      if (error) {
        console.error(`❌ Error seeding keyword "${label}":`, error);
      } else {
        console.log(`✅ Seeded keyword: ${label}`);
      }
    }

    console.log("✨ Seeding completed!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
};

// Exécuter le script
seedFeelingKeywords()
  .then(() => {
    console.log("🎉 All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
