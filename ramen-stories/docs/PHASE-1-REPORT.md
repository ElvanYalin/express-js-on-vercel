# Phase 1 Report — Design Foundation

## Summary
Phase 1 is delivered: the visual identity, art style guide, specifications for all 10 required screens, a reusable
layered asset library, a reusable character rig, and an **interactive layout mockup** that proves the screens
work under real touch-style interactions (a full cooking loop and a 5-order day).

**Important constraint:** this work was produced in a cloud container with **no Unity editor and no .NET SDK**.
Nothing in this phase is a Unity build, and **no C# has been written or compiled yet**. The mockup is a browser
build (SVG + ES modules). It is a design validation tool, not the shipped game. Its logic modules were written to
port 1:1 to C# (see `03-unity-architecture.md`).

## Implemented
| Deliverable | Where | Status |
|---|---|---|
| Visual identity + style guide | `docs/01-art-style-guide.md` | Done |
| 10 screen specs (dimensions, layers, positions, interactions, animation, navigation, scaling) | `docs/02-screen-specifications.md` | Done |
| Main restaurant screen, fully layered (background / customer / kitchen zones) | `#main` | Done |
| Empty starting kitchen / fully upgraded kitchen | `#empty`, `#upgraded` | Done |
| Ramen preparation screen + phone cooking camera | `#prep` | Done |
| Equipment upgrade screen (grayscale locked previews, purchase flow, level pips) | `#upgrades` | Done (3 upgrades purchasable) |
| Employee hiring screen (portrait cards, stats, hire/train) | `#hire` | Done (UI; no employee AI yet) |
| Customization screen (slot highlights, live preview, place/cancel) | `#customize` | Done (4 categories) |
| Customer dialogue screen (natural order → structured ticket) | `#dialogue` | Done |
| Daily results screen (animated counters, stars, unlocks) | `#results` | Done |
| Main menu + loading screen | `#menu` | Done |
| Character concept sheets (9 characters × 3 views × 5 expressions) | `#characters`, `art/Characters/` | Done; see known issues for side views |
| Equipment + ingredient concept assets | `#assets`, `art/` | 69 assets |
| TR + EN localization (all UI text, no text in art) | `public/ramen-stories/js/i18n.js` | Done, parity-tested |
| Temporary original SFX (WebAudio synth) | `public/ramen-stories/js/audio.js` | Placeholder |
| Versioned local auto-save (mockup) | `public/ramen-stories/js/save.js` | Placeholder for Unity SaveManager |

### Working interactions in the mockup (verified by automated playtest)
Tap pot → bowl appears + ladle pours broth · drag noodle bundle → basket · tap basket → lowers, timer ring with
under/perfect/soft/over zones · tap → lift with doneness feedback · drag noodles → bowl · drag any of 10 toppings →
lands where dropped (layered, depth-sorted) · tap topping → remove · drag bowl → serving tray → scored evaluation,
customer reaction (expression + hop/shake + bubble listing mistakes), payment + tip, satisfaction change → customer
walks out through the sliding door → next customer walks in → after 5 orders the day ends on the results screen.

## Created assets
- `art/` — 69 standalone SVG layers in 8 categories (Backgrounds 9, Decorations 2, Kitchen 3, Equipment 12,
  Food 1 composite bowl renderer, Ingredients 17 (15 toppings + 2 noodle bundles), Effects 3, UI 22 icons + coin),
  plus `art/Characters/<id>/` for chef, 5 customers and 3 employees (front, ¾, side, 5 expressions, talking, sheet).
  `art/manifest.json` lists every file with its sorting layer and bounds.
- `mockups/` — 21 screenshots: all 12 board pages at 1920×1080 (TR), main/dialogue/results in EN, and
  main/upgrades/hire at 844×390 (phone) and 1024×768 (4:3 tablet).

## Scene & structure
- World 1920×1080 with bleed; 16 sorting layers; anchors in `public/ramen-stories/js/scene.js` (`LAYOUT`).
- Code: `data.js` (all tunable data), `evaluation.js` (pure scoring), `assets.js` (art library), `characters.js`
  (rig), `scene.js` (composer + camera rules), `game.js` (interaction controller), `main.js` (screens/router),
  `i18n.js`, `audio.js`, `save.js`.

## Setup
See `ramen-stories/README.md` (`npm run ramen:serve`, then open `/ramen-stories/`). In production it is served by
the existing Express-on-Vercel app from `public/`, and linked from the home page.

## Test results (real runs, this environment, headless Chromium)
| Suite | Result |
|---|---|
| Unit — order evaluation (`tests/evaluation.test.mjs`) | 7/7 pass |
| Unit — localization parity + interpolation (`tests/i18n.test.mjs`) | 3/3 pass |
| Unit — asset integrity, no baked text, all expressions, scene variants (`tests/assets.test.mjs`) | 5/5 pass |
| E2E playtest, full day with pointer input — 1920×1080 | 16/16 pass |
| E2E playtest — 844×390 (phone landscape, cooking camera active) | 16/16 pass |
| E2E playtest — 1024×768 (4:3 tablet) | 16/16 pass |
| Screenshot render of all 12 pages at 3 sizes | 0 console errors |

Issues found by testing and fixed during the phase:
- Left nav overlapped the broth pots at 16:9 → nav reduced to 4 + "More" (2-column expansion).
- Workflow bar + hint covered the noodle boxes and bowl stack → workflow moved over the non-interactive stove front.
- Entrance door hidden behind the order ticket → door moved to x 1386.
- On phones the nav covered the shoyu pot under the cooking camera (a tap opened the menu instead of pouring) → nav
  slides away while the cooking camera is active.
- Placed toppings were too small to tap → 44-unit invisible hit circles.
- Order ticket stayed visible while a customer was reacting → hidden once the bowl is served.
- An early phone playtest failure was a **test timing** issue (drags fired during the 450 ms camera move); the
  test now waits for the camera to settle.

**Not tested:** real iOS/Android hardware, real touchscreens (Playwright drives mouse-generated pointer events),
frame rate on low-end devices, VoiceOver/TalkBack, audio on device speakers. None of these can be tested
without hardware and a Unity build.

## Known issues / honest gaps
1. **Not Unity.** Phase 2 must create the Unity 6 project; nothing here runs as a native app.
2. **Vector production art, not final painted art.** Composition, palette, scale, silhouettes and layering are
   locked; hand-painted texture and richer food rendering are planned for Phase 8 (style guide §11).
3. **Character side view is a head turn**, not a true profile; there is no real walk cycle (bob + tilt only).
4. Main-menu exterior storefront art is not drawn yet; the menu reuses the blurred interior.
5. On a 844×390 phone, the full-view tray targets measure ~37 px; the cooking camera brings them to ~46 px. True
   44 pt compliance needs device verification.
6. Mockup simplifications: one active noodle basket; no patience timer; scripted 5-order day; no employee AI; no
   ingredient stock; money in the upgrade/hire screens is seeded for demonstration.
7. The SFX are synthesized placeholders; there is no music yet.
8. The Design board (bottom-right) is a review tool and is not part of the game UI.

## Next steps (Phase 2 — Playable Cooking Prototype in Unity)
1. Create the Unity 6 LTS 2D URP project with the folder and sorting-layer structure in `03-unity-architecture.md`.
2. Import `art/**/*.svg` (Vector Graphics package) and build `Restaurant.unity` from the `LAYOUT` anchors.
3. Port `data.js` → ScriptableObjects and `evaluation.js` → `OrderEvaluator.cs` with the same 7 test cases.
4. Implement the cooking controllers (broth, noodles, assembly, serving) with the Input System touch API.
5. Add customer reactions and temporary recorded SFX.
6. Build to a real Android and iOS device; measure FPS and touch accuracy; report results without extrapolation.

Phase 2 requires a machine (or CI runner) with Unity 6 installed and a Unity license. This container has neither.
