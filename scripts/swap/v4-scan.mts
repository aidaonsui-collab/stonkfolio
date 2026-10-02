import { createPublicClient, http, parseAbiItem } from "viem";
import fs from "fs";
// Read-only scan of Uniswap v4 PoolManager Initialize events on Arc for pairs among our tokens.
// Paced and retried (the RPC returns 429 and caps getLogs at 10,000 blocks / 2,000 results). Sends no transactions.
// Run: npx tsx scripts/swap/v4-scan.mts   (takes ~1 hour). Writes ./v4_init.json; then read StateView.getLiquidity per id.
const c = createPublicClient({ transport: http("https://rpc.mainnet.arc.io") });
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function w<T>(f:()=>Promise<T>):Promise<T>{for(let i=0;i<10;i++){try{return await f()}catch(e:any){if(!/429|rate|too many|limit exceeded/i.test(String(e.message))){throw e}await sleep(800*2**Math.min(i,5))}}throw new Error("rl")}
const PM="0x8366a39CC670B4001A1121B8F6A443A643e40951" as const;
const ev=parseAbiItem("event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)");
const toks=["0x3600000000000000000000000000000000000000","0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1","0x171A4217b86A807A64eB94757Db6849fb4bDbAA0","0x128cC466B61f542da60c70e3aA11c10e19B84EDB"] as const;
const head=await w(()=>c.getBlockNumber());
const out:any[]=[];
async function chunk(from:bigint,to:bigint){
  const logs=await w(()=>c.getLogs({address:PM,event:ev,args:{currency0:toks as any,currency1:toks as any},fromBlock:from,toBlock:to} as any)).catch(async(e:any)=>{
    if(/max results/.test(String(e.details??e.message))&&to>from){const m=(from+to)/2n;await chunk(from,m);await chunk(m+1n,to);return []}
    throw e});
  for(const l of logs as any[]) out.push({block:l.blockNumber.toString(),...Object.fromEntries(Object.entries(l.args).map(([k,v])=>[k,String(v)]))});
}
for(let from=1948056n; from<=head; from+=10000n){
  const to=from+9999n>head?head:from+9999n;
  await chunk(from,to);
  if(from%1000000n<10000n) console.log("at",from.toString(),"found",out.length);
  await sleep(100);
}
fs.writeFileSync("v4_init.json",JSON.stringify({head:head.toString(),out},null,1));
console.log("done",out.length);
