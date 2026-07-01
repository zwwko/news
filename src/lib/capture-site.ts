import fs from "node:fs/promises";
import type { Page } from "playwright";
import type { NewsSite } from "../config/sites.js";
import { NAVIGATION_TIMEOUT_MS, PAGE_TIMEOUT_MS } from "./browser.js";
import { preparePageForScreenshot } from "./page-cleanup.js";
import { getDayArchiveDir, getScreenshotPath } from "./paths.js";

export interface CaptureResult {
  slug: string;
  name: string;
  url: string;
  status: "success" | "failed";
  screenshotPath?: string;
  capturedAt: string;
  error?: string;
}

export async function captureSite(
  page: Page,
  site: NewsSite,
  date: Date,
): Promise<CaptureResult> {
  const capturedAt = new Date().toISOString();
  const screenshotPath = getScreenshotPath(date, site.slug);

  try {
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);

    await page.goto(site.url, {
      waitUntil: "commit",
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    await page.waitForLoadState("domcontentloaded", { timeout: 30_000 }).catch(() => {
      // Continue if DOM content is slow to settle.
    });

    if (site.waitForSelector) {
      await page.waitForSelector(site.waitForSelector, {
        timeout: 15_000,
        state: "visible",
      });
    } else {
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {
        // Some news sites never reach networkidle; continue anyway.
      });
    }

    await preparePageForScreenshot(page, site);

    await fs.mkdir(getDayArchiveDir(date), { recursive: true });
    await page.screenshot({
      path: screenshotPath,
      fullPage: site.fullPage === true,
      type: "png",
      animations: "disabled",
    });

    return {
      slug: site.slug,
      name: site.name,
      url: site.url,
      status: "success",
      screenshotPath,
      capturedAt,
    };
  } catch (error) {
    return {
      slug: site.slug,
      name: site.name,
      url: site.url,
      status: "failed",
      capturedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function removeStaleScreenshot(
  screenshotPath: string | undefined,
): Promise<void> {
  if (!screenshotPath) {
    return;
  }

  try {
    await fs.unlink(screenshotPath);
  } catch {
    // Ignore if file does not exist.
  }
}

export async function cleanupEmptyDayDir(date: Date): Promise<void> {
  const dayDir = getDayArchiveDir(date);
  try {
    const entries = await fs.readdir(dayDir);
    if (entries.length === 0) {
      await fs.rm(dayDir, { recursive: true, force: true });
    }
  } catch {
    // Ignore missing directories.
  }
}
