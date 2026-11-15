# Black Saint Directory — company website

The studio's own website: an award-level (Awwwards-target) 3D site for a Manila digital studio that builds websites, 3D experiences, systems and mobile apps.

## Read first, every session

1. `docs/website-plan.md` — the full spec: concept ("One Line"), intro, hero, every page, animations, stack, build phases.
2. `docs/brand.md` — logo rules, color tokens, type scale, motion, voice. Follow it exactly.
3. `docs/content.md` — all copy (draft). Use it verbatim; don't invent copy. Hide anything marked [RESULT] until it's filled.
4. `docs/pricing.md` — price book for the quote builder.

## Assets

- `public/brand/logos/{svg,png}/` — all logos. Never recreate the logo in live text or redraw it.
- `public/brand/serpent-path.json` — the serpent's centerline for the intro and the One Line system.
- `public/work/plates/` — editorial case-study images (2400×1500).
- `public/work/screens/` — clean raw screenshots (web + mobile) for galleries, device mockups and demos.
- `public/team/` — founder cutouts (transparent PNG, for the halftone shader), portraits and name cards.

## Non-negotiables

- Monochrome UI (Ink/Paper/greys). Color only from project imagery.
- Real HTML for all text. 3D enhances; it never holds content hostage.
- Performance budget and quality tiers per the plan; `prefers-reduced-motion` respected; keyboard accessible; fully responsive.
- Concept projects stay labeled: But First Coffee = "Concept", Feastables = "Unofficial concept".
- Sound is opt-in (browser autoplay rules); only use audio we have rights to.

## Git rules (strict)

- The owner, Moncito, is the **only** author and contributor.
- **Never** add `Co-Authored-By` lines, "Generated with Claude Code", or any Claude/AI attribution to commits, PRs, code comments or docs.
- Commit with the repo's configured git identity; do not change it.
- Small, clear commit messages in the imperative ("Add serpent intro shader").

## Deployment

- Vercel, under the owner's existing **Pro team** (the team that hosts the EasyHire VA Solutions project). Create a new project `the-black-saint-directory` in that team, linked to this GitHub repo; production branch `main`.
- Never commit secrets. Use Vercel environment variables.

## Working style

- Build phase by phase (see the plan). Start with Phase 1, then prototype the serpent (Phase 2) before anything else visual.
- After each phase: run the build, check Lighthouse on mobile, and summarise what's done and what's next.
