import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";

export const shareSize = { width: 1200, height: 630 };
export const shareAlt = "StonkFolio. Your book. Your folio.";

const bars = [
  { height: 58, color: "#8fa3c2", width: 14 },
  { height: 24, color: "#e8eef8", width: 10 },
  { height: 36, color: "#2ec9b0", width: 10 },
  { height: 48, color: "#3d7eff", width: 10 },
  { height: 56, color: "#e8eef8", width: 10 },
];

export async function shareCard() {
  const [figtree, fraunces, frauncesItalic, arcLogo] = await Promise.all([
    readFile(new URL("../assets/fonts/figtree-500.ttf", import.meta.url)),
    readFile(new URL("../assets/fonts/fraunces-500.ttf", import.meta.url)),
    readFile(new URL("../assets/fonts/fraunces-500-italic.ttf", import.meta.url)),
    readFile(new URL("../assets/arc-logo-light.png", import.meta.url)),
  ]);
  const arcSrc = `data:image/png;base64,${arcLogo.toString("base64")}`;

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
        padding: "68px 76px 56px",
        fontFamily: "Figtree",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            width: 84,
            height: 84,
            borderRadius: 20,
            background: "#15243c",
            alignItems: "flex-end",
            padding: "0 12px 14px",
            gap: 4,
          }}
        >
          {bars.map((bar) => (
            <div
              key={bar.color + bar.height}
              style={{
                width: bar.width,
                height: bar.height,
                borderRadius: 3,
                background: bar.color,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 32 }}>
          <span style={{ fontWeight: 500 }}>Stonk</span>
          <span style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 36 }}>Folio</span>
        </div>
        </div>
        <img src={arcSrc} width={320} height={110} alt="" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 92,
            lineHeight: 0.95,
            letterSpacing: -2,
          }}
        >
          Your book.
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontStyle: "italic",
            fontSize: 92,
            lineHeight: 0.95,
            letterSpacing: -2,
            color: "#3d7eff",
          }}
        >
          Your folio.
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#8b9bb3" }}>
          Every trade buys the stocks. Every holder owns them.
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#8b9bb3" }}>
        <span>stonkfolio.me</span>
        <span>$SFOLIO · Arc</span>
      </div>
    </div>,
    {
      ...shareSize,
      fonts: [
        { name: "Figtree", data: figtree, weight: 500, style: "normal" },
        { name: "Fraunces", data: fraunces, weight: 500, style: "normal" },
        { name: "Fraunces", data: frauncesItalic, weight: 500, style: "italic" },
      ],
    },
  );
}
