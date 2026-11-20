// Search titles and descriptions — what Google shows in results. Approved by
// the owner on 2026-11-20. Page headings on the site itself are unchanged.
// The layout appends " — Black Saint Directory" to every title except home.

export const seo = {
  home: {
    title: "Black Saint Directory — Web Design & 3D Studio in Manila",
  },
  work: {
    title: "Our Work: Websites, 3D & Apps",
    description:
      "Web applications, websites and mobile apps by Black Saint Directory — a digital studio in Manila. Recruitment, travel, AI, food and consumer brands.",
  },
  services: {
    title: "Web Design, 3D & App Development",
    description:
      "Editorial websites from ₱60,000, immersive 3D from ₱200,000, web applications and iOS/Android apps — designed and engineered in Manila.",
  },
  studio: {
    title: "About the Studio & Founders",
    description:
      "Black Saint Directory is a Manila digital studio led by Moncito Glenn Hernandez and Marc Ace Flores. Craft over templates. Performance is design.",
  },
  process: {
    title: "How We Work: From Brief to Launch",
    description:
      "Six stations from first call to launch: Discover, Strategy, Design, Build, QA, Launch & Care. Nothing gets built until you approve it.",
  },
  start: {
    title: "Website Price & Quote Calculator",
    description:
      "Pick a service, pages, 3D and timeline and see an instant price range for your website or app. Final quote after a short discovery call.",
  },
  /** Service pages keep their own descriptions from content.md. */
  service: {
    "editorial-sites": "Custom Website Design, Manila",
    "immersive-3d": "3D Website & WebGL Development",
    systems: "Web App & Dashboard Development",
    mobile: "iOS & Android App Development",
  } as Record<string, string>,
} as const;
