// Generated from docs/content.md. Copy is used verbatim; edit the doc first.

export const site = {
  name: "Black Saint Directory",
  description:
    "A digital studio in Manila building extraordinary websites, 3D experiences, systems and mobile apps.",
  location: "Digital studio — Manila, PH",
  disciplines: "Websites · 3D · Systems · Mobile",
  timeZone: "Asia/Manila",
} as const;

export const nav = [
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "Studio", href: "/studio" },
  { label: "Process", href: "/process" },
] as const;

export const startHref = "/start";

export const hero = {
  line1: "Every person is a saint",
  line2: "of their own life.",
} as const;

export const manifesto = {
  text: "Most websites are built from the same templates, so most brands end up looking the same. We think that's a waste. Every brand has a story worth telling properly — so we design and engineer every site from nothing, with the craft of a studio and the discipline of engineers. Extraordinary when it should be. Fast always. Yours entirely.",
  // Words the serpent line underlines (Phase 3).
  keyWords: ["extraordinary", "yours"],
} as const;

export const proof = {
  line: "Beautiful and fast is not a contradiction.",
} as const;

export const cta = {
  heading: "Ready to be extraordinary?",
  action: "Start a project",
} as const;

export const values = [
  "Craft over templates.",
  "The right tool, not the flashy one.",
  "Performance is design.",
  "Honest pricing.",
] as const;

export const notFound = {
  heading: "Lost? Even saints wander.",
  body: "Play a round, or head back home",
} as const;
