import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Badmination · Badminton Academy & Tournaments",
    short_name: "Badmination",
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    orientation: "portrait",
    categories: ["sports", "fitness"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Live Arena Center",
        url: "/live",
        description: "View real-time court scores and match streams",
      },
      {
        name: "Tournaments",
        url: "/#tournaments",
        description: "Browse tournaments and enter draws",
      },
      {
        name: "Umpire Console",
        url: "/umpire",
        description: "Court scoring pad and official desk",
      },
    ],
  };
}
