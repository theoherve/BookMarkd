import type { MetadataRoute } from "next";

const BASE_URL = "https://bookmarkd.app";

export default function robots(): MetadataRoute.Robots {
  const defaultRules = {
    allow: "/",
    disallow: [
      "/api/",
      "/profiles/me",
      "/profiles/me/",
      "/notifications",
      "/notifications/",
      "/offline",
      "/login",
      "/signup",
    ],
  };

  return {
    rules: [
      { userAgent: "Googlebot", ...defaultRules },
      { userAgent: "Bingbot", ...defaultRules },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/api/", "/profiles/me", "/profiles/me/", "/notifications", "/notifications/", "/offline"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/profiles/me", "/profiles/me/", "/notifications", "/notifications/", "/offline"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
