import assert from "node:assert/strict";
import test from "node:test";
import { folioCardSearch, parseFolioCard, recordedAssets, shareCardImageUrl, sharePageUrl, shareText } from "./folio-card";
import { usd } from "./format";
import { earnedValue, PREVIEW_HOLDER, STOCKS } from "./stocks";

test("preview holdings become a share card with rewards and assets", () => {
  const assets = recordedAssets(PREVIEW_HOLDER.earned, STOCKS);
  const query = folioCardSearch({ stonk: PREVIEW_HOLDER.stonk, sample: true, holder: "Sample", assets });
  const card = parseFolioCard(new URLSearchParams(query), STOCKS);
  const equities = assets.filter((asset) => asset.kind !== "mmf");
  assert.equal(card.sample, true);
  assert.equal(card.holder, "Sample");
  assert.equal(card.stonk, PREVIEW_HOLDER.stonk);
  assert.equal(card.assets.length, Math.min(8, equities.length));
  assert.equal(card.hidden, Math.max(0, equities.length - 8));
  assert.equal(usd(card.rewardsUsd), usd(earnedValue(PREVIEW_HOLDER.earned)));
  assert.equal(card.assets.some((asset) => asset.ticker === "EARN"), false);
  assert.deepEqual(
    card.assets.map((asset) => asset.ticker),
    equities.slice(0, 8).map((asset) => asset.ticker),
  );
  assert.match(shareText(card), /Sample folio/);
  assert.match(shareText(card), /Rewards received/);
  assert.match(shareText(card), /Assets held/);
  assert.doesNotMatch(shareText(card), /\$SFOLIO/);
  assert.match(shareCardImageUrl(query), /^https:\/\/www\.stonkfolio\.me\/share\/card\.png\?/);
  assert.match(sharePageUrl(query), /^https:\/\/www\.stonkfolio\.me\/share\?/);
});

test("bad query values do not invent a folio", () => {
  const card = parseFolioCard(new URLSearchParams("stonk=-5&holder=<script>&assets=NOPE:1,CRCL:-2,NVDA:0.5"), STOCKS);
  assert.equal(card.stonk, 0);
  assert.equal(card.holder, "Holder");
  assert.deepEqual(card.assets.map((asset) => asset.ticker), ["NVDA"]);
});
