import { chromium, type Browser, type BrowserContext } from "playwright";

const VIEWPORT = { width: 1920, height: 1080 };

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function getProxyServer(): string | undefined {
  return (
    process.env.https_proxy ??
    process.env.HTTPS_PROXY ??
    process.env.http_proxy ??
    process.env.HTTP_PROXY
  );
}

export async function launchBrowser(): Promise<Browser> {
  const launchOptions = {
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  };

  try {
    return await chromium.launch({ ...launchOptions, channel: "chrome" });
  } catch {
    return chromium.launch(launchOptions);
  }
}

export async function createContext(browser: Browser): Promise<BrowserContext> {
  const proxyServer = getProxyServer();

  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: "en-US",
    timezoneId: "Asia/Shanghai",
    userAgent: USER_AGENT,
    deviceScaleFactor: 1,
    ...(proxyServer ? { proxy: { server: proxyServer } } : {}),
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    // @ts-expect-error injected for anti-detection
    window.chrome = { runtime: {} };
  });

  return context;
}

export const PAGE_TIMEOUT_MS = 90_000;
export const NAVIGATION_TIMEOUT_MS = 90_000;
