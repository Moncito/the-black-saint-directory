# Launch — Phase 6

The site is built and live at **https://the-black-saint-directory.vercel.app** (Vercel, team EasyHire VA Solutions, project `the-black-saint-directory`, production branch `main`).

This page lists what is still needed before the real launch and the Awwwards submission, in order. Items marked **Owner** need you; everything else is done.

## 1. Before going public

| # | Item | Who | How |
|---|---|---|---|
| 1 | Buy the domain | Owner | Any registrar, or `vercel domains buy <domain> --scope easy-hire-va-solutions`. |
| 2 | Connect the domain | Owner, then dev | `vercel domains add <domain> the-black-saint-directory --scope easy-hire-va-solutions`, then set the DNS records Vercel prints. Add both the apex and `www`, and redirect one to the other in Vercel → Domains. |
| 3 | Point canonical URLs at the domain | Owner | Vercel → Project → Settings → Environment Variables: `NEXT_PUBLIC_SITE_URL = https://<domain>` (Production), then redeploy. Sitemap, robots, canonical and Open Graph URLs all follow it. |
| 4 | Connect the inquiry form | Owner | Same screen, Production: `INQUIRY_TO` (inbox), `RESEND_API_KEY`, `INQUIRY_FROM` (a sender on the verified domain, e.g. `Black Saint Directory <hello@<domain>>`). Optional storage: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and an `inquiries` table (columns in `src/app/api/inquiry/route.ts`). Until set, the form says plainly that it was not sent. |
| 5 | Turn on Analytics | Owner | Vercel → Project → Analytics → Enable. The code is already in place (cookieless). |
| 6 | Fill the `[RESULT]` lines | Owner | `docs/content.md` → then copy into `src/content/projects.ts` (`result:`). Each stays hidden until filled. |
| 7 | Tech stack per project (optional) | Owner | Add `stack: [...]` to a project in `src/content/projects.ts`; it appears in "How we built it". Hidden until set. |
| 8 | Studio social links | Owner | When they exist, add them to the footer's Connect column (`src/components/Footer.tsx`). |
| 9 | Founder photo reshoot | Owner | Replace `public/team/*-cutout.png` (transparent PNG, same names). The halftone is CSS, so nothing else changes. |
| 10 | Test on real devices | Owner + dev | See the checklist below. Everything so far was verified in headless Chrome, which renders WebGL in software. |

## 2. Real-device checklist

Run on one mid-range Android phone, one iPhone, and a laptop with a real GPU.

- [ ] Intro: loads, counter reaches 100, both Enter buttons work, serpent forms the logo, logo flies into the nav. Skip and Esc work at every moment.
- [ ] Intro sound: "Enter with sound" plays the hum and the slither; the nav toggle turns it off and on.
- [ ] Wait 30 seconds at the gate, then Enter: the serpent still plays.
- [ ] Home: manifesto, work gallery, services halo and process all scroll smoothly; footer lifts into place.
- [ ] Candle light follows the cursor on desktop and drifts on phones (tilt on Android).
- [ ] Work: list ↔ grid and filters animate; clicking a plate grows it into the case study.
- [ ] Case study: press W on desktop; on phones the "How we built it" button sits in the page.
- [ ] Immersive 3D demo: drag to turn, hotspots open their notes.
- [ ] Quote builder: ranges update; submit sends (after step 4) and draws the checkmark.
- [ ] 404 (`/anything`): Snake plays with keys and with swipes.
- [ ] Turn on reduced motion in the OS: everything is readable, nothing animates, no intro serpent.
- [ ] Keyboard only: Tab from the top reaches every link with a visible focus ring.

## 3. Awwwards submission kit

Submit at awwwards.com/submit (paid; pick the tier there). The FAQ lists the main thumbnail at **1600 × 1200 px** — confirm on the form, it is entered after payment.

**Assets** — render with the production build running (`npm run build && npm run start`):

- `npm run launch:shots -- --url=http://localhost:3000` → `launch/` — ten desktop frames at 1600 × 1200 (`01-hero` is the suggested thumbnail) and three phone frames at 390 × 844 @3×.
- `npm run capture:intro -- --url=http://localhost:3000 --size=1920x1080 --fps=60 --crf=18 --out=launch/intro-serpent-1080p.mp4` — the serpent forming the logo, 3 s.
- The plan also calls for a **30-second screen recording of the intro and hero**. Record it on a machine with a real GPU (OBS or the OS recorder, 60 fps), sound on: headless captures cannot show the real frame rate.

**Form fields** (copy from `docs/content.md`; nothing new written):

- Site name: Black Saint Directory
- URL: the final domain (not the vercel.app address)
- Description: A digital studio in Manila building extraordinary websites, 3D experiences, systems and mobile apps. Every person is a saint of their own life.
- Country: Philippines
- Credits: Moncito Glenn Hernandez — CEO · Founder · Director · Software Engineer; Marc Ace Flores — CMO · Head of Marketing
- Built with: Next.js (App Router), React, TypeScript, Three.js / React Three Fiber, custom GLSL, WebGL, GSAP (ScrollTrigger, SplitText, Flip), Lenis, Web Audio, Tailwind CSS, Vercel
- Also submit for the Developer Award, then CSSDA, FWA, Godly and Muzli, per the plan.

**Only submit when** the domain is live, the inquiry form sends, and the `[RESULT]` lines are filled — the plan's own rule: real case studies, live and polished.

## 4. Where things are

- Spec, brand, copy, prices: `docs/`
- Copy as code: `src/content/` (one source per area; prices in `src/content/pricing.ts`)
- Intro fallback video: `public/intro/serpent.mp4` — regenerate with `npm run capture:intro` after changing the intro.
- Share images: `public/og/` — regenerate with `npm run og` after changing a plate.
