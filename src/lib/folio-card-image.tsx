import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { folioBalanceLabel, type FolioCard } from "./folio-card";
import { qty, usd } from "./format";

export const folioCardSize = { width: 1200, height: 630 };

const fonts = Promise.all([
  readFile(new URL("../assets/fonts/figtree-500.ttf", import.meta.url)),
  readFile(new URL("../assets/fonts/fraunces-500.ttf", import.meta.url)),
  readFile(new URL("../assets/fonts/fraunces-500-italic.ttf", import.meta.url)),
]);

export async function folioCardImage(card: FolioCard) {
  const [figtree, fraunces, frauncesItalic] = await fonts;

  const rows = card.assets.length
    ? card.assets.map((asset) => ({
        key: asset.ticker,
        left: asset.ticker,
        mid: qty(asset.amount, 4),
        right: usd(asset.valueUsd),
      }))
    : [{ key: "empty", left: "No stocks yet", mid: "", right: "" }];
  if (card.hidden > 0) {
    rows.push({ key: "more", left: `+${card.hidden} more`, mid: "", right: "" });
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
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 32 }}>
          <span>Stonk</span>
          <span style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 36 }}>Folio</span>
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
                <span style={{ display: "flex", width: row.mid ? 120 : 280 }}>{row.left}</span>
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
