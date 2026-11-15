// Generated from docs/content.md.

export type Saint = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  line: string;
  links: { label: string; href: string }[];
  cutout: string;
  portrait: string;
};

export const saints: Saint[] = [
  {
    slug: "moncito",
    name: "Moncito Glenn Hernandez",
    role: "CEO · Founder · Director · Software Engineer",
    bio: "Moncito founded Black Saint Directory on a simple belief: every person is a saint of their own life, and every brand deserves a stage that does it justice. A full-stack engineer and UI/UX designer, he leads the studio's product, design and engineering — from the first sketch to the last line of code.",
    line: "I'm the saint of details nobody notices — until they're missing.",
    links: [
      { label: "Portfolio", href: "https://saintsportfolio.vercel.app/" },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/moncito-glenn-hernandez-238605261/",
      },
    ],
    cutout: "/team/moncito-cutout.png",
    portrait: "/team/moncito-portrait.jpg",
  },
  {
    slug: "marc",
    name: "Marc Ace Flores",
    role: "CMO · Head of Marketing",
    bio: "Marc leads how Black Saint Directory shows up in the world — the brand, the voice and the community around the studio. He makes sure the work doesn't just get built, it gets seen.",
    line: "I'm the saint of being remembered.",
    links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/marcaceflores/" }],
    cutout: "/team/marc-cutout.png",
    portrait: "/team/marc-portrait.jpg",
  },
];
