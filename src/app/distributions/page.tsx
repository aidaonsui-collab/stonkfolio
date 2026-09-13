import type { Metadata } from "next";
import { DistributionsView } from "@/components/distributions-view";

export const metadata: Metadata = { title: "Distributions" };

export default function Page() {
  return <DistributionsView />;
}
