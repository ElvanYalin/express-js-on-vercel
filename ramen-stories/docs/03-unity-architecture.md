# Ramen Stories — Unity Architecture & Phase 2 Handoff

> Phase 1 was produced in an environment **without Unity or a .NET SDK**, so no Unity project exists yet and
> no C# has been compiled. This document is the blueprint Phase 2 implements; the browser mockup's logic
> modules were written to port 1:1 and their behavior is covered by tests (`ramen-stories/tests/`).

## Engine setup
- Unity 6 LTS, 2D (URP) template, landscape-left/right only, target 60 FPS (`Application.targetFrameRate = 60`,
  adaptive drop to 30 on low-end via a quality tier check).
- Packages: 2D Animation, 2D PSD Importer (for painted layered PSB in Phase 8), Vector Graphics (to import the
  Phase 1 SVG layers directly as sprites until painted art replaces them), Input System, Localization,
  Addressables, TextMeshPro, Unity Test Framework.
- Reference resolution 1920×1080, Pixel Perfect off, orthographic camera size 5.4 (1 unit = 100 world px).
- Camera rules identical to `viewBoxFor()` in `public/ramen-stories/js/scene.js` (wide → reveal side bleed; tall
  → reveal ceiling 55% / worktop 45%; short screens → cooking camera). Implement in `CameraFramingController`.

## Folder structure
```
Assets/
  Art/ Backgrounds/ Characters/ Kitchen/ Ingredients/ Equipment/ Decorations/ UI/ Effects/
  Animations/
  Audio/ Music/ SFX/
  Prefabs/ Customers/ Employees/ Kitchen/ UI/
  Scenes/  Boot.unity  MainMenu.unity  Restaurant.unity
  Scripts/ Core/ Cooking/ Customers/ Employees/ Economy/ Upgrades/ Restaurant/ Story/ SaveSystem/ UI/ Localization/ Advertising/
  ScriptableObjects/ Broths/ Noodles/ Ingredients/ Bowls/ Customers/ Orders/ Upgrades/ Employees/ Decorations/ Economy/
  Localization/
  Tests/ EditMode/ PlayMode/
```
`ramen-stories/art/<Category>/*.svg` maps directly onto `Assets/Art/<Category>/`.

## Sorting layers
`BG-Architecture, BG-Windows, BG-Decor, BG-Furniture, BG-Lanterns, BG-Staff, Door, Customers, Counter,
CounterProps, Staff-Kitchen, KitchenSurface, KitchenEquipment, Bowl, FX` (+ UI on a Screen Space – Camera canvas).
Within `Bowl`, toppings use `order = 100 + round(y * 100)` so lower toppings draw in front.

## Data → ScriptableObjects (from `public/ramen-stories/js/data.js`)
| JS export | ScriptableObject | Key fields |
|---|---|---|
| `BROTHS` | `BrothDefinition` | id, color, surfaceColor, cost, unlockDay, sfx |
| `NOODLES` | `NoodleDefinition` | id, cost, perfectWindow (Vector2), overcookAt |
| `INGREDIENTS` | `IngredientDefinition` | id, cost, sprite, icon, prepState, unlockCondition |
| `BOWLS` | `BowlDesign` | id, body/band/inner colors or sprites, cosmetic only |
| `CUSTOMERS` | `CustomerProfile` | id, role, patience, budget, tipRate, favorite, `CharacterLook` |
| `ORDERS` | `ScriptedOrder` | customer, dialogueKey, broth, noodle, ingredients{id:qty} |
| `UPGRADES` | `EquipmentUpgrade` | id, levelPrices[], maxLevel, per-level visual prefab |
| `EMPLOYEES` | `EmployeeProfile` | id, role, salary, speed, accuracy, hireCost, unlock |
| `BASE_PRICE` | `EconomyConfig` | bowl price, per-ingredient price, tip curve |

## Systems (all listed in the master brief) and their mockup counterparts
| Unity system | Responsibility | Mockup source to port |
|---|---|---|
| GameManager | Boot, scene flow, pause | `main.js` router |
| DayCycleManager | Morning → service → closing → upgrade phase | `KitchenGame.endDay` (stub) |
| OrderManager | Active order, structured requirements | `ORDERS`, `updateTicket` |
| CustomerManager | Spawn, walk paths, patience | `nextCustomer` |
| CustomerDialogueManager | Bubble text, talk anim, reopen order | `bubble()` |
| RecipeManager | Discovery, saved recipes | — (Phase 7) |
| CookingManager | Owns the bowl-in-progress state | `KitchenGame.bowl` |
| BrothStationController | Tap-to-pour, ladle anim | `pour()` |
| NoodleCookingController | Load/lower/timer/lift | `loadBasket/lowerBasket/liftBasket/renderTimer` |
| BowlAssemblyController | Layered bowl, topping placement/removal | `renderBowl`, `ASSETS['food-bowl-composite']` |
| IngredientManager | Tray slots per counter level, stock | `traySlotsForLevel`, `TRAY_ORDER` |
| ServingController | Drop on tray → evaluate | `serve()` |
| **OrderEvaluator** (pure C#) | Scoring + feedback | `evaluation.js` (tested) |
| EconomyManager | Money, costs, daily ledger | `state.stats` |
| EquipmentUpgradeManager | Purchase flow, visual swap | `renderers.upgrades` |
| EmployeeManager / EmployeeAIController | Hire, salary, FSM Idle→Moving→Working→Waiting→Delivering→Returning | `renderers.hire` (UI only) |
| RestaurantCustomizationManager | Slot-based decor | `renderers.customize` |
| StoryManager / EventManager / AchievementManager | Phase 7 | — |
| SaveManager | Versioned JSON envelope + migrations, atomic write (temp file → rename) | `save.js` |
| LocalizationManager | String tables TR/EN, same keys | `i18n.js` |
| AudioManager | Music/SFX buses, separate volumes | `audio.js` (synth placeholders) |
| UIManager | HUD, panels, safe area | `main.js` + `style.css` |
| AdvertisementManager | Rewarded only, consent, verification | — (Phase 10) |

Communication: C# events / `ScriptableObject` event channels (e.g. `OrderServed`, `MoneyChanged`, `DayEnded`);
cooking controllers never reference UI directly.

## OrderEvaluator contract (port exactly)
Weights: broth 25, noodle type 20, doneness 15 (soft 50%, under 20%, over 0%), ingredients 35 × matched/required,
presentation 5 × spread score; extras −3 each, capped at −9. Ratings: ≥90 perfect, ≥70 good, ≥45 okay, else bad.
Payment = (10 + 2 × required ingredient count) × {1, 1, 0.8, 0.5}; tip = list × tipRate × {2, 1, 0, 0}, capped by
remaining budget. The 7 Node tests become EditMode tests with identical inputs/expected values.

## Phase 2 checklist (next)
1. Create the Unity project with the structure above; import `ramen-stories/art/**/*.svg` via Vector Graphics.
2. Build `Restaurant.unity` from the anchors in `docs/02-screen-specifications.md` (prefab per asset).
3. Input System touch: tap, drag (with 30-unit lift offset so the finger never hides the ghost), hold.
4. Port cooking controllers + OrderEvaluator; port tests.
5. Temporary SFX (replace the WebAudio synth with short original recordings).
6. Build to a real Android and iOS device; record FPS and touch accuracy. **Not done yet.**
