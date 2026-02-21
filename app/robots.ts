import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/api/", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: "https://talk-scope.com/sitemap.xml",
    host: "https://talk-scope.com",
  };
}
