import path from "node:path";

export const ROOT_DIR = process.cwd();
export const ARCHIVE_DIR = path.join(ROOT_DIR, "archive");
export const DATA_DIR = path.join(ROOT_DIR, "data");
export const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");
export const README_PATH = path.join(ROOT_DIR, "README.md");

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseDateArg(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid date format: ${value}. Expected YYYY-MM-DD.`);
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function getDateFromArgs(): Date {
  const args = process.argv.slice(2);
  const dateIndex = args.indexOf("--date");
  if (dateIndex !== -1 && args[dateIndex + 1]) {
    return parseDateArg(args[dateIndex + 1]);
  }
  return new Date();
}

export function getSiteFilterFromArgs(): Set<string> | null {
  const args = process.argv.slice(2);
  const sitesIndex = args.indexOf("--sites");
  if (sitesIndex === -1 || !args[sitesIndex + 1]) {
    return null;
  }

  return new Set(
    args[sitesIndex + 1]
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean),
  );
}

export function getDayArchiveDir(date: Date): string {
  return path.join(ARCHIVE_DIR, formatMonth(date), formatDate(date));
}

export function getScreenshotPath(date: Date, slug: string): string {
  return path.join(getDayArchiveDir(date), `${slug}.png`);
}

export function getMonthReadmePath(date: Date): string {
  return path.join(ARCHIVE_DIR, formatMonth(date), "README.md");
}

export function toRepoRelative(absolutePath: string): string {
  return path.relative(ROOT_DIR, absolutePath).split(path.sep).join("/");
}
