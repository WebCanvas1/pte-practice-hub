/**
 * Central platform configuration.
 *
 * Everything here is intended to be editable later through the admin portal
 * (Platform Settings) or via environment variables. Do NOT hardcode the
 * platform name, contact details, pricing labels or brand colours elsewhere.
 */

const env = (key: string, fallback: string) => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value && value.length > 0 ? value : fallback;
};

export type ModuleKey = "speaking" | "reading" | "writing" | "listening";
export type DifficultyKey = "easy" | "intermediate" | "hard";

export const siteConfig = {
  name: env("VITE_PLATFORM_NAME", "ScorePath PTE"),
  shortName: env("VITE_PLATFORM_SHORT_NAME", "ScorePath"),
  tagline: env("VITE_PLATFORM_TAGLINE", "AI-powered PTE practice, from just $1"),
  description: env(
    "VITE_PLATFORM_DESCRIPTION",
    "Practice real PTE Academic tasks across Speaking, Reading, Writing and Listening with instant automated scoring and AI feedback.",
  ),
  logo: {
    // Text-mark logo: initials rendered in a rounded brand tile.
    initials: env("VITE_PLATFORM_LOGO_INITIALS", "SP"),
    imageUrl: env("VITE_PLATFORM_LOGO_URL", ""),
  },
  supportEmail: env("VITE_SUPPORT_EMAIL", "support@scorepath.example"),
  supportPhone: env("VITE_SUPPORT_PHONE", "+61 2 8000 0000"),
  company: {
    legalName: env("VITE_COMPANY_LEGAL_NAME", "ScorePath Education Pty Ltd"),
    address: env("VITE_COMPANY_ADDRESS", "Sydney, NSW, Australia"),
    abn: env("VITE_COMPANY_ABN", "00 000 000 000"),
  },
  social: {
    facebook: env("VITE_SOCIAL_FACEBOOK", ""),
    instagram: env("VITE_SOCIAL_INSTAGRAM", ""),
    youtube: env("VITE_SOCIAL_YOUTUBE", ""),
  },
} as const;

export const pricingConfig = {
  currency: env("VITE_CURRENCY_CODE", "AUD"),
  currencySymbol: env("VITE_CURRENCY_SYMBOL", "$"),
  modulePrice: Number(env("VITE_PRICE_MODULE_TEST", "1")),
  fullMockPrice: Number(env("VITE_PRICE_FULL_MOCK", "5")),
  labels: {
    moduleTest: "Single module test",
    fullMock: "Full mock test",
    perTest: "per test",
    taxNote: "All prices in AUD and include GST where applicable.",
    fromPrefix: "from",
  },
} as const;

export const formatPrice = (amount: number) =>
  `${pricingConfig.currencySymbol}${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)} ${pricingConfig.currency}`;

/** Brand colours are the source of truth for design tokens in src/styles.css. */
export const brandColors = {
  primary: "oklch(0.55 0.2 258)", // blue
  accent: "oklch(0.55 0.22 300)", // purple
  background: "oklch(1 0 0)", // clean white
} as const;

export const testModules: {
  key: ModuleKey;
  name: string;
  blurb: string;
  taskCount: number;
  minutes: number;
  icon: "mic" | "book-open" | "pen-line" | "headphones";
}[] = [
  {
    key: "speaking",
    name: "Speaking",
    blurb: "Read aloud, repeat sentence, describe image and retell lecture with pronunciation and fluency scoring.",
    taskCount: 5,
    minutes: 30,
    icon: "mic",
  },
  {
    key: "reading",
    name: "Reading",
    blurb: "Multiple choice, re-order paragraphs and fill in the blanks drawn from exam-style academic texts.",
    taskCount: 5,
    minutes: 32,
    icon: "book-open",
  },
  {
    key: "writing",
    name: "Writing",
    blurb: "Summarise written text and essay tasks graded on content, form, grammar and vocabulary.",
    taskCount: 2,
    minutes: 40,
    icon: "pen-line",
  },
  {
    key: "listening",
    name: "Listening",
    blurb: "Summarise spoken text, dictation and highlight incorrect words with native-speed audio.",
    taskCount: 8,
    minutes: 35,
    icon: "headphones",
  },
];

export const difficultyLevels: { key: DifficultyKey; name: string; note: string }[] = [
  { key: "easy", name: "Easy", note: "Build confidence with slower pacing and shorter texts." },
  { key: "intermediate", name: "Intermediate", note: "True exam pacing and difficulty." },
  { key: "hard", name: "Hard", note: "Above-exam difficulty to stretch for 79+ scores." },
];

/** Feature flags for functionality that is intentionally not built yet. */
export const featureFlags = {
  payments: false,
  aiEvaluation: false,
  coupons: false,
} as const;
