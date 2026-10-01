import type { MetadataRoute } from "next";

const BASE = "https://www.stonkfolio.me";
const ROUTES = ["", "/bundles", "/portfolio", "/swap", "/yield", "/keeper", "/docs", "/about", "/terms", "/privacy", "/risk"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({ url: `${BASE}${path}`, lastModified: new Date("2026-10-01") }));
}
