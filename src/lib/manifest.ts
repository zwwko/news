import fs from "node:fs/promises";
import { MANIFEST_PATH } from "./paths.js";
import type { CaptureResult } from "./capture-site.js";

export interface SiteCaptureRecord {
  slug: string;
  name: string;
  url: string;
  status: "success" | "failed";
  screenshot?: string;
  capturedAt: string;
  error?: string;
}

export interface DayCaptureRecord {
  date: string;
  sites: SiteCaptureRecord[];
  successCount: number;
  failedCount: number;
}

export interface Manifest {
  version: 1;
  updatedAt: string;
  days: DayCaptureRecord[];
}

function emptyManifest(): Manifest {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    days: [],
  };
}

export async function readManifest(): Promise<Manifest> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return emptyManifest();
  }
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  await fs.mkdir(MANIFEST_PATH.replace(/[^/\\]+$/, ""), { recursive: true });
  manifest.updatedAt = new Date().toISOString();
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

export function toSiteRecord(
  result: CaptureResult,
  screenshotRelative?: string,
): SiteCaptureRecord {
  return {
    slug: result.slug,
    name: result.name,
    url: result.url,
    status: result.status,
    screenshot: screenshotRelative,
    capturedAt: result.capturedAt,
    error: result.error,
  };
}

export function upsertDayRecord(
  manifest: Manifest,
  date: string,
  sites: SiteCaptureRecord[],
): void {
  const successCount = sites.filter((site) => site.status === "success").length;
  const failedCount = sites.length - successCount;
  const dayRecord: DayCaptureRecord = {
    date,
    sites,
    successCount,
    failedCount,
  };

  const index = manifest.days.findIndex((day) => day.date === date);
  if (index === -1) {
    manifest.days.unshift(dayRecord);
  } else {
    manifest.days[index] = dayRecord;
  }

  manifest.days.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getDayRecord(manifest: Manifest, date: string): DayCaptureRecord | undefined {
  return manifest.days.find((day) => day.date === date);
}

export function listMonthDays(manifest: Manifest, month: string): DayCaptureRecord[] {
  return manifest.days.filter((day) => day.date.startsWith(`${month}-`));
}

export function listMonths(manifest: Manifest): string[] {
  const months = new Set<string>();
  for (const day of manifest.days) {
    months.add(day.date.slice(0, 7));
  }
  return [...months].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}
