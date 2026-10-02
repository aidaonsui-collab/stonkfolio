import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { ARC_ARCH_PATH, ARC_ARCH_VIEWBOX } from "./arc-emblem";
import { STOCK_LOGO } from "./brand-marks";
import { folioBalanceLabel, type FolioCard } from "./folio-card";
import { qty, usd } from "./format";
import { STOCKS } from "./stocks";

export const folioCardSize = { width: 1200, height: 630 };

const fonts = Promise.all([
  readFile(new URL("../assets/fonts/figtree-500.ttf", import.meta.url)),
  readFile(new URL("../assets/fonts/fraunces-500.ttf", import.meta.url)),
  readFile(new URL("../assets/fonts/fraunces-500-italic.ttf", import.meta.url)),
]);

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#15243c"/><rect x="5.5" y="7" width="5" height="18" rx="1.2" fill="#8fa3c2"/><rect x="12.5" y="17.5" width="3.2" height="7.5" rx="0.9" fill="#e8eef8"/><rect x="16.6" y="14" width="3.2" height="11" rx="0.9" fill="#2ec9b0"/><rect x="20.7" y="10.4" width="3.2" height="14.6" rx="0.9" fill="#3d7eff"/><rect x="24.8" y="8" width="3.2" height="17" rx="0.9" fill="#e8eef8"/></svg>`;

const folioMark = sharp(Buffer.from(MARK_SVG))
  .png()
  .toBuffer()
  .then((png) => `data:image/png;base64,${png.toString("base64")}`);

const arcEmblem = sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ARC_ARCH_VIEWBOX}"><path fill="#ffffff" d="${ARC_ARCH_PATH}"/></svg>`,
  ),
  { density: 216 },
)
  .png()
  .toBuffer()
  .then((png) => `data:image/png;base64,${png.toString("base64")}`);

const stockMarks = loadStockMarks();

async function loadStockMarks() {
  const marks: Record<string, string> = {};
  await Promise.all(
    STOCKS.map(async (stock) => {
      const src = STOCK_LOGO[stock.ticker];
      if (src) {
        const file = await readFile(path.join(process.cwd(), "public", src.replace(/^\//, "")));
        marks[stock.ticker] = await circleTile(file);
        return;
      }
      if (stock.kind === "mmf") return;
      const letter = stock.letter || stock.ticker.slice(0, 1);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="${stock.color}"/><text x="32" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">${letter}</text></svg>`;
      const png = await sharp(Buffer.from(svg)).png().toBuffer();
      marks[stock.ticker] = `data:image/png;base64,${png.toString("base64")}`;
    }),
  );
  return marks;
}

async function circleTile(input: Buffer) {
  const icon = await sharp(input, { density: 300 })
    .resize(42, 42, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const plate = await sharp({
    create: { width: 64, height: 64, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: icon, gravity: "center" }])
    .png()
    .toBuffer();
  const mask = await sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="#fff"/></svg>`),
  )
    .png()
    .toBuffer();
  const png = await sharp(plate).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function folioCardImage(card: FolioCard) {
  const [figtree, fraunces, frauncesItalic] = await fonts;
  const [mark, emblem, logos] = await Promise.all([folioMark, arcEmblem, stockMarks]);

  const rows = card.assets.length
    ? card.assets.map((asset) => ({
        key: asset.ticker,
        left: asset.ticker,
        mid: qty(asset.amount, 4),
        right: usd(asset.valueUsd),
        logo: logos[asset.ticker] ?? "",
      }))
    : [{ key: "empty", left: "No stocks yet", mid: "", right: "", logo: "" }];
  if (card.hidden > 0) {
    rows.push({ key: "more", left: `+${card.hidden} more`, mid: "", right: "", logo: "" });
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#07111f",
        color: "#e8eef8",
        padding: "52px 56px",
        fontFamily: "Figtree",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: -120, top: -30, display: "flex", opacity: 0.14 }}>
        <img src={emblem} width={760} height={766} alt="" />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={mark} width={68} height={68} alt="" style={{ opacity: 0.55, marginRight: 16 }} />
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 32 }}>
            <span>Stonk</span>
            <span style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 36 }}>Folio</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#8b9bb3" }}>{card.holder}</div>
      </div>

      <div style={{ display: "flex", gap: 36 }}>
        <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: "#8b9bb3" }}>REWARDS RECEIVED</div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontFamily: "Fraunces",
              fontSize: 84,
              lineHeight: 0.95,
              letterSpacing: -2,
            }}
          >
            {usd(card.rewardsUsd)}
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 26, color: "#8b9bb3" }}>
            {folioBalanceLabel(card.stonk)}
          </div>
          {card.sample ? (
            <div style={{ display: "flex", marginTop: 22, fontSize: 22, color: "#3d7eff" }}>Sample folio</div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>
        <div
          style={{
            display: "flex",
            width: 460,
            flexDirection: "column",
            background: "#0d1a2e",
            borderRadius: 24,
            padding: "28px 28px 12px",
          }}
        >
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: "#8b9bb3" }}>ASSETS HELD</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
            {rows.map((row) => (
              <div
                key={row.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  fontSize: 22,
                }}
              >
                <span style={{ display: "flex", width: row.mid ? 176 : 320, alignItems: "center" }}>
                  {row.logo ? (
                    <img src={row.logo} width={26} height={26} alt="" style={{ marginRight: 10 }} />
                  ) : row.key === "more" ? (
                    <span style={{ display: "flex", width: 36 }} />
                  ) : null}
                  {row.left}
                </span>
                <span style={{ display: "flex", flex: 1, color: "#8b9bb3" }}>{row.mid}</span>
                <span style={{ display: "flex" }}>{row.right}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#8b9bb3" }}>
        <span>stonkfolio.me</span>
        <span>$SFOLIO · Arc</span>
      </div>
    </div>,
    {
      ...folioCardSize,
      fonts: [
        { name: "Figtree", data: figtree, weight: 500, style: "normal" },
        { name: "Fraunces", data: fraunces, weight: 500, style: "normal" },
        { name: "Fraunces", data: frauncesItalic, weight: 500, style: "italic" },
      ],
    },
  );
}
