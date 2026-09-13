import type { Metadata } from "next";
import { BundlesView } from "@/components/bundles-view";

export const metadata: Metadata = { title: "Bundles" };

export default function Page() {
  return <BundlesView />;
}
