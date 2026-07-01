import fs from "node:fs/promises";
import path from "node:path";
import { NEWS_SITES } from "../config/sites.js";
import type { DayCaptureRecord, Manifest } from "./manifest.js";
import {
  ARCHIVE_DIR,
  README_PATH,
  formatDate,
  formatMonth,
  getMonthReadmePath,
  toRepoRelative,
} from "./paths.js";

function siteOrder(slug: string): number {
  const index = NEWS_SITES.findIndex((site) => site.slug === slug);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function sortSites<T extends { slug: string }>(sites: T[]): T[] {
  return [...sites].sort((a, b) => siteOrder(a.slug) - siteOrder(b.slug));
}

function toMonthRelativeScreenshot(screenshot: string, month: string): string {
  const prefix = `archive/${month}/`;
  if (screenshot.startsWith(prefix)) {
    return screenshot.slice(prefix.length);
  }

  const parts = screenshot.split("/");
  if (parts.length >= 2) {
    return parts.slice(-2).join("/");
  }

  return screenshot;
}

function renderSiteCell(
  site: DayCaptureRecord["sites"][number],
  date: string,
  screenshotPath?: string,
): string {
  const imagePath = screenshotPath ?? site.screenshot;
  if (site.status === "success" && imagePath) {
    return `| ![${site.name}](${imagePath}) [${site.name}](${imagePath}) |`;
  }

  const reason = site.error ? ` — ${site.error}` : "";
  return `| ${site.name} — failed${reason} |`;
}

function renderDayGrid(day: DayCaptureRecord, monthArchive?: string): string {
  const sites = sortSites(day.sites);
  const lines: string[] = [];
  lines.push(`### ${day.date}`);
  lines.push("");
  lines.push(`Success: ${day.successCount}/${day.sites.length}`);
  if (day.failedCount > 0) {
    const failed = sites
      .filter((site) => site.status === "failed")
      .map((site) => site.name)
      .join(", ");
    lines.push("");
    lines.push(`Failed: ${failed}`);
  }
  lines.push("");
  lines.push("| | | |");
  lines.push("| :----: | :----: | :----: |");

  for (let i = 0; i < sites.length; i += 3) {
    const row = sites.slice(i, i + 3).map((site) =>
      renderSiteCell(
        site,
        day.date,
        site.screenshot && monthArchive
          ? toMonthRelativeScreenshot(site.screenshot, monthArchive)
          : site.screenshot,
      ),
    );
    while (row.length < 3) {
      row.push("| |");
    }
    lines.push(row.join(""));
  }

  lines.push("");
  return lines.join("\n");
}

function renderArchiveLinks(months: string[]): string {
  if (months.length === 0) {
    return "_No archive yet._";
  }

  const links = months.map((month) => `[${month}](/archive/${month}/)`);
  const rows: string[] = [];
  for (let i = 0; i < links.length; i += 8) {
    rows.push(links.slice(i, i + 8).join(" | "));
  }
  return rows.join("\n");
}

function renderReadmeContent(manifest: Manifest): string {
  const latest = manifest.days[0];
  const months = manifest.days.map((day) => day.date.slice(0, 7));
  const uniqueMonths = [...new Set(months)].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  const lines: string[] = [];
  lines.push("# News Homepage Screenshots");
  lines.push("");
  lines.push("Daily screenshots of major news homepages.");
  lines.push("");

  if (!latest) {
    lines.push("_No captures yet. Run `npm run capture` to create the first snapshot._");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(`Latest capture: **${latest.date}**`);
  lines.push("");
  lines.push(renderDayGrid(latest));
  lines.push("### 历史归档");
  lines.push("");
  lines.push(renderArchiveLinks(uniqueMonths));
  lines.push("");

  return lines.join("\n");
}

function renderMonthReadme(month: string, days: DayCaptureRecord[]): string {
  const lines: string[] = [];
  lines.push(`# News Homepage Screenshots (${month})`);
  lines.push("");

  if (days.length === 0) {
    lines.push("_No captures for this month._");
    lines.push("");
    return lines.join("\n");
  }

  for (const day of days) {
    lines.push(renderDayGrid(day, month));
  }

  return lines.join("\n");
}

export async function renderIndexes(manifest: Manifest, activeDate: Date): Promise<void> {
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  const readme = renderReadmeContent(manifest);
  await fs.writeFile(README_PATH, readme, "utf8");

  const month = formatMonth(activeDate);
  const monthDays = manifest.days.filter((day) => day.date.startsWith(`${month}-`));
  const monthReadme = renderMonthReadme(month, monthDays);
  const monthReadmePath = getMonthReadmePath(activeDate);
  await fs.mkdir(path.dirname(monthReadmePath), { recursive: true });
  await fs.writeFile(monthReadmePath, monthReadme, "utf8");
}

export function toRelativeScreenshotPath(absolutePath: string): string {
  return toRepoRelative(absolutePath);
}

export function todayDateString(): string {
  return formatDate(new Date());
}
