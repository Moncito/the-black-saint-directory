# Black Saint Directory — Website Plan

The creative direction and build spec for blacksaintdirectory's own website. The goal is not "a nice agency site". It is the site that sells every future project by itself, and our first Awwwards Site of the Day attempt.

## 1. The big idea: One Line

The whole website is drawn by **one continuous serpent line that never breaks**. It forms the logo in the intro, becomes the underline under the manifesto, threads through the case studies, wipes between pages, and finally coils back into the logo in the footer.

- **It's ours.** It comes straight from the logo, so the site and the brand are the same thing.
- **It's a system, not a trick.** One motion language everywhere feels designed; ten unrelated effects feel like a template.
- **It's memorable in one sentence.** "The site where a snake draws everything."

**Three rules that keep it classy**

1. **Monochrome until you touch the work.** The site is Ink, white and greys. Project images appear in grayscale and come alive in color on hover or when centered. Color = the client's work.
2. **Slow and heavy, never bouncy.** Long weighted easing (expo / power4 out, 0.9–1.4s).
3. **Fast despite the 3D.** It must load quickly on a mid-range Android phone. The speed is part of the pitch.

## 2. Sitemap

| Page | Purpose |
|---|---|
| Home | Intro, hero, manifesto, selected work, services halo, process, proof, CTA, footer reveal |
| Work | Portfolio index (list + grid views) and one page per case study |
| Services | Overview + Editorial Sites, Immersive 3D, Systems, Mobile |
| Studio | Who we are, the creators ("The Saints"), values, tools |
| Process | How a project runs, with timelines and deliverables |
| Start a project | Interactive quote builder + contact |
| 404 | Playable serpent game — "Lost? Even saints wander." |

Later: Journal, Careers. Language: **English only**.

## 3. The intro: the serpent forms the logo

Once per session, always skippable (button + Esc), about 4.5 seconds.

| Time | What the visitor sees |
|---|---|
| 0.0–0.8s | Pure black. Mono counter bottom-left 000 → 100 as real assets load. A single point of warm light appears center, like a candle. |
| 0.8–2.2s | A glossy black 3D serpent slithers in from the dark, lit only along its edges by the candle. Long lazy S-curve with real body undulation. |
| 2.2–3.2s | It climbs and folds along the logo's centerline: up into the hairpin, down and across into the doubled crossbar, down again, head rising at the foot. Undulation damps out as it settles. |
| 3.2–3.8s | Camera pulls back; the 3D form flattens into the 2D logo, material fading from obsidian to flat white. One soft flash of light runs head to tail. |
| 3.8–4.5s | "BLACK SAINT" types in beside it, "DIRECTORY" tracks out beneath. The lockup shrinks and flies into the nav (GSAP Flip) as the hero fades up. |

**Technique**

- **Path:** `public/brand/serpent-path.json` holds the logo's centerline (tail → head) in the master SVG's coordinates. Sample it into points, prepend a long winding off-screen approach path → one combined path.
- **Body:** a tube mesh whose vertices are positioned along that path in a vertex shader (path points in a DataTexture). Animate one value — head progress along the path — and the body follows. At the end, the body lies exactly on the logo.
- **Wiggle:** sine displacement perpendicular to the path, amplitude damped to zero as it settles.
- **Head + taper:** separate small head mesh at the leading point; tube radius tapers at the tail.
- **Flatten:** blend perspective → orthographic and squash Z to 0 so it lands precisely on the 2D logo.
- **Fallbacks:** weak GPU → pre-rendered video; `prefers-reduced-motion` → simple logo fade.

**Sound (decided: YES).** Off until the visitor opts in (browsers block autoplay; offer a tasteful "Enter with sound / Enter" choice on the loader). Low ambient hum, a soft scale-slither during the intro, subtle UI ticks on clicks and hovers. Sound toggle always in the nav. Keep files tiny; only use audio we have the rights to (royalty-free/CC0 or generated).

## 4. The hero

Full-screen Ink, very fine film grain, faint drifting fog.

- **Headline** (Inter Tight, ~12vw, tight tracking), lines rise in: *Every person is a saint* / *of their own life.* — second line in light italic.
- **3D serpent cross** right of center, glossy obsidian, slowly turning; tilts toward the cursor with inertia; drag to orbit, eases back on release.
- **Candlelight cursor (signature):** the cursor is a warm-white point light raking across the serpent and the fog. On phones, it follows device tilt (with permission) or a slow auto-drift.
- **Bottom bar (Geist Mono):** "Digital studio — Manila, PH" · live Manila clock · "Websites · 3D · Systems · Mobile" · a tiny serpent scroll cue.
- **Nav:** logo left; Work, Services, Studio, Process (mono, text-scramble on hover); "Start a project" pill right; sound toggle.

On scroll, the serpent uncoils out of the cross and becomes the line that leads into the next section.

## 5. Home, section by section

| # | Section | What happens |
|---|---|---|
| 1 | Intro + hero | As above. |
| 2 | Manifesto | Pinned. Each word goes 15% → 100% opacity as you scroll. The serpent line draws itself under key words. |
| 3 | Selected work | Pinned horizontal gallery of WebGL planes that bend with scroll velocity. Grayscale until centered/hovered, then full color. Cursor ring says "View". |
| 4 | Services halo | Four services on a halo ring orbiting the serpent cross. Scroll rotates the halo; the front service sharpens and shows its one-liner and price-from. Click → service page. |
| 5 | Process: six stations | Discover → Strategy → Design → Build → QA → Launch & Care. The line weaves through numbered stations as you scroll. |
| 6 | Proof | Live numbers about this page on this device: load time, transferred KB, 3D cost. "Beautiful and fast is not a contradiction." |
| 7 | Testimonials | Hidden until we have real ones. |
| 8 | CTA | "Ready to be extraordinary?" + magnetic "Start a project" button. |
| 9 | Footer reveal | Page lifts to reveal the footer; the line coils back into the logo. Giant wordmark, live clock, socials, email copy-to-clipboard. |

## 6. Other pages

**Work index:** List view (big names; hover shows a floating preview following the cursor with lag) and Grid view; switching animates with GSAP Flip. Filter by service.

**Case study:** shared-element transition (thumbnail grows into the hero image); scroll-scrubbed media; results; "How we built it" toggle (press W) showing wireframe/tech stack; next-project teaser that pulls you onward.

**Service pages, each with a live demo:**
- Editorial Sites — type playground (slider morphs a headline's weight/size).
- Immersive 3D — spinnable product viewer with hotspots.
- Systems — small live dashboard with moving charts and a fake order queue.
- Mobile — 3D phone rotating on scroll, screens changing (use `public/work/screens/*-mobile.webp`).

**Studio / The Saints:** portraits from `public/team/*-cutout.png` rendered with a monochrome halftone/dither shader; hover sharpens to the photo. Cards flip to show role, tools and a personal line. Values as large one-per-screen statements.

**Start a project:** pick services, pages, 3D or not, timeline → instant price range from `docs/pricing.md`, updating live. Submit → the serpent draws a checkmark; inquiry is emailed and stored.

**404:** playable Snake with our serpent.

## 7. Site-wide micro-interactions

- Page transitions: the serpent line sweeps across, thickens to fill the screen black, slides away to reveal the next page.
- Custom cursor ring: "View" over work, "Drag" over 3D, "Open" over links. Hidden on touch devices.
- Magnetic buttons; Lenis smooth scroll with slight velocity skew on images.
- Headings split into lines and rise; mono labels scramble in.
- Easter egg: type "saint" and the serpent slithers across the screen once.

## 8. The wow that wins clients

1. The intro. 2. Candlelight cursor on the real-time 3D hero. 3. Work that comes alive in color. 4. Instant quote builder. 5. Live proof of speed. 6. "How we built it" wireframe mode. 7. Service pages with live demos.

## 9. Tech stack & architecture

- Next.js (App Router) + TypeScript, Vercel.
- Three.js via React Three Fiber + drei; custom GLSL (serpent, fog, grain, image distortion, halftone). The serpent is procedural from the path — no Blender model needed.
- GSAP (ScrollTrigger, SplitText, Flip) + Lenis.
- **One persistent WebGL canvas** shared across routes so the serpent travels between pages without re-initialising.
- Content: start with typed local content files (`content/*.ts` or MDX) generated from `docs/content.md`; a headless CMS (Sanity or Payload) can come later.
- Quote builder → API route → email (e.g. Resend) + stored record (Supabase or similar). Inbox address: ask the owner.
- Privacy-friendly analytics (Vercel Analytics).

**Performance & accessibility (30% of the Awwwards score + the Developer award)**

- Three quality tiers by GPU detection: Full / Lite (no post-processing, lower DPR) / Static (video + SVG fallbacks).
- 3D loads after first paint; all text is real HTML (SEO + screen readers).
- Targets: LCP < 2.5s on a mid-range Android over 4G; small initial JS, Three.js code-split.
- `prefers-reduced-motion` respected everywhere; full keyboard navigation; visible focus states; skippable intro.
- Every page fully designed for mobile.

## 10. Awwwards strategy

- Scoring: Design 40% · Usability 30% · Creativity 20% · Content 10%. Also submit for the Developer Award, CSSDA, FWA, Godly, Muzli.
- Submit only with real case studies live and polished.
- Record a 30-second capture of the intro + hero for the launch posts.

## 11. Build phases

| Phase | Output |
|---|---|
| 1. Foundation | Next.js project, tokens, fonts, Lenis, nav, cursor, page-transition system, persistent canvas, quality tiers, Vercel deploy |
| 2. Serpent | Path-driven serpent shader, intro sequence with sound, hero with candlelight cursor + orbit, fallbacks. **Prototype this first — it's the hardest and most important part.** |
| 3. Home | Manifesto, work gallery, services halo, process stations, proof, CTA, footer reveal |
| 4. Inner pages | Work index + case study template, service pages with demos, Studio, quote builder, 404 game |
| 5. Polish | Performance, accessibility, mobile, SEO, OG images |
| 6. Launch | Domain, go live, Awwwards submission |

## 12. Portfolio content (see `docs/content.md` for the copy)

| # | Project | Type | Assets |
|---|---|---|---|
| 01 | EasyHire VA Solutions | Web app · Recruitment (client) | `work/plates/01-easyhire.jpg`, `work/screens/easyhire-web.webp` |
| 02 | Luwas Travel | Web app · Travel (client: MDCC Travel and Tours) | `02-luwas-web.jpg`, `luwas-web.webp` |
| 03 | Roomify | AI product · Architecture | `03-roomify.jpg`, `roomify-web.webp` |
| 04 | But First Coffee | Website · F&B — **label as Concept** | `04-butfirstcoffee.jpg`, `butfirstcoffee-web.webp`, live: https://but-first-coffee-three.vercel.app/ |
| 05 | Feastables | Website · Consumer brand — **label as Unofficial concept** | `05-feastables.jpg`, `feastables-web.webp`, live: https://feastables-nine.vercel.app/ |
| 06 | Groove | Mobile app · Habits | `06-groove.jpg`, `groove-mobile.webp` |
| 07 | TrabaWHO | Mobile app · Local AI | `07-trabawho.jpg`, `trabawho-mobile.webp` |
| 08 | Luwas Mobile | Mobile app · Travel (client: MDCC Travel and Tours) | `08-luwas-mobile.jpg`, `luwas-mobile.webp` |

Founders: Moncito Glenn Hernandez (CEO · Founder · Director · Software Engineer) and Marc Ace Flores (CMO · Head of Marketing). Photos in `public/team/`.

## Still open

- Domain (not bought yet) — use the Vercel URL until then.
- Inquiry inbox email address.
- Social links (co-founder is setting them up).
- Founder photo reshoot (current photos are placeholders-quality).
