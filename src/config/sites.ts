export interface NewsSite {
  slug: string;
  name: string;
  url: string;
  /** Optional CSS selectors for cookie/consent dismiss buttons */
  dismissSelectors?: string[];
  /** CSS selectors for ad/popup elements to remove before screenshot */
  hideSelectors?: string[];
  /** Wait for this selector before screenshot */
  waitForSelector?: string;
  /** Extra milliseconds to wait after page load */
  settleMs?: number;
  /** Max pixels to scroll when loading lazy content for full-page capture */
  maxScrollHeight?: number;
  /** Capture full scrollable page (default: false) */
  fullPage?: boolean;
}

export const NEWS_SITES: NewsSite[] = [
  {
    slug: "bbc",
    name: "BBC",
    url: "https://www.bbc.com/news",
    dismissSelectors: [
      'button:has-text("Accept")',
      'button:has-text("Reject")',
      'button:has-text("Yes, I agree")',
      '[data-testid="consent-banner-accept"]',
    ],
    hideSelectors: [
      "#consent-banner",
      "[data-component='ad-slot']",
      "[class*='dotcom-ad']",
    ],
  },
  {
    slug: "cnn",
    name: "CNN",
    url: "https://edition.cnn.com/",
    dismissSelectors: [
      'button:has-text("Accept All")',
      'button:has-text("I Accept")',
    ],
    hideSelectors: [
      ".user-msg-overlay",
      "[class*='ad-slot']",
      "[data-ad-slot]",
    ],
  },
  {
    slug: "ft",
    name: "Financial Times",
    url: "https://www.ft.com/",
    dismissSelectors: [
      'button:has-text("Accept")',
      'button:has-text("I accept")',
      '[data-testid="accept-btn"]',
    ],
    hideSelectors: [
      ".o-banner",
      ".o-ads",
      "[data-component='ad-slot']",
    ],
    settleMs: 2000,
  },
  {
    slug: "the-times",
    name: "The Times",
    url: "https://www.thetimes.com/",
    dismissSelectors: [
      'button:has-text("Accept")',
      'button:has-text("I agree")',
    ],
    hideSelectors: [
      "[class*='cookie']",
      "[class*='advert']",
    ],
    settleMs: 2000,
  },
  {
    slug: "nytimes",
    name: "The New York Times",
    url: "https://www.nytimes.com/",
    dismissSelectors: [
      'button:has-text("Accept")',
      'button:has-text("Agree")',
      '[data-testid="GDPR-accept"]',
    ],
    hideSelectors: [
      "#dock-container",
      "[class*='css-rvl3on']",
      "[data-testid='inline-message']",
      "[class*='ad-slot']",
    ],
  },
  // {
  //   slug: "wsj",
  //   name: "The Wall Street Journal",
  //   url: "https://www.wsj.com/",
  //   dismissSelectors: [
  //     'button:has-text("Accept")',
  //     'button:has-text("I Agree")',
  //     'button:has-text("Close")',
  //     '[aria-label="Close"]',
  //   ],
  //   hideSelectors: [
  //     "#cx-notification",
  //     ".snippet-promotion",
  //     "[class*='adWrapper']",
  //     "[class*='Newsletter']",
  //   ],
  //   settleMs: 3000,
  //   maxScrollHeight: 25_000,
  // },
  {
    slug: "washington-post",
    name: "The Washington Post",
    url: "https://www.washingtonpost.com/",
    dismissSelectors: [
      'button:has-text("Accept")',
      'button:has-text("I Accept")',
    ],
    hideSelectors: [
      "[data-qa='consent-banner']",
      "[class*='ad-slot']",
    ],
  },
  {
    slug: "bloomberg",
    name: "Bloomberg",
    url: "https://www.bloomberg.com/",
    dismissSelectors: [
      'button:has-text("Accept")',
      'button:has-text("I agree")',
    ],
    hideSelectors: [
      "[class*='consent']",
      "[class*='newsletter']",
      "[data-component='ad-slot']",
    ],
    settleMs: 2000,
  },
  // {
  //   slug: "reuters",
  //   name: "Reuters",
  //   url: "https://www.reuters.com/",
  //   dismissSelectors: [
  //     'button:has-text("Accept All")',
  //     'button:has-text("Reject All")',
  //     'button:has-text("Close")',
  //   ],
  //   hideSelectors: [
  //     "[data-testid='ConsentBanner']",
  //     "[class*='ad-slot']",
  //     "[class*='consent']",
  //   ],
  //   settleMs: 2500,
  //   maxScrollHeight: 25_000,
  // },
  {
    slug: "al-jazeera",
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/",
    dismissSelectors: [
      'button:has-text("Accept")',
      'button:has-text("I agree")',
    ],
    hideSelectors: [
      "[class*='cookie']",
      "[class*='consent']",
      "[class*='advert']",
    ],
  },
];
