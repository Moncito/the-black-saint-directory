// The price book — single source for the quote builder (docs/pricing.md).
// Change values here; components never hard-code prices.

export type Package = {
  id: string;
  name: string;
  scope: string;
  /** PHP range. `open` means the upper bound is "+". */
  php: { low: number; high: number; open?: boolean };
  timeline: string;
};

export const packages: Package[] = [
  {
    id: "editorial-essential",
    name: "Editorial — Essential",
    scope: "1–5 pages, custom design, motion, CMS, basic SEO",
    php: { low: 60_000, high: 90_000 },
    timeline: "3–5 weeks",
  },
  {
    id: "editorial-signature",
    name: "Editorial — Signature",
    scope: "6–12 pages, advanced motion + page transitions, CMS, analytics",
    php: { low: 120_000, high: 220_000 },
    timeline: "6–8 weeks",
  },
  {
    id: "immersive-scene",
    name: "Immersive 3D — Scene",
    scope: "Editorial site + one hero 3D scene / product viewer",
    php: { low: 200_000, high: 350_000 },
    timeline: "6–10 weeks",
  },
  {
    id: "immersive-flagship",
    name: "Immersive 3D — Flagship",
    scope: "Full 3D-driven experience, custom models, scroll storytelling",
    php: { low: 400_000, high: 800_000, open: true },
    timeline: "10–16 weeks",
  },
  {
    id: "systems-discovery",
    name: "Systems — Discovery",
    scope:
      "Paid workshop: requirements, flows, architecture, fixed build quote (credited to the build)",
    php: { low: 25_000, high: 50_000 },
    timeline: "1–2 weeks",
  },
  {
    id: "systems-build",
    name: "Systems — Build",
    scope: "Quoted per module after Discovery",
    php: { low: 250_000, high: 1_500_000, open: true },
    timeline: "2–6 months",
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    scope: "MVP app + admin panel",
    php: { low: 350_000, high: 1_200_000, open: true },
    timeline: "3–6 months",
  },
];

export const usd = {
  editorial: "$2,500–6,000",
  scene: "$6,000–12,000",
  flagship: "$15,000+",
  systems: "from $8,000",
} as const;

export const carePlans = [
  {
    id: "keep",
    name: "Keep",
    includes: "Hosting management, uptime monitoring, monthly backups, security updates",
    phpMonthly: 3_500,
  },
  {
    id: "grow",
    name: "Grow",
    includes: "Keep + 3 hours of edits/month, analytics report",
    phpMonthly: 8_000,
  },
  {
    id: "partner",
    name: "Partner",
    includes: "Grow + 10 hours, priority support, small new sections",
    phpMonthly: 18_000,
  },
] as const;

export const rules = {
  rushMultiplier: 1.2,
  note: "Final quote after a short discovery call.",
  /** Under the threshold: 50 / 50. At or above: 40 / 30 / 30. */
  termsThresholdPhp: 150_000,
  termsBelow: "50% to start, 50% before launch",
  termsAbove: "40 / 30 / 30",
} as const;

export const formatPhp = (n: number) => `₱${n.toLocaleString("en-PH")}`;

export const formatRange = (p: Package["php"]) =>
  `${formatPhp(p.low)}–${p.high.toLocaleString("en-PH")}${p.open ? "+" : ""}`;
