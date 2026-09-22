import { getAddress, isAddress, verifyMessage } from "viem";
import { NextResponse } from "next/server";
import { choiceMessage, parseChoiceBody } from "@/lib/reward-choice";
import { readChoice, saveChoice } from "@/lib/reward-choice-store";
import { corsHeaders } from "@/lib/x402";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("address") ?? "";
  if (!isAddress(address)) {
    return NextResponse.json({ ok: false, message: "Address required." }, { status: 400, headers: corsHeaders() });
  }
  const row = readChoice(getAddress(address));
  return NextResponse.json(
    {
      ok: true,
      choice: row?.choice ?? "BOOK",
      signedAt: row?.signedAt ?? null,
      signed: Boolean(row),
    },
    { headers: corsHeaders() },
  );
}

export async function POST(req: Request) {
  const parsed = parseChoiceBody(await req.json().catch(() => null));
  if (!parsed) {
    return NextResponse.json({ ok: false, message: "Sign one name from the book, or the book." }, { status: 400, headers: corsHeaders() });
  }
  const message = choiceMessage(parsed.address, parsed.choice, parsed.signedAt);
  const signer = await verifyMessage({ address: parsed.address, message, signature: parsed.signature as `0x${string}` }).catch(() => false);
  if (!signer) {
    return NextResponse.json({ ok: false, message: "Signature does not match this wallet." }, { status: 401, headers: corsHeaders() });
  }
  const saved = saveChoice({ ...parsed, message });
  if (saved.current.signedAt !== parsed.signedAt || saved.current.choice !== parsed.choice) {
    return NextResponse.json(
      { ok: false, message: "A newer choice is already signed.", choice: saved.current.choice, signedAt: saved.current.signedAt },
      { status: 409, headers: corsHeaders() },
    );
  }
  return NextResponse.json(
    { ok: true, choice: saved.current.choice, signedAt: saved.current.signedAt, stored: saved.stored },
    { headers: corsHeaders() },
  );
}
