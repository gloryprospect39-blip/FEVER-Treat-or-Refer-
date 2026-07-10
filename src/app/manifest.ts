import type { MetadataRoute } from "next";

import { mm } from "@/lib/i18n/mm";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: mm.app.metaTitle,
    short_name: mm.app.title,
    description: mm.app.metaDescription,
    lang: "my",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8fafc",
    theme_color: "#0d9488",
    categories: ["medical", "health", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
