import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RewardChoice } from "./reward-choice";

const memory = new Map<string, RewardChoice>();

function filePath() {
  return join(process.cwd(), "data", "reward-choices.json");
}

function key(address: string) {
  return address.toLowerCase();
}

export function readChoice(address: string): RewardChoice | null {
  const k = key(address);
  const fromDisk = readAll()[k];
  const fromMemory = memory.get(k);
  if (fromDisk && fromMemory) return fromDisk.signedAt >= fromMemory.signedAt ? fromDisk : fromMemory;
  return fromDisk ?? fromMemory ?? null;
}

export function saveChoice(row: RewardChoice): { stored: boolean; current: RewardChoice } {
  const k = key(row.address);
  const prev = readChoice(row.address);
  if (prev && prev.signedAt > row.signedAt) return { stored: true, current: prev };
  memory.set(k, row);
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    const all = readAll();
    all[k] = row;
    writeFileSync(filePath(), JSON.stringify(all, null, 2));
    return { stored: true, current: row };
  } catch {
    return { stored: false, current: row };
  }
}

function readAll(): Record<string, RewardChoice> {
  try {
    const parsed = JSON.parse(readFileSync(filePath(), "utf8")) as Record<string, RewardChoice>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
