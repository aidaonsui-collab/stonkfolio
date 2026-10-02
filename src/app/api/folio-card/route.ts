import { folioCardImage } from "@/lib/folio-card-image";
import { parseFolioCard } from "@/lib/folio-card";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const card = parseFolioCard(new URL(request.url).searchParams);
  const image = await folioCardImage(card);
  image.headers.set("Cache-Control", "private, no-store");
  image.headers.set("Content-Disposition", 'inline; filename="stonkfolio-folio.png"');
  return image;
}
