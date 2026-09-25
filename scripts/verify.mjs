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

await page.getByRole("link", { name: "Portfolio" }).first().click();
await page.waitForURL("**/portfolio");
await shot("portfolio-empty.png");

await page.getByRole("button", { name: "Preview tape" }).click();
await page.waitForTimeout(300);
await shot("portfolio-preview.png");

const balance = await page.locator("text=$SFOLIO").first().textContent();
if (!balance || !balance.includes("SFOLIO")) errors.push("preview did not fill $SFOLIO balance");

await page.getByRole("link", { name: "Farm these stocks" }).click();
await page.waitForURL("**/yield");
await page.getByRole("heading", { name: "Earn vaults." }).waitFor({ timeout: 10_000 });
await page.getByText(/Steakhouse|Keyrock|Bitwise|active of/).first().waitFor({ timeout: 20_000 });
await shot("yield-desktop.png");

await page.getByPlaceholder("Search markets").fill("CRCL");
await page.waitForTimeout(200);
await shot("yield-search.png");
await page.getByPlaceholder("Search markets").fill("");

await page.locator("button[data-filter=morpho]").click();
await page.waitForTimeout(200);
await shot("yield-morpho.png");
await page.locator("button[data-filter=all]").click();

await page.locator("table").getByText("Circle LP").click();
await page.waitForTimeout(400);
await shot("yield-sheet.png");
await page.getByPlaceholder("0.00").fill("0.02");
await page.getByRole("button", { name: "Supply CRCL" }).click();
await page.waitForTimeout(300);
await shot("yield-sheet-supplied.png");
await page.keyboard.press("Escape");

await page.getByRole("link", { name: "Bundles" }).first().click();
await page.waitForURL("**/bundles");
await shot("bundles-desktop.png");

await page.getByRole("link", { name: "Keeper" }).first().click();
await page.waitForURL("**/keeper");
await page.getByText("Buy the book").waitFor({ timeout: 10_000 });
await shot("keeper-desktop.png");
const keeperCopy = await page.locator("body").textContent();
if (!keeperCopy || !keeperCopy.includes("Agent wallet")) errors.push("keeper page missing agent wallet");
if (!keeperCopy || !keeperCopy.toLowerCase().includes("80aa")) errors.push("keeper page missing Eve agent address");

await page.getByRole("link", { name: "Docs" }).first().click();
await page.waitForURL("**/docs");
await shot("docs-desktop.png");
const docsCopy = await page.locator("body").textContent();
if (!docsCopy || !docsCopy.toLowerCase().includes("circle earn")) errors.push("docs missing Circle Earn");
if (!docsCopy || !docsCopy.toLowerCase().includes("people trade")) errors.push("docs missing process steps");
if (docsCopy && /queued/i.test(docsCopy)) errors.push("docs still has pre-launch queued copy");
if (docsCopy && docsCopy.includes(".env.local")) errors.push("docs leaked .env.local");
if (docsCopy && docsCopy.includes("DINARI_API")) errors.push("docs leaked API key names");

await page.getByRole("link", { name: "Bundles" }).first().click();
await page.waitForURL("**/bundles");
const bundlesCopy = await page.locator("body").textContent();
if (bundlesCopy && (bundlesCopy.includes(".env.local") || bundlesCopy.includes("DINARI_API_KEY"))) {
  errors.push("bundles leaked env key copy");
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/portfolio`, { waitUntil: "networkidle" });
await shot("portfolio-mobile.png");
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
