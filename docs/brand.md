# Brand — Black Saint Directory

## Logo

Files in `public/brand/logos/` (SVG + 2000px transparent PNG, each in `ink` and `white`):

| File | Use |
|---|---|
| `bsd-primary-*` | Symbol + wordmark, horizontal. Default where there is width: site header, documents, email signature. |
| `bsd-secondary-*` | Stacked and centered. Square/tall spaces, footer, end cards. |
| `bsd-simplified-*` / `bsd-symbol-small-*` | Heavier symbol for small sizes (favicon, app icon, avatars). Use below 48px tall; holds to 20px. |
| `bsd-symbol-*` | Detailed symbol alone (48px tall and up). |
| `bsd-submark-*` | Arch submark: symbol in a saint's niche, "EST. 2026". |
| `bsd-seal-*` | Circular seal: "BLACK SAINT DIRECTORY / MANILA · EST. 2026". Stamps, "made by" credits. |

**The symbol:** one continuous serpent folding back on itself to form a cross — hairpin at top, doubled diagonal crossbar, head rising at the foot. One stroke weight, one gap width everywhere. Its centerline is in `public/brand/serpent-path.json`.

**Rules:** monochrome only (Ink on light, White on dark). No colors, gradients, glows, shadows, outlines, rotation or stretching. Clear space ≥ the doubled crossbar's height on every side. Exception: a real-time 3D rendering of the symbol for the site's hero and intro.

**Wordmark:** "BLACK SAINT" in Inter Tight 600, −1% tracking, kerned; "DIRECTORY" in Geist Mono 500, tracked to the full width of "BLACK SAINT". The logo files already contain outlined text — never retype the logo in live text.

## Color

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0A0A0A` | Primary background (dark default), text on light |
| `carbon` | `#141414` | Cards/sections on dark |
| `graphite` | `#262626` | Borders, dividers on dark — never text |
| `steel` | `#5C5C5C` | Secondary text on light |
| `fog` | `#A3A3A0` | Secondary text on dark, captions, metadata |
| `bone` | `#E6E4DF` | Borders, quiet surfaces on light — never text |
| `paper` | `#F4F3EF` | Light background (warm off-white) |
| `white` | `#FFFFFF` | Text on Ink, highlights |

- Dark by default; Paper sections for rhythm and documents.
- **No brand accent color.** Color only comes from client work and 3D renders.
- One functional exception: a muted red for form errors only.
- Text pairs: White/Fog on Ink, Ink/Steel on Paper (all pass WCAG AA).

## Typography (all free on Google Fonts)

| Role | Font | Notes |
|---|---|---|
| Display | Inter Tight 500 (300 italic for accents) | Huge, tight: −5% tracking, 0.9 leading |
| Body | Inter 400 | 16–18px, 1.5 leading |
| Labels / meta | Geist Mono 500 | Uppercase, +8% tracking, 11–13px |

| Style | Size | Line height | Tracking |
|---|---|---|---|
| Hero | clamp(64px, 12vw, 200px) | 0.9 | −0.05em |
| H1 | clamp(48px, 7vw, 112px) | 0.95 | −0.04em |
| H2 | clamp(32px, 4vw, 64px) | 1.0 | −0.03em |
| H3 | 24–28px | 1.15 | −0.02em |
| Body | 16–18px | 1.5 | 0 |
| Small | 14px | 1.45 | 0 |
| Label | 11–12px mono uppercase | 1.2 | +0.08em |

## Motion

- Easing: expo.out / power4.out, 0.9–1.4s for reveals. Nothing bouncy, no elastic/back easing.
- Film grain over dark surfaces at very low opacity.
- Everything respects `prefers-reduced-motion`.

## Voice

Short, sure, honest. "We build the extraordinary." — never "We are a passionate team of creatives who strive to deliver innovative solutions." Honest about trade-offs: we tell clients when they don't need 3D.
