# Ramen Stories — Screen Specifications (Phase 1)

All coordinates are **world units** (1920×1080 reference, origin top-left) unless marked `u`.
`u` = UI design unit = 1 px at a 1280×720 reference screen, computed as
`clamp(0.66px, min(100vw/1280, 100vh/720), 1.45px)`. Each screen can be opened live in the mockup:
`/ramen-stories/#<id>` (design board, bottom-right).

## Global scaling rules (apply to every screen)
| Screen aspect | Camera rule (world viewBox) |
|---|---|
| 16:9 exactly | 0…1920 × 0…1080 |
| Wider (19.5:9, 20:9 phones) | Height fixed at 1080, extra width revealed from side bleed (max 2340 wide). Wider than 2340 → small top/bottom crop of ceiling/worktop front (no interactive content there). |
| Taller (4:3, 3:2 tablets) | Width fixed at 1920, extra height revealed **55% above** (ceiling) / 45% below (worktop), max 1460 tall. |
| Short screens (< 520 px CSS tall) | **Cooking camera**: after the order is read, the camera eases (450 ms) to `kitchen` framing (x −10…1930, bottom at 1072) to enlarge touch targets ~20%; it eases back to full framing to show the customer reaction. The left nav slides out while the cooking camera is active. |

UI is screen-space DOM: anchored to safe-area insets (`env(safe-area-inset-*)`, min 14u side / 10u top-bottom),
so notches and the Dynamic Island never overlap controls. Minimum touch target 44×44 CSS px everywhere.
Portrait orientation on phones shows a "rotate your device" card (game is landscape-only).

---

## 1. Main gameplay screen (`#main`)
**Layout zones (world):** Background y −180…572 · Customer zone x 760…1160 (order spot) · Counter y 572…740 ·
Kitchen y 720…1080.

**Asset layers (back → front):** `bg-wall` (+ceiling, beams, wainscot) → `bg-pillar` ×4 (x −30, 470, 1338, 1622) →
`bg-window` ×2 at (600,124), (980,124) + sakura petals FX → `bg-banner` (372,104), `deco-wall-art` (180,160),
`bg-shelf` (1680,150), plant slots (540,432), (1300,432) → `bg-stool`/`bg-dining-table` at (300,482), (1790,482) with
seated guests (0.5 scale) → `bg-lantern` ×4 at x 230, 760, 1170, 1790 (hang y 82) → `bg-door` (1386,140) →
**Customers** → `kitchen-counter` → `kitchen-serving-tray` (960,588) → Staff-Kitchen → `kitchen-worktop` →
`equip-stove` (20,788) + `equip-broth-pot` ×3 at x 120/320/520 (base y 826) → `equip-noodle-cooker` (650,768) +
`equip-noodle-basket` (x 780; raised y 800 / lowered y 872; extra baskets x 700/860 with upgrades) →
`equip-noodle-box` thin (640,944), thick (780,944) → `equip-bowl-stack` (990,968) → `equip-sauce-bottle` ×2 →
assembly board (1066,872, 268×112) → **Bowl** composite at (1200,912) → `equip-ingredient-tray` 2×5 grid from
(1340,758), cell 110×90 → `equip-cutting-board` (1340,942) → FX.

**Character positions:** order spot feet (960,714); door spot (1500,714) at 0.94 scale; kitchen assistant (604,800)
at 0.8; waiter floor zone y 604 at 0.56; seated guests (x±100 of table, y+96) at 0.5.

**Interactive elements:** broth pots (tap = pour; auto-sets out a bowl), noodle boxes (drag → basket), basket
(tap = lower/lift; drag cooked noodles → bowl), ingredient trays (drag → anywhere in the bowl ellipse 120×56; placed
where dropped), placed toppings (tap = remove), bowl (drag → serving tray, 200-unit radius), bowl stack (tap).

**UI (screen space):** top HUD (day+clock, satisfaction, money, pause, settings) · left nav (4 + More, expands to
2 columns) · order ticket top-right (collapsible, live ✓ per requirement) · cooking workflow bottom-left over the
non-interactive stove front · contextual hint bottom-center-right · dialogue bubble anchored to (1052,414).

**Animation:** lantern sway/glow, steam on pots & cooker, burner flicker, boiling bubbles, petals, guest breathing,
customer walk-in (1.6 s) + door slide, talking mouth, blink, ladle pour + broth fill, basket dip, timer ring,
topping pop, bowl pop-in, reaction hop/shake, sparkles, coin float.

**Navigation:** nav buttons → Kitchen (#upgrades), Staff (#hire), Decorate (#customize); others show "later phase".
Settings → menu. Day end → Daily results.

## 2. Empty starting kitchen (`#empty`)
Same layout as #1 with state differences: 1 of 4 lanterns lit; banner in dark wood; wall-art slot empty (faded
plaster patch); no seated guests; ingredient counter Lv1 = **6 slots** (4 locked trays greyed with lock badge);
noodle cooker Lv1 (1 basket, manual knob); morning clock 09:00. Right card: Day 1 tasks + "Open the shop".
Animation: steam + lanterns only (quiet morning). Navigation: Open → Customer dialogue (#dialogue).

## 3. Fully upgraded kitchen (`#upgraded`)
Same anchors, upgraded states: noodle cooker Lv4 (3 baskets, two cooking, digital timer panel), broth pots Lv3
(8% larger), ingredient counter 10 slots, cutting board Lv2 (steel knife), sakura bowl set, sink (1580,940),
refrigerator in left bleed (−170,690), plants in both slots, all lanterns lit, both tables full, assistant chef at
the cooker, waiter on the floor. Demonstrates that **every upgrade is visible in the world**.

## 4. Ramen preparation screen (`#prep`)
Cooking camera framing (see global rules) with no dialogue bubble; the order lives in the ticket. Spec overlay
(first 9 s): numbered markers in interaction order — ① tap pot (320,600) ② drag noodles (705,905) ③ tap basket
(880,690) ④ drag toppings (1610,730) ⑤ drag bowl to tray (1110,560) with a dotted serve path. Timer ring at basket
+ (84,−100): zones under (beige) / perfect (teal) / soft (gold) / over (red), needle sweeps; thin = 3.5–5.5 s,
thick = 5.0–7.0 s. Mobile: this framing is used automatically on screens < 520 px tall.

## 5. Equipment upgrade screen (`#upgrades`)
**Layout:** scrim over the live scene; panel `min(1100u, 100%)` wide, max full height, scrolls inside.
Header (wood bar): icon, title, money pill, close. Body: full-width kitchen layout strip (world 0…1920 × 640…1040,
aspect 4.8) with pulsing dashed rings + level badges on Noodle Cooker (780,840), Broth Station (320,760),
Ingredient Counter (1610,850). Below: card grid (min 190u columns).
**Card:** art (110u tall) showing the *next* level, level badge, name + current level chip, 5 level pips,
description, gold buy button with price (disabled when unaffordable / max). Locked equipment (refrigerator,
dishwasher) = **grayscale preview** + lock badge.
**Purchase sequence:** deduct → coin SFX → burst animation → card re-renders at new level → strip + kitchen scene
reflect the new level (e.g. 2nd basket appears) → auto-save. Prices: `UPGRADES` in data.js.

## 6. Employee hiring screen (`#hire`)
Panel as #5. Cards (min 230u): portrait from the shared rig (3/4 view, teal backdrop; locked = greyscale + "Unlocks on
Day 4"), name, role chip, Speed & Accuracy bars (1–5), salary/day, assigned station, special ability, Hire (gold,
price) → after hiring becomes Train (teal). Hiring places the assistant chef physically at (604,800) in the kitchen.

## 7. Restaurant customization screen (`#customize`)
Live scene (no panel). Highlighted slots pulse (gold dashed ellipse) for the active category: lantern slot
(1170,210), plant slots, wall-art slot, whole wall for wall color. Bottom tray (anchored bottom-center, scrolls
horizontally on small screens): category tabs (Lanterns, Plants, Wall art, Wall color) · item cards (vector
preview + price) · Place / Cancel. Selecting an item previews it in place immediately; Place saves.
Rules: slots are predefined so decorations never block cooking controls or staff paths.

## 8. Customer dialogue screen (`#dialogue`)
Customer at the order spot in 3/4 view, talking animation; kitchen dimmed by a gradient (y 640+). Bubble (380u wide)
anchored right of the head with a name/role tag, the natural-language order, and Got it / Repeat. The order
ticket shows the **structured translation** of the sentence (broth swatch, noodle icon, each topping with icon and
quantity). Bubble re-anchors on resize and is clamped inside the safe area.

## 9. Daily results screen (`#results`)
Scrim + paper panel (760u), noren strip on top, title "Day N Complete", 1–3 stars (satisfaction ≥65 / ≥85),
two-column rows: customers, happy orders, missed orders, satisfaction, food revenue, tips, ingredients (−),
salaries (−); highlighted **net profit** bar; "New!" unlock chips. Counters ease-out over 1.2 s; stars pop in
sequence. Footer: optional rewarded-ad bonus (ghost button, never auto-plays) and Next Day (primary).

## 10. Main menu & loading (`#menu`)
Blurred, darkened live restaurant behind a wooden logo plaque (title rendered as localized text, bowl emblem above).
Loading state (2.2 s in the mockup): progress bar + rotating gameplay tip. Then: Open the Shop / Continue — Day N
(only with a save) / Settings / Credits. No ads on launch.

---

## Extra design-board pages
- **Character sheets (`#characters`)** — every character: front, ¾ and side views + the 5 expressions.
- **Asset library (`#assets`)** — all 69 library assets grouped by category with their sorting layer.
