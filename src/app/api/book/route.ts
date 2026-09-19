import { NextResponse } from "next/server";
import { bookPayload } from "@/lib/book";
import { corsHeaders } from "@/lib/x402";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export function GET() {
  return NextResponse.json(bookPayload(), { headers: corsHeaders() });
}
