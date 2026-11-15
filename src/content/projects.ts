// Generated from docs/content.md and docs/website-plan.md §12.

export type ProjectSection = { label: string; text: string };

export type Project = {
  slug: string;
  index: string;
  name: string;
  /** Concept labels are non-negotiable and always shown next to the name. */
  badge?: "Concept" | "Unofficial concept";
  kind: "web" | "mobile";
  meta: string;
  service: "editorial-sites" | "immersive-3d" | "systems" | "mobile";
  summary?: string;
  sections: ProjectSection[];
  /** null until the owner fills the [RESULT] line in docs/content.md. */
  result: string | null;
  live?: string;
  plate: string;
  screen: string;
};

const RESULT_PLACEHOLDER = "[RESULT]";

/** Anything still marked [RESULT] stays hidden. */
const result = (value: string): string | null =>
  value.trim() === "" || value.includes(RESULT_PLACEHOLDER) ? null : value;

export const projects: Project[] = [
  {
    slug: "easyhire-va-solutions",
    index: "01",
    name: "EasyHire VA Solutions",
    kind: "web",
    meta: "Web application · Recruitment · Client",
    service: "systems",
    sections: [
      {
        label: "The problem",
        text: "Finding real virtual-assistant work is confusing and risky for many Filipinos, and employers struggle to find VAs they can trust.",
      },
      {
        label: "What we did",
        text: "We designed and built a two-sided platform with a recruiter who has more than 20 years in recruitment and outsourcing — a clear, easy-to-understand experience for VAs, and a verified hiring flow for employers.",
      },
    ],
    result: result("[RESULT]"),
    plate: "/work/plates/01-easyhire.jpg",
    screen: "/work/screens/easyhire-web.webp",
  },
  {
    slug: "luwas-travel",
    index: "02",
    name: "Luwas Travel",
    kind: "web",
    meta: "Web application · Travel · Client: MDCC Travel and Tours",
    service: "systems",
    sections: [
      {
        label: "The problem",
        text: "Planning a local trip in the Philippines means juggling pages, chats and spreadsheets.",
      },
      {
        label: "What we did",
        text: "A travel companion focused on local destinations: curated places, personalised itineraries and booking in one place.",
      },
    ],
    result: result("[RESULT]"),
    plate: "/work/plates/02-luwas-web.jpg",
    screen: "/work/screens/luwas-web.webp",
  },
  {
    slug: "roomify",
    index: "03",
    name: "Roomify",
    kind: "web",
    meta: "AI product · Architecture",
    service: "systems",
    sections: [
      {
        label: "The idea",
        text: "Seeing a space before it's built shouldn't take days of rendering.",
      },
      {
        label: "What we did",
        text: "An AI-first design environment — upload a floor plan and get rendered visualisations of the space back.",
      },
    ],
    result: result("[RESULT]"),
    plate: "/work/plates/03-roomify.jpg",
    screen: "/work/screens/roomify-web.webp",
  },
  {
    slug: "but-first-coffee",
    index: "04",
    name: "But First Coffee",
    badge: "Concept",
    kind: "web",
    meta: "Website · Food & beverage",
    service: "editorial-sites",
    summary: "A dark, product-first website where the drink is the hero.",
    sections: [],
    result: null,
    live: "https://but-first-coffee-three.vercel.app/",
    plate: "/work/plates/04-butfirstcoffee.jpg",
    screen: "/work/screens/butfirstcoffee-web.webp",
  },
  {
    slug: "feastables",
    index: "05",
    name: "Feastables",
    badge: "Unofficial concept",
    kind: "web",
    meta: "Website · Consumer brand",
    service: "editorial-sites",
    summary:
      "A loud, high-energy launch site built around one bar. An independent concept; not affiliated with or commissioned by the brand.",
    sections: [],
    result: null,
    live: "https://feastables-nine.vercel.app/",
    plate: "/work/plates/05-feastables.jpg",
    screen: "/work/screens/feastables-web.webp",
  },
  {
    slug: "groove",
    index: "06",
    name: "Groove",
    kind: "mobile",
    meta: "Mobile app · Habits",
    service: "mobile",
    summary:
      "Log what you did today — from running to reading to shipping code — and watch it fill a contribution grid. Then share the streak with a community feed.",
    sections: [],
    result: null,
    plate: "/work/plates/06-groove.jpg",
    screen: "/work/screens/groove-mobile.webp",
  },
  {
    slug: "trabawho",
    index: "07",
    name: "TrabaWHO",
    kind: "mobile",
    meta: "Mobile app · Local AI",
    service: "mobile",
    summary:
      "Describe the problem at home in Taglish. A language model running on the phone turns it into a bookable job — and it keeps working in airplane mode.",
    sections: [],
    result: null,
    plate: "/work/plates/07-trabawho.jpg",
    screen: "/work/screens/trabawho-mobile.webp",
  },
  {
    slug: "luwas-mobile",
    index: "08",
    name: "Luwas Mobile",
    kind: "mobile",
    meta: "Mobile app · Travel · Client: MDCC Travel and Tours",
    service: "mobile",
    summary:
      "The mobile side of Luwas. Browse destinations, book trips and manage itineraries, with in-app chat support, weather and traveller reviews.",
    sections: [],
    result: null,
    plate: "/work/plates/08-luwas-mobile.jpg",
    screen: "/work/screens/luwas-mobile.webp",
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export const getNextProject = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};
