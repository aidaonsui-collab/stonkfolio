import { NextResponse } from "next/server";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { arc, ARC_USDC_ERC20 } from "@/lib/chain";
import { corsHeaders } from "@/lib/x402";
import { CREATOR_CUT_BPS } from "@/lib/fees";
import { CREATOR_CUT_WALLET, keeperAddress, keeperPlan, treasuryAddress, usycAddress } from "@/lib/keeper";

export const dynamic = "force-dynamic";

const erc20 = erc20Abi;

export async function GET() {
  const keeper = keeperAddress();
  const usyc = usycAddress();
  const treasury = treasuryAddress();
  const plan = keeperPlan();
  const creatorCut = { wallet: CREATOR_CUT_WALLET, bps: CREATOR_CUT_BPS };
  const rpc = process.env.ARC_RPC || "https://rpc.arc-scan.org";
  const client = createPublicClient({
    chain: arc,
    transport: http(rpc, { timeout: 8_000 }),
  });

  try {
    const readBal = async (token: typeof ARC_USDC_ERC20 | typeof usyc, who: typeof keeper) => {
      try {
        return await client.readContract({ address: token, abi: erc20, functionName: "balanceOf", args: [who] });
      } catch {
        return BigInt(0);
      }
    };
    const keeperUsdc = await readBal(ARC_USDC_ERC20, keeper);
    const keeperUsyc = await readBal(usyc, keeper);
    const treasuryUsdc = treasury ? await readBal(ARC_USDC_ERC20, treasury) : BigInt(0);
    const treasuryUsyc = treasury ? await readBal(usyc, treasury) : BigInt(0);

    return NextResponse.json(
      {
        ok: true,
        keeper,
        treasury,
        usyc,
        plan,
        creatorCut,
        balances: {
          keeperUsdc: formatUnits(keeperUsdc, 6),
          keeperUsyc: formatUnits(keeperUsyc, 6),
          treasuryUsdc: formatUnits(treasuryUsdc, 6),
          treasuryUsyc: formatUnits(treasuryUsyc, 6),
        },
      },
      { headers: corsHeaders() },
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : "rpc failed";
    return NextResponse.json(
      { ok: false, keeper, treasury, usyc, plan, creatorCut, reason },
      { status: 502, headers: corsHeaders() },
    );
  }
}
