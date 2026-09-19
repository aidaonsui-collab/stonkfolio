import type { Metadata } from "next";
import { KeeperView } from "@/components/keeper-view";

export const metadata: Metadata = { title: "Keeper" };

export default function Page() {
  return <KeeperView />;
}
