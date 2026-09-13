import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "screenshots");
mkdirSync(dir, { recursive: true });

const errors = [];
const base = "http://localhost:3042";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

async function shot(name) {
  await page.screenshot({ path: join(dir, name), fullPage: true });
  console.log("shot", name);
}

await page.goto(base, { waitUntil: "networkidle" });
await shot("home-desktop.png");

await page.getByRole("link", { name: "Distributions" }).first().click();
await page.waitForURL("**/distributions");
await shot("distributions-empty.png");

await page.getByRole("button", { name: /preview/i }).click();
await page.waitForTimeout(300);
await shot("distributions-preview.png");

const balance = await page.locator("text=$STONK").first().textContent();
if (!balance || !balance.includes("STONK")) errors.push("preview did not fill $STONK balance");

await page.getByRole("link", { name: "Farm these stocks" }).click();
await page.waitForURL("**/yield");
await shot("yield-grid.png");

await page.getByPlaceholder("Search markets").fill("CRCL");
await page.waitForTimeout(200);
await shot("yield-search.png");
await page.getByPlaceholder("Search markets").fill("");

await page.locator("button[data-filter=morpho]").click();
await page.waitForTimeout(200);
await shot("yield-morpho.png");
await page.locator("button[data-filter=all]").click();

await page.getByRole("button", { name: "List" }).click();
await page.waitForTimeout(200);
await shot("yield-list.png");
await page.getByRole("button", { name: "Grid" }).click();

await page.locator("[data-market=morpho-crcl]").click();
await page.waitForTimeout(400);
await shot("yield-sheet.png");
await page.getByPlaceholder("0.00").fill("0.02");
await page.getByRole("button", { name: "Supply CRCL" }).click();
await page.waitForTimeout(300);
await shot("yield-sheet-supplied.png");
await page.keyboard.press("Escape");

await page.getByRole("link", { name: "Basket" }).first().click();
await page.waitForURL("**/basket");
await shot("basket-desktop.png");

await page.getByRole("link", { name: "Docs" }).first().click();
await page.waitForURL("**/docs");
await shot("docs-desktop.png");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/distributions`, { waitUntil: "networkidle" });
await shot("distributions-mobile.png");
await page.goto(`${base}/yield`, { waitUntil: "networkidle" });
await shot("yield-mobile.png");
await page.goto(base, { waitUntil: "networkidle" });
await shot("home-mobile.png");

await browser.close();
if (errors.length) {
  console.error("ISSUES");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("OK");
