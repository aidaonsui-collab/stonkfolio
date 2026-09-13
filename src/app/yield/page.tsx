import type { Metadata } from "next";
import { YieldView } from "@/components/yield-view";

export const metadata: Metadata = { title: "Yield" };

export default function Page() {
  return <YieldView />;
}
