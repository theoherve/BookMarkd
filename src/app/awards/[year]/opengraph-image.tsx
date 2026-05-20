import { ImageResponse } from "next/og";
import {
  getAwardsYear,
  getWinnersForYear,
} from "@/features/awards/server/queries";

export const runtime = "edge";
export const alt = "BookMarkd Awards";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ year: string }>;
};

const FALLBACK_THEME = "BookMarkd Awards";

const Image = async ({ params }: Props) => {
  const { year: yearParam } = await params;
  const year = Number.parseInt(yearParam, 10);

  let theme: string | null = null;
  let bookTitle: string | null = null;
  let bookAuthor: string | null = null;

  if (Number.isFinite(year)) {
    const awardsYear = await getAwardsYear(year);
    if (awardsYear && awardsYear.status === "published") {
      theme = awardsYear.theme;
      const winners = await getWinnersForYear(year);
      const book = winners.find(
        (w) => w.category === "book_of_the_year" && w.rank === 1,
      );
      if (book && book.snapshot.type === "book") {
        bookTitle = book.snapshot.title;
        bookAuthor = book.snapshot.author;
      }
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(circle at 15% 20%, #d6b087 0%, transparent 55%), radial-gradient(circle at 90% 90%, #b66f4b 0%, transparent 65%), #fdfaf5",
          color: "#1f140d",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 22,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#6b5747",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: 9999,
              background: "#d6b087",
              fontSize: 32,
            }}
          >
            ★
          </span>
          BookMarkd Awards
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: 28, color: "#6b5747" }}>
            Édition {Number.isFinite(year) ? year : ""}
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.05,
              maxWidth: 1040,
            }}
          >
            {theme ?? FALLBACK_THEME}
          </div>
          {bookTitle && (
            <div style={{ fontSize: 28, color: "#2f1c11" }}>
              Livre de l’année : {bookTitle}
              {bookAuthor ? ` — ${bookAuthor}` : ""}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 20,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#6b5747",
          }}
        >
          bookmarkd.app
        </div>
      </div>
    ),
    { ...size },
  );
};

export default Image;
