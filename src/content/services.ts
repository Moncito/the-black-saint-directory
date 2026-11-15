// Generated from docs/content.md.

export type Service = {
  slug: string;
  index: string;
  name: string;
  description: string;
  priceFrom: string;
};

export const services: Service[] = [
  {
    slug: "editorial-sites",
    index: "01",
    name: "Editorial Sites",
    description:
      "Custom-designed, motion-rich websites that read like a magazine and load like a utility. For most brands, this is the right answer.",
    priceFrom: "From ₱60,000",
  },
  {
    slug: "immersive-3d",
    index: "02",
    name: "Immersive 3D",
    description:
      "Real-time 3D experiences: product viewers, interactive scenes, scroll stories. For brands that sell on wow — and only when 3D earns its place.",
    priceFrom: "From ₱200,000",
  },
  {
    slug: "systems",
    index: "03",
    name: "Systems",
    description:
      "Web applications that run your business: dashboards, booking, portals, internal tools. No 3D, no fuss — clean, fast and built to last.",
    priceFrom: "Starts with a paid discovery from ₱25,000",
  },
  {
    slug: "mobile",
    index: "04",
    name: "Mobile",
    description:
      "iOS and Android apps your customers keep, with the admin tools you need behind them.",
    priceFrom: "From ₱350,000",
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
