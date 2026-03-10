import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "BookMarkd – Suivez, notez et partagez vos lectures";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fdfaf5 0%, #f5ebe0 50%, #e8d5c4 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#1c1917",
              letterSpacing: "-2px",
            }}
          >
            BookMarkd
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "#57534e",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: 1.4,
            }}
          >
            Suivez, notez et partagez vos lectures
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            {["Suivi", "Notes", "Listes", "Amis"].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  background: "rgba(28, 25, 23, 0.08)",
                  fontSize: 18,
                  color: "#44403c",
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: 18,
            color: "#a8a29e",
          }}
        >
          bookmarkd.app
        </div>
      </div>
    ),
    { ...size },
  );
}
