import { NEWS_SITES } from "./config/sites.js";
import { createContext, getProxyServer, launchBrowser } from "./lib/browser.js";
import {
  captureSite,
  cleanupEmptyDayDir,
  removeStaleScreenshot,
} from "./lib/capture-site.js";
import {
  getDayRecord,
  readManifest,
  toSiteRecord,
  upsertDayRecord,
  writeManifest,
} from "./lib/manifest.js";
import { formatDate, getDateFromArgs, getSiteFilterFromArgs } from "./lib/paths.js";
import { renderIndexes, toRelativeScreenshotPath } from "./lib/render-readme.js";

async function main(): Promise<void> {
  const date = getDateFromArgs();
  const dateString = formatDate(date);
  const siteFilter = getSiteFilterFromArgs();
  const sites = siteFilter
    ? NEWS_SITES.filter((site) => siteFilter.has(site.slug))
    : NEWS_SITES;

  if (sites.length === 0) {
    throw new Error("No sites matched the provided --sites filter.");
  }

  console.log(`[capture] Starting capture for ${dateString}`);

  const proxyServer = getProxyServer();
  if (proxyServer) {
    console.log(`[capture] Using proxy: ${proxyServer}`);
  }

  const browser = await launchBrowser();
  const context = await createContext(browser);
  const page = await context.newPage();

  const results = [];

  try {
    for (const site of sites) {
      console.log(`[capture] ${site.name} (${site.url})`);
      const result = await captureSite(page, site, date);
      results.push(result);

      if (result.status === "success") {
        console.log(`[capture] ✓ ${site.name}`);
      } else {
        console.error(`[capture] ✗ ${site.name}: ${result.error}`);
        await removeStaleScreenshot(result.screenshotPath);
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const capturedRecords = results.map((result) =>
    toSiteRecord(
      result,
      result.status === "success" && result.screenshotPath
        ? toRelativeScreenshotPath(result.screenshotPath)
        : undefined,
    ),
  );

  const manifest = await readManifest();
  const existingDay = getDayRecord(manifest, dateString);
  let siteRecords = capturedRecords;

  if (siteFilter && existingDay) {
    const capturedBySlug = new Map(capturedRecords.map((site) => [site.slug, site]));
    siteRecords = existingDay.sites.map(
      (site) => capturedBySlug.get(site.slug) ?? site,
    );

    for (const site of capturedRecords) {
      if (!siteRecords.some((record) => record.slug === site.slug)) {
        siteRecords.push(site);
      }
    }
  }

  upsertDayRecord(manifest, dateString, siteRecords);
  await writeManifest(manifest);
  await renderIndexes(manifest, date);

  const successCount = siteRecords.filter((site) => site.status === "success").length;
  const failedCount = siteRecords.length - successCount;

  if (successCount === 0) {
    await cleanupEmptyDayDir(date);
  }

  console.log(
    `[capture] Done for ${dateString}: ${successCount} succeeded, ${failedCount} failed`,
  );

  if (failedCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[capture] Fatal error:", error);
  process.exit(1);
});
