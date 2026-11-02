# Ramen Stories — Art Style Guide (Phase 1)

Status: **v1 — locked for the vertical slice.** Every asset in `ramen-stories/art/` and the live
mockup (`/ramen-stories/`) follows these rules. Rules that the vector production layers
cannot yet satisfy are listed under "Pending for final painted art".

## 1. Identity in one sentence
A small, warm, lantern-lit neighborhood ramen shop at dusk, drawn like a premium picture book:
chunky ink outlines, soft wood, steam everywhere, and food that looks good enough to eat.

## 2. Palette
| Token | Hex | Use |
|---|---|---|
| Dark walnut | `#432820` | Beams, frames, panel headers, shadows of wood |
| Warm wood | `#986044` | Counter, pillars, buttons, furniture |
| Cream | `#FFF0D6` | Paper, bowls, UI panels, text on dark |
| Lantern orange | `#F5A34A` | Lantern glow, egg yolk, highlights of warmth |
| Deep Japanese red | `#A93C35` | Primary buttons, noren curtains, accents, alerts |
| Sakura pink | `#F2A5B8` | Blossoms, blush, tips, celebration |
| Soft teal | `#76B9B2` | Secondary buttons, success, cool balance, sky |
| Dark ink | `#292323` | All outlines and body text (never pure black) |
| Golden highlight | `#F5CA72` | Coins, stars, focus rings, "perfect" feedback |

Support tones are *only* tints/shades of the palette (see `PALETTE` in `public/ramen-stories/js/data.js`):
`woodLight #B97E5C`, `woodDark #6B3F2E`, `walnutDeep #2F1B16`, `plaster #F6E4C6`, `plasterShade #E9CFA6`,
`tealDeep #4F8F89`, `redDeep #7E2A26`, `steel #A9A39B`, `steelDark #6F6862`.

Ratio target for any screen: ~60% warm woods/cream, ~25% background plaster + sky, ≤15% accents (red/teal/sakura/gold).
Food colors (broth, toppings) may leave the palette for appetite appeal but stay at the same saturation level.

## 3. Line & shape
- **Outline:** dark ink `#292323`, round joins/caps. Weights at 1080p world scale:
  - 4 px: props, equipment, characters (default)
  - 3 px: secondary detail inside an object, small props
  - 2 px: inner detail lines, ingredient texture
  - Background architecture uses 3–4 px; no outline thinner than 2 px on anything interactive.
- **Shapes:** soft rectangles (6–14 px radii), slightly bulging silhouettes, no razor-sharp corners except knives.
- **Exaggeration:** characters ~1 : 2.9 head-to-body; equipment ~10% chunkier than real proportions; food ~20% larger.

## 4. Light
- Single warm key light from the **upper left** (lanterns + window dusk). Highlights sit top-left, shading bottom-right.
- Lantern glow is a radial cream→orange gradient that pulses 0.7–1.0 opacity over 3.4 s.
- Windows provide the cool counterlight (teal → gold dusk gradient). Rain/night variants exist in `bg-window`.
- Shadows: ink at 22–28% opacity, flat ellipses under characters/bowls. No hard drop shadows on world art.

## 5. Perspective & scale
- Fixed side-facing camera, orthographic. World = 1920×1080 units with bleed (−210…2130 × −180…1260).
- Depth is expressed with *layering* and slight scale (customers walking in from the door: 0.94 → 1.0).
- Reference heights (world units): customer standing 420; counter top y=572; worktop back edge y=720; bowl rim 228 wide.
- Background seated guests: 0.5 scale. Kitchen staff: 0.8 scale, legs hidden by the worktop.

## 6. Sorting layers (back → front)
`BG-Architecture → BG-Windows → BG-Decor → BG-Furniture → BG-Lanterns → BG-Staff → Door → Customers →
Counter → CounterProps → Staff-Kitchen → KitchenSurface → KitchenEquipment → Bowl → FX → UI (screen space)`

Rules: customers are always behind the counter; kitchen staff always in front of the counter and behind the
worktop; nothing but UI and FX may cover the bowl at the assembly station.

## 7. Characters
- One parametric rig (`public/ramen-stories/js/characters.js`): parts = legs, torso, arm-l, arm-r, head,
  hair-back, hair-front, eyes, brows, mouth (closed/open), accessory. These map 1:1 to Unity 2D Animation bones.
- Expressions: neutral, happy, angry, confused, surprised (+ talking mouth, blink).
- Builds: slim, regular, athletic, round, tall. Hair: bob, parted, ponytail, bald, curly, bun, short.
- Faces: large oval eyes with a single catch-light, sakura blush, small nose stroke. No skin-tone-based caricature,
  no accent jokes, no costume clichés; roles are read from clothing/props (backpack strap, tie, sweatband, camera).
- Adding a character = adding a `look` object in data (no new art pipeline).

## 8. Food
- Bowls are composited at runtime from layers: back rim → broth (color per broth) → noodles (strand count/width per
  type) → toppings (sorted by depth, placed where the player drops them) → front rim + band.
- Toppings scale to 0.62 in-bowl; every ingredient has a distinct silhouette *and* color so it reads at 40 px.

## 9. UI
- Panels: cream paper (`#FFF7E8 → #FFF0D6`), 3–4 px ink outline, 18–26 px radius, 4 px flat ink drop shadow.
- Headers: wood gradient bar with cream display text.
- Buttons: red (primary), gold (purchase), teal (positive/secondary), paper (ghost). Pressed = 3 px down.
- Fonts: **Baloo 2** (display, 600–800) and **Nunito** (body, 600–800). Both cover Turkish (ç, ğ, ı, İ, ö, ş, ü).
  Arabic/Japanese will need fallback fonts (Noto Sans Arabic / M PLUS Rounded 1c), planned in Phase 7.
- Min text: 13 px body / 11 px labels on the smallest phone. Min touch target: 44×44 px.
- **No text is ever baked into artwork.** Signs, banners and noren carry pictograms only (bowl emblem).

## 10. Motion
- Idle: breathing 3 s, blink every ~4.6 s, lantern sway ±1.6° over 5 s, steam 3.2 s loops, petals 8–12 s.
- Feedback: pop-in 0.35 s overshoot, coin/score float 1.4 s, purchase burst 0.7 s.
- Reduced motion: OS setting or in-game toggle collapses all loops to their end state.

## 11. Pending for final painted art (honest gap list)
The current library is **vector production art** that locks composition, palette, scale, layering and silhouettes.
For the commercial target these still need a painter pass (Phase 8), keeping identical bounds/pivots:
- Hand-painted texture on wood, plaster and fabric (currently flat gradients + a few brush strokes).
- True side-profile and back views for walking characters (the rig's `side` view is a head turn, not a profile).
- Bent-knee walk cycle and arm swing frames (current walk is a bob + tilt).
- Richer food rendering (broth sheen, fat droplets, char marks on chashu).
- Exterior storefront scene for the main menu (currently the blurred interior is reused).
