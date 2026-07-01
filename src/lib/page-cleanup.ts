import type { Page } from "playwright";
import type { NewsSite } from "../config/sites.js";

const COMMON_DISMISS_SELECTORS = [
  'button:has-text("Accept all")',
  'button:has-text("Accept All")',
  'button:has-text("Accept")',
  'button:has-text("I Accept")',
  'button:has-text("I agree")',
  'button:has-text("I Agree")',
  'button:has-text("Agree")',
  'button:has-text("Reject All")',
  'button:has-text("Continue")',
  'button:has-text("No thanks")',
  'button:has-text("Not now")',
  'button:has-text("Dismiss")',
  'button:has-text("Got it")',
  'button:has-text("Close")',
  '[aria-label="Accept"]',
  '[aria-label="Close"]',
  '[aria-label="Dismiss"]',
  'button[title="Close"]',
  '[data-testid="close-button"]',
  '[data-testid="modal-close"]',
];

const HIDE_CSS = `
  [id*="onetrust" i],
  [class*="onetrust" i],
  [id*="sp_message" i],
  [class*="sp_message" i],
  [id*="cookie" i],
  [class*="cookie-banner" i],
  [class*="cookie-consent" i],
  [id*="consent" i],
  [class*="consent-banner" i],
  [class*="gdpr" i],
  [class*="newsletter-modal" i],
  [class*="subscribe-modal" i],
  [class*="subscription-banner" i],
  [class*="ad-slot" i],
  [class*="ad-container" i],
  [class*="advertisement" i],
  [data-ad],
  [data-ad-slot],
  [data-component="ad-slot"],
  ins.adsbygoogle,
  iframe[src*="doubleclick"],
  iframe[src*="googlesyndication"],
  iframe[src*="ads."],
  iframe[src*="ad."],
  iframe[id*="google_ads" i] {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    max-height: 0 !important;
    overflow: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  body.modal-open,
  html.modal-open {
    overflow: auto !important;
  }
`;

const COMMON_HIDE_SELECTORS = [
  "#onetrust-banner-sdk",
  "#onetrust-consent-sdk",
  ".onetrust-pc-dark-filter",
  "[class*='sp_message']",
  "[id*='sp_message']",
  "[class*='newsletter-overlay']",
  "[class*='subscribe-overlay']",
  "[data-testid*='consent']",
  "[data-testid*='cookie']",
  "[data-component='ad-slot']",
  "[data-ad]",
  "ins.adsbygoogle",
];

export async function dismissPopups(page: Page, site: NewsSite): Promise<void> {
  const selectors = [
    ...(site.dismissSelectors ?? []),
    ...COMMON_DISMISS_SELECTORS,
  ];

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 500 })) {
        await locator.click({ timeout: 1500 });
        await page.waitForTimeout(300);
      }
    } catch {
      // Ignore missing or non-clickable popups.
    }
  }

  try {
    await page.keyboard.press("Escape");
  } catch {
    // Ignore if no modal is open.
  }
}

export async function hideAdsAndOverlays(page: Page, site: NewsSite): Promise<void> {
  await page.addStyleTag({ content: HIDE_CSS });

  const hideSelectors = [
    ...COMMON_HIDE_SELECTORS,
    ...(site.hideSelectors ?? []),
  ];

  await page.evaluate((selectors) => {
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((node) => node.remove());
    }

    document.querySelectorAll("*").forEach((element) => {
      const html = element as HTMLElement;
      const style = window.getComputedStyle(html);
      const zIndex = Number.parseInt(style.zIndex, 10);
      if (!Number.isFinite(zIndex) || zIndex < 50) {
        return;
      }

      if (style.position !== "fixed" && style.position !== "sticky") {
        return;
      }

      const rect = html.getBoundingClientRect();
      if (
        rect.width > window.innerWidth * 0.85 &&
        rect.height > window.innerHeight * 0.6
      ) {
        return;
      }

      const text = (html.innerText || "").toLowerCase();
      const className = (html.className || "").toString().toLowerCase();
      const id = (html.id || "").toLowerCase();
      const marker = `${text} ${className} ${id}`;

      if (
        /cookie|consent|subscribe|newsletter|privacy|advert|promo|offer|sign up|accept all/.test(
          marker,
        ) &&
        text.length < 800
      ) {
        html.remove();
      }
    });

    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
  }, hideSelectors);
}

/** Scroll down to trigger lazy-loaded content, then return to top. */
export async function scrollToLoadContent(page: Page, maxHeight = 20_000): Promise<void> {
  await page.evaluate(async (limit) => {
    await new Promise<void>((resolve) => {
      let scrolled = 0;
      const step = 900;

      const timer = window.setInterval(() => {
        const scrollHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        );

        window.scrollBy(0, step);
        scrolled += step;

        if (scrolled >= scrollHeight || scrolled >= limit) {
          window.clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 180);
    });
  }, maxHeight);

  await page.waitForTimeout(800);
}

export async function preparePageForScreenshot(page: Page, site: NewsSite): Promise<void> {
  await dismissPopups(page, site);
  await hideAdsAndOverlays(page, site);

  if (site.settleMs) {
    await page.waitForTimeout(site.settleMs);
  } else {
    await page.waitForTimeout(1000);
  }

  await dismissPopups(page, site);
  await hideAdsAndOverlays(page, site);
  await scrollToLoadContent(page, site.maxScrollHeight ?? 20_000);
  await hideAdsAndOverlays(page, site);
}
