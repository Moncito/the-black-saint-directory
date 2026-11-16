import {
  carePlans,
  packages,
  recommendedCare,
  rules,
  usdRanges,
  type Package,
} from "@/content/pricing";

/**
 * Quote logic, per docs/pricing.md. Pure functions over the price book, so the
 * builder and the inquiry API compute exactly the same thing.
 */

export type ServiceLine = "editorial" | "immersive" | "systems" | "mobile";
export type Level = "none" | "scene" | "flagship";
export type Currency = "PHP" | "USD";

export type Selection = {
  service: ServiceLine;
  pages: number;
  level: Level;
  rush: boolean;
  care: "none" | (typeof carePlans)[number]["id"];
  currency: Currency;
};

export const serviceLines: { id: ServiceLine; label: string }[] = [
  { id: "editorial", label: "Editorial Sites" },
  { id: "immersive", label: "Immersive 3D" },
  { id: "systems", label: "Systems" },
  { id: "mobile", label: "Mobile" },
];

export const levels: { id: Level; label: string }[] = [
  { id: "none", label: "None" },
  { id: "scene", label: "One scene" },
  { id: "flagship", label: "Flagship" },
];

const pkg = (id: string) => packages.find((p) => p.id === id) as Package;

function pick(sel: Selection): Package {
  if (sel.service === "systems") return pkg("systems-discovery");
  if (sel.service === "mobile") return pkg("mobile-app");
  const level = sel.service === "immersive" && sel.level === "none" ? "scene" : sel.level;
  if (level === "flagship") return pkg("immersive-flagship");
  if (level === "scene") return pkg("immersive-scene");
  return pkg(sel.pages <= 5 ? "editorial-essential" : "editorial-signature");
}

const round = (n: number, to: number) => Math.round(n / to) * to;
const php = (n: number) => `₱${n.toLocaleString("en-PH")}`;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function quote(sel: Selection) {
  const chosen = pick(sel);
  const factor = sel.rush ? rules.rushMultiplier : 1;
  const low = round(chosen.php.low * factor, 1000);
  const high = round(chosen.php.high * factor, 1000);

  const international = usdRanges[chosen.id];
  let range = `${php(low)}–${high.toLocaleString("en-PH")}${chosen.php.open ? "+" : ""}`;
  let currencyNote: string | null = null;
  if (sel.currency === "USD") {
    if (international) {
      const l = round(international.low * factor, 100);
      range =
        international.high === null
          ? `${chosen.id.startsWith("systems") ? "From " : ""}${usd(l)}${chosen.id.startsWith("systems") ? "" : "+"}`
          : `${usd(l)}–${round(international.high * factor, 100).toLocaleString("en-US")}`;
    } else {
      currencyNote = "Quoted in PHP";
    }
  }

  const build = sel.service === "systems" ? pkg("systems-build") : null;
  const recommended = carePlans.find((c) => c.id === recommendedCare[chosen.id])!;
  const care = sel.care === "none" ? null : carePlans.find((c) => c.id === sel.care)!;

  return {
    package: chosen,
    range,
    currencyNote,
    timeline: chosen.timeline,
    rush: sel.rush,
    /** Systems starts with Discovery; the build is quoted per module afterwards. */
    followUp: build
      ? {
          name: build.name,
          range: `${php(build.php.low)}–${build.php.high.toLocaleString("en-PH")}+`,
          timeline: build.timeline,
          scope: build.scope,
        }
      : null,
    recommendedCare: recommended,
    care,
    terms: low < rules.termsThresholdPhp ? rules.termsBelow : rules.termsAbove,
    note: rules.note,
  };
}

export type Quote = ReturnType<typeof quote>;

/** Plain-text summary used in the inquiry email and the stored record. */
export function summarize(sel: Selection, q: Quote) {
  return [
    `Service: ${serviceLines.find((s) => s.id === sel.service)?.label}`,
    sel.service === "editorial" || sel.service === "immersive" ? `Pages: ${sel.pages}` : null,
    sel.service === "editorial" || sel.service === "immersive"
      ? `3D: ${levels.find((l) => l.id === sel.level)?.label}`
      : null,
    `Timeline: ${sel.rush ? "Rush" : "Standard"} (${q.timeline})`,
    `Package: ${q.package.name}`,
    `Range: ${q.range}${q.currencyNote ? ` (${q.currencyNote})` : ""}`,
    q.followUp ? `Then: ${q.followUp.name} ${q.followUp.range}` : null,
    `Care plan: ${q.care ? q.care.name : "None"} (suggested: ${q.recommendedCare.name})`,
    `Terms: ${q.terms}`,
  ]
    .filter(Boolean)
    .join("\n");
}
