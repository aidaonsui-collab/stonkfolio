import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Same-origin proxy for Circle's Borrow Service. The browser Borrow Kit points its provider at this
// site (it builds `${origin}/v1/borrowKit/...`), and this route forwards to api.circle.com. The Circle
// API key never reaches the browser: it is attached here, and only on the two routes that accept it,
// so borrows made on StonkFolio carry the integrator fee.
const UPSTREAM = "https://api.circle.com/v1/borrowKit";
/** Routes where the key selects the integrator fee. Every other route rejects a key. */
const KEYED = new Set(["POST loans/borrow", "POST loans/borrow/quote"]);
/** Top-level resources the kit reads or writes. `integrators` (fee config) is never proxied. */
const ALLOWED_ROOTS = new Set(["markets", "loans"]);
const MAX_BODY = 64 * 1024;

async function forward(req: NextRequest, ctx: RouteContext<"/v1/borrowKit/[...path]">) {
  const { path } = await ctx.params;
  if (!path.length || !ALLOWED_ROOTS.has(path[0]) || path.some((p) => p === ".." || p === "." || p.includes("/"))) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const joined = path.map(encodeURIComponent).join("/");
  const headers: Record<string, string> = { accept: "application/json" };
  let body: string | undefined;
  if (req.method === "POST") {
    body = await req.text();
    if (body.length > MAX_BODY) return Response.json({ error: "body too large" }, { status: 413 });
    headers["content-type"] = "application/json";
  }
  const key = process.env.CIRCLE_API_KEY?.trim();
  if (key && KEYED.has(`${req.method} ${path.join("/")}`)) headers.authorization = `Bearer ${key}`;

  const upstream = await fetch(`${UPSTREAM}/${joined}${req.nextUrl.search}`, { method: req.method, headers, body, cache: "no-store" });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json", "cache-control": "no-store" },
  });
}

export const GET = forward;
export const POST = forward;
