# Ramen Stories — Yapay Zekâ Görsel Prompt Paketi (ChatGPT)

Bu dosya, oyunun tüm görsellerini ChatGPT ile üretmek için hazırlanmış promptları içerir.
Promptlar İngilizcedir, çünkü görsel modelleri İngilizcede daha tutarlı sonuç verir.
Her promptu **olduğu gibi kopyalayıp yapıştırabilirsin.**

---

## 0. Önce bunu oku: kullanım kuralları

1. **Tek sohbet kullan.** Tüm görselleri mümkün olduğunca aynı ChatGPT sohbetinde üret. Sohbet çok uzarsa yeni sohbet açıp **stil referansını (S-01) tekrar yükle**.
2. **Önce stil referansını üret (S-01).** Beğendiğin sonucu bilgisayarına kaydet. Sonraki **her** promptla birlikte bu resmi de ekle ("+" ile resim yükle). Tarz tutarlılığını sağlayan en önemli adım bu.
3. **Karakterlerde önce karakter sayfasını üret.** Sonraki ifadelerde (mutlu, kızgın vb.) o karakterin sayfasını da ekle.
4. **Şeffaf arka plan:** "transparent background" yazan promptlarda sonuç PNG olmalı. Arka plan beyaz ya da damalı gelirse aynı sohbette şunu yaz:
   `Regenerate the same image with a fully transparent background, PNG, no shadow on the ground, nothing else changed.`
5. **Yazı olmasın:** Oyundaki tüm yazılar (Shoyu, Miso, menü yazıları…) oyunun kendi yazı sisteminden gelir, böylece Türkçe ve İngilizce değişebilir. Görselde harf çıkarsa şunu yaz:
   `Remove all text, letters and numbers from the image, keep everything else identical.`
6. **Boyutlar:** Her promptta boyut yazıyor. ChatGPT'nin desteklediği boyutlar 1536×1024 (yatay), 1024×1024 (kare) ve 1024×1536 (dikey).
7. **Dosya adı:** Her görseli promptun başındaki **dosya adıyla** kaydet (ör. `equip-pot-shoyu.png`). Bana bu adlarla gönderirsen nereye ait olduğunu hemen bilirim.
8. **Beğenmezsen:** Aynı sohbette `Same image but …` diye küçük düzeltmeler iste (ör. `Same image but the pot is slightly wider and the broth is darker`).

**Üretim sırası:** S → A → B → C → D → E → F → G.
Toplam yaklaşık 110 görsel. Önce dikey dilim için **yıldızlı (★) olanları** üretmen yeterli (yaklaşık 60 görsel).

---

## Ortak stil cümlesi

Aşağıdaki her promptun sonunda bu stil cümlesi zaten var. Bilgin olsun diye burada da tek başına duruyor:

> Style: premium hand-drawn 2D cartoon mobile game art, cozy Japanese ramen restaurant, clean confident dark-brown ink outlines (#292323), soft painterly shading with subtle texture, warm lantern lighting from the upper left, rich but controlled colors (walnut brown #432820, warm wood #986044, cream #FFF0D6, lantern orange #F5A34A, deep red #A93C35, sakura pink #F2A5B8, soft teal #76B9B2, golden highlight #F5CA72), slightly exaggerated cute proportions, consistent with the attached style reference. No text, no letters, no numbers, no watermark.

---

## S — Stil referansı (ilk bunu üret)

### ★ S-01 `style-reference.png` — 1536×1024
```
Create a key art illustration for a 2D mobile restaurant game called "Ramen Stories". Fixed side-facing camera looking straight at a cozy small Japanese ramen restaurant at dusk. Three horizontal zones: background (wooden ceiling beams, glowing red and orange paper lanterns, large wooden-framed windows showing a street with blooming sakura trees and a small red torii gate, wooden shelves with bowls and jars, hanging red fabric banners with a simple ramen-bowl emblem, two small dining tables with happy customers eating), middle (a long warm wooden service counter; a young customer with headphones stands behind the counter, visible from the waist up, talking), foreground kitchen (three steaming stainless broth pots on a gas stove on the left, a noodle boiler with two mesh baskets in the middle, a row of metal ingredient trays filled with chashu pork slices, soft-boiled eggs, green onion, corn, bamboo shoots, narutomaki, mushrooms and nori on the right, a stack of white ramen bowls at the far right). Two friendly chefs in white uniforms and headbands stand behind the counter on the kitchen side. Lots of rising steam, warm cozy evening light, lively and inviting. Leave the top 8% and left 8% fairly calm for game UI. Style: premium hand-drawn 2D cartoon mobile game art, cozy Japanese ramen restaurant, clean confident dark-brown ink outlines (#292323), soft painterly shading with subtle texture, warm lantern lighting from the upper left, rich but controlled colors (walnut brown #432820, warm wood #986044, cream #FFF0D6, lantern orange #F5A34A, deep red #A93C35, sakura pink #F2A5B8, soft teal #76B9B2, golden highlight #F5CA72), slightly exaggerated cute proportions. No text, no letters, no numbers, no watermark.
```
> Beğendiğin sonucu kaydet. **Bundan sonraki her promptta bu resmi de yükle.**

---

## A — Mekân ve arka plan katmanları

### ★ A-01 `bg-interior.png` — 1536×1024
```
Using the attached style reference, draw ONLY the empty back wall of the ramen restaurant interior as a game background layer, straight-on side view. Include: dark wooden ceiling with thick beams across the top, cream plaster walls, vertical wooden pillars, lower wall with vertical wooden wainscot panels, two large empty window openings (leave the window openings as plain flat light-teal rectangles so windows can be placed on top later: one centered-left, one centered-right), one sliding wooden entrance door frame area on the right side left empty as a flat dark rectangle. NO people, NO counter, NO kitchen, NO lanterns, NO tables, NO furniture — only architecture. Even warm lighting, slight darker vignette near the ceiling. Style: premium hand-drawn 2D cartoon mobile game art, clean dark-brown ink outlines (#292323), soft painterly shading with subtle wood and plaster texture, warm lantern lighting from the upper left, palette walnut brown #432820, warm wood #986044, cream #FFF0D6. No text, no letters, no numbers, no watermark.
```

### ★ A-02 `bg-window-dusk.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a single large Japanese-style wooden window for a game, straight-on front view, thick dark walnut frame with a 3x2 grid of wooden mullions and a wooden sill at the bottom. Through the glass: a quiet evening street with blooming pink sakura trees, a small red torii gate, distant tiled rooftops, a few warm glowing street lanterns and two tiny silhouetted pedestrians, dusk sky going from soft teal at the top to warm gold at the bottom. Transparent background outside the window frame. Style: premium hand-drawn 2D cartoon mobile game art, clean dark-brown ink outlines (#292323), soft painterly shading, warm lighting. No text, no letters, no numbers, no watermark.
```

### A-03 `bg-window-rain.png` — 1024×1024, şeffaf arka plan
```
Same window as the attached window image (identical frame, size and angle), but the outside view shows a rainy evening: grey-teal sky, rain streaks, wet glowing street, sakura trees darker, raindrops on the glass. Transparent background outside the frame. Same art style. No text, no letters, no numbers, no watermark.
```

### A-04 `bg-window-night.png` — 1024×1024, şeffaf arka plan
```
Same window as the attached window image (identical frame, size and angle), but the outside view is a calm night: deep blue sky, small moon, glowing lanterns along the street, sakura trees lit softly. Transparent background outside the frame. Same art style. No text, no letters, no numbers, no watermark.
```

### ★ A-05 `bg-lantern-red-lit.png` — 1024×1536, şeffaf arka plan
```
Using the attached style reference, draw one hanging Japanese paper lantern (chochin) for a game, front view, deep red paper with horizontal ribs, black top and bottom caps, short black cord at the top, small red tassel at the bottom, glowing warmly from inside with a soft orange-gold light. Centered, full lantern visible with empty space around it. Transparent background, no glow halo outside the lantern body (the game adds glow). Style: premium hand-drawn 2D cartoon mobile game art, clean dark-brown ink outlines (#292323), soft painterly shading. No text, no letters, no symbols on the lantern, no watermark.
```

### A-06 `bg-lantern-red-unlit.png` — 1024×1536, şeffaf arka plan
```
Same lantern as the attached lantern image, identical shape, size and position, but NOT lit: no inner glow, slightly dusty, muted red. Transparent background. Same art style. No text, no watermark.
```

### A-07 `bg-lantern-teal-lit.png` / A-08 `bg-lantern-sakura-lit.png` — 1024×1536, şeffaf arka plan
```
Same lantern as the attached lantern image, identical shape, size and position, lit from inside, but the paper color is soft teal (#76B9B2). Transparent background. Same art style. No text, no watermark.
```
```
Same lantern as the attached lantern image, identical shape, size and position, lit from inside, but the paper color is sakura pink (#F2A5B8). Transparent background. Same art style. No text, no watermark.
```

### ★ A-09 `bg-banner.png` — 1024×1536, şeffaf arka plan
```
Using the attached style reference, draw a tall hanging fabric banner (nobori style) for a ramen restaurant wall, front view, hanging from a small wooden rod, deep red fabric with a cream border and a simple white circular emblem of a steaming ramen bowl in the middle, pointed bottom edge. Leave a clean plain vertical strip below the emblem for text the game adds later. Transparent background. Same art style as the reference. No text, no letters, no Japanese characters, no watermark.
```

### ★ A-10 `bg-shelf.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw a wall-mounted two-level wooden shelf for a ramen restaurant, front view: top shelf has ceramic jars (teal, cream, orange) and a small potted plant; bottom shelf has three stacked decorative ramen bowls (red, cream, teal) and a small golden plate. Transparent background. Same art style. No text, no labels, no watermark.
```

### ★ A-11 `bg-dining-table.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw a small wooden restaurant dining table with two red-cushioned wooden stools, side view at eye level, on the table: two ramen bowls with chopsticks and a small teapot. Empty seats (no people). Transparent background. Same art style. No text, no watermark.
```

### ★ A-12 `bg-door-closed.png` / A-13 `bg-door-open.png` — 1024×1536, şeffaf arka plan
```
Using the attached style reference, draw a Japanese sliding wooden entrance door (two panels with shoji paper windows in the upper half and solid wood in the lower half), front view, with a red noren curtain split into three panels hanging across the top, the middle panel showing a simple white ramen bowl emblem. Door closed. Transparent background. Same art style. No text, no letters, no watermark.
```
```
Same door as the attached door image, identical size and framing, but the right panel is slid open to the left, revealing a warm-lit evening street outside with soft sakura colors. Transparent background around the door frame. Same art style. No text, no watermark.
```

### A-14 `deco-wall-art-wave.png` / A-15 `deco-wall-art-mountain.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a framed wall picture for a ramen restaurant: dark walnut wooden frame, cream paper inside with a simple painting of stylized teal ocean waves and a red sun. Front view. Transparent background. Same art style. No text, no signature, no watermark.
```
```
Same frame as the attached frame image, identical size and angle, but the painting inside shows a teal mountain with a snowy peak and an orange evening sun. Transparent background. Same art style. No text, no watermark.
```

### A-16 `deco-plant-fern.png` / A-17 `deco-plant-round.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a small decorative potted fern plant in a deep red ceramic pot, front view. Transparent background. Same art style. No text, no watermark.
```
```
Using the attached style reference, draw a small round bushy potted plant (like a bonsai-shaped boxwood) in a cream ceramic pot with a teal band, front view. Transparent background. Same art style. No text, no watermark.
```

### A-18 `deco-lucky-cat.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a cute white lucky cat figurine (maneki-neko) with a raised paw, red collar with a small golden bell, holding a golden coin with no writing, sitting on a small red cushion, front three-quarter view. Transparent background. Same art style. No text, no letters, no watermark.
```

### ★ A-19 `kitchen-counter.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw a long straight wooden restaurant service counter seen exactly from the side at eye level, filling the full width of the image: thick light warm-wood countertop with a bright edge highlight, and a darker walnut front panel made of vertical wooden slats beneath it. The counter occupies only the middle horizontal band of the image (about 25% of the height); everything above and below is transparent. Seamless on the left and right edges so it can be tiled. Same art style. No text, no watermark.
```

### ★ A-20 `kitchen-worktop.png` — 1536×1024
```
Using the attached style reference, draw the kitchen work surface for a side-view ramen kitchen game: a wide warm wooden worktop seen from slightly above, filling the whole image, with plank seams running horizontally, light scratches, soft warm light at the top fading to a darker brown at the bottom, a slight shadow strip along the top edge. No objects, no tools, no food on it. Seamless left and right edges. Same art style. No text, no watermark.
```

### A-21 `kitchen-serving-tray.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw a lacquered red Japanese serving tray with a thin gold rim, empty, seen from a low side angle (we see the top surface as a thin ellipse and the front edge), centered. Transparent background. Same art style. No text, no watermark.
```

---

## B — Mutfak ekipmanları

### ★ B-01 `equip-stove.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw a wide three-burner commercial gas stove for a ramen kitchen, side view at eye level: dark cast-iron body, three burners on top with small blue flames, a front control panel with three round metal knobs. Nothing on top of the burners (no pots). Transparent background. Same art style. No text, no labels, no numbers, no watermark.
```

### ★ B-02 `equip-pot-shoyu.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a large stainless steel stock pot with two side handles, seen from a slightly high side angle so the top opening is a visible ellipse, filled almost to the top with dark reddish-brown clear shoyu (soy sauce) ramen broth with small golden fat droplets on the surface. On the front of the pot, a small blank round cream-colored label plate (leave it empty). No steam (the game adds steam). Transparent background. Same art style. No text, no letters, no watermark.
```

### ★ B-03 `equip-pot-miso.png` — 1024×1024, şeffaf arka plan
```
Same pot as the attached pot image, identical size, shape, angle and blank label plate, but filled with opaque golden-orange miso ramen broth with a slightly cloudy surface and a few fat droplets. No steam. Transparent background. Same art style. No text, no watermark.
```

### ★ B-04 `equip-pot-tonkotsu.png` — 1024×1024, şeffaf arka plan
```
Same pot as the attached pot image, identical size, shape, angle and blank label plate, but filled with creamy milky-white tonkotsu pork bone broth with a rich glossy surface. No steam. Transparent background. Same art style. No text, no watermark.
```

### B-05 `equip-pot-lv2.png` — 1024×1024, şeffaf arka plan
```
Same pot as the attached pot image but upgraded: about 10% larger, polished shinier steel, brass-colored handles and a brass rim, filled with shoyu broth. Same angle. Transparent background. Same art style. No text, no watermark.
```

### ★ B-06 `equip-ladle.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a stainless steel soup ladle with a long handle, tilted at about 40 degrees as if pouring, the bowl of the ladle full of shoyu broth. Transparent background. Same art style. No text, no watermark.
```

### ★ B-07 `equip-noodle-cooker-lv1.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw an old, simple single noodle boiler for a ramen kitchen, side view at a slightly high angle: a rectangular stainless steel tank with rounded corners, the top opening shows bubbling clear water as an ellipse, one round metal knob on the front, a few small dents and wear marks. NO baskets in it. No steam. Transparent background. Same art style. No text, no numbers, no watermark.
```

### B-08 `equip-noodle-cooker-lv4.png` — 1536×1024, şeffaf arka plan
```
Same noodle boiler as the attached image, same angle and size, but upgraded and modern: polished steel, a small digital timer panel on the front (show the screen as a plain glowing teal rectangle with no digits), clean and shiny. NO baskets in it. Transparent background. Same art style. No text, no numbers, no watermark.
```

### ★ B-09 `equip-basket-empty.png` — 1024×1536, şeffaf arka plan
```
Using the attached style reference, draw a single deep cylindrical stainless steel mesh noodle basket (tebo) with a long vertical wooden handle sticking straight up, side view, empty. Centered. Transparent background. Same art style. No text, no watermark.
```

### ★ B-10 `equip-basket-thin.png` / B-11 `equip-basket-thick.png` — 1024×1536, şeffaf arka plan
```
Same noodle basket as the attached image, identical size and angle, but filled with thin straight pale-yellow ramen noodles visible through the mesh and slightly over the top rim. Transparent background. Same art style. No text, no watermark.
```
```
Same noodle basket as the attached image, identical size and angle, but filled with thick chewy wavy golden ramen noodles visible through the mesh and slightly over the top rim. Transparent background. Same art style. No text, no watermark.
```

### ★ B-12 `food-noodle-bundle-thin.png` / B-13 `food-noodle-bundle-thick.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw one raw bundle of thin straight fresh ramen noodles, pale yellow, folded into a neat nest shape and tied with a thin red paper band. Top-down three-quarter view. Transparent background. Same art style. No text, no watermark.
```
```
Using the attached style reference, draw one raw bundle of thick wavy fresh ramen noodles, golden yellow, folded into a neat nest shape and tied with a thin teal paper band. Top-down three-quarter view. Transparent background. Same art style. No text, no watermark.
```

### ★ B-14 `equip-noodle-box.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw an open shallow wooden crate holding three raw ramen noodle bundles side by side, seen from a slightly high front angle. Transparent background. Same art style. No text, no labels, no watermark.
```

### ★ B-15 `equip-bowl-stack.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a neat stack of five empty white ceramic ramen bowls with a thin teal band and a subtle red rim pattern, side view at eye level. Transparent background. Same art style. No text, no watermark.
```

### ★ B-16 `equip-ingredient-tray-empty.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw one empty rectangular stainless steel gastronorm food tray (bain-marie insert) set into a dark metal frame, seen from a high three-quarter angle so the inside is visible. Empty. Transparent background. Same art style. No text, no watermark.
```

### B-17 `equip-sauce-bottles.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw two squeeze sauce bottles side by side, one deep red (chili oil) and one dark brown (soy sauce), each with a blank cream label (no writing), front view. Transparent background. Same art style. No text, no watermark.
```

### B-18 `equip-cutting-board.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw a thick light wooden cutting board with a roll of chashu pork belly and three cut slices on it, and a chef knife resting on the right side, seen from a high three-quarter angle. Transparent background. Same art style. No text, no watermark.
```

### B-19 `equip-sink.png` / B-20 `equip-refrigerator.png` / B-21 `equip-dishwasher.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a small stainless steel kitchen sink with a curved faucet and two stacked washed white bowls drying beside it, side view at a slightly high angle. Transparent background. Same art style. No text, no watermark.
```
```
Using the attached style reference, draw a tall cream-white retro kitchen refrigerator with two doors and steel handles, a couple of cute magnets (no writing), front view. Transparent background. Same art style. No text, no watermark.
```
```
Using the attached style reference, draw a compact commercial stainless steel dishwasher with a front door, a small round knob and a teal indicator light, front view. Transparent background. Same art style. No text, no numbers, no watermark.
```

---

## C — Malzemeler ve yemek

Her malzeme için **iki görsel** üret:
- **(tek parça):** kâsenin içine konan tek parça.
- **(tepsi):** tepside duran dolu yığın.

Tek parça promptu (aşağıdaki listeden `<INGREDIENT>` kısmını değiştir):
```
Using the attached style reference, draw a single <INGREDIENT> as a ramen topping, seen from a high three-quarter top-down angle, appetizing, centered with empty space around it. Transparent background. Same art style: premium hand-drawn 2D cartoon food, clean dark-brown ink outlines, soft painterly shading, warm light from the upper left. No text, no watermark.
```

Tepsi promptu (`<INGREDIENT_PILE>` kısmını değiştir; B-16'daki boş tepsiyi de ekle):
```
Same stainless steel tray as the attached empty tray image, identical size and angle, but generously filled to the top with <INGREDIENT_PILE>, appetizing and neat. Transparent background. Same art style. No text, no watermark.
```

| # | Tek parça dosyası | `<INGREDIENT>` | Tepsi dosyası | `<INGREDIENT_PILE>` |
|---|---|---|---|---|
| ★ C-01 | `ing-chashu.png` | round slice of braised chashu pork belly with a pink center, swirl of fat and a dark caramelized edge | `tray-chashu.png` | overlapping round slices of braised chashu pork belly |
| ★ C-02 | `ing-chicken.png` | slice of tender poached chicken breast with a golden seared edge | `tray-chicken.png` | sliced poached chicken breast pieces |
| ★ C-03 | `ing-egg.png` | ramen soft-boiled marinated egg (ajitama) cut in half, jammy orange yolk, light brown marinated white | `tray-egg.png` | halved soft-boiled marinated eggs with jammy orange yolks |
| ★ C-04 | `ing-nori.png` | rectangular sheet of dark green nori seaweed, slightly glossy | `tray-nori.png` | neatly stacked rectangular nori seaweed sheets |
| ★ C-05 | `ing-green-onion.png` | small pile of thinly sliced fresh green onion rings | `tray-green-onion.png` | finely sliced bright green onion rings |
| ★ C-06 | `ing-corn.png` | small heap of sweet yellow corn kernels with a tiny butter shine | `tray-corn.png` | sweet yellow corn kernels |
| ★ C-07 | `ing-mushroom.png` | two simmered shiitake mushroom caps, glossy brown | `tray-mushroom.png` | simmered glossy shiitake mushrooms |
| ★ C-08 | `ing-bamboo.png` | small bundle of menma (seasoned bamboo shoot strips), light amber | `tray-bamboo.png` | menma bamboo shoot strips |
| ★ C-09 | `ing-naruto.png` | single slice of narutomaki fish cake, white with a pink spiral and wavy edge | `tray-naruto.png` | slices of white narutomaki fish cake with pink spirals |
| ★ C-10 | `ing-chili.png` | small pile of thin red chili threads and sliced red chili rings | `tray-chili.png` | sliced red chili peppers and chili threads |
| C-11 | `ing-beef.png` | thin slice of seared beef with pink center | `tray-beef.png` | thin slices of seared beef |
| C-12 | `ing-garlic.png` | small pile of crispy golden fried garlic chips | `tray-garlic.png` | crispy golden fried garlic chips |
| C-13 | `ing-sesame.png` | small sprinkle of white and black sesame seeds | `tray-sesame.png` | white sesame seeds |
| C-14 | `ing-sprouts.png` | small bundle of blanched bean sprouts | `tray-sprouts.png` | blanched bean sprouts |
| C-15 | `ing-spinach.png` | small mound of blanched bright green spinach leaves | `tray-spinach.png` | blanched green spinach |
| C-16 | `ing-shrimp.png` | one cooked pink shrimp, tail on | `tray-shrimp.png` | cooked pink shrimps |
| C-17 | `ing-tofu.png` | two golden fried tofu cubes | `tray-tofu.png` | golden fried tofu cubes |

### Kâse katmanları

Oyun kâseyi katman katman birleştirir. Bu dört parçanın **aynı açıda ve aynı boyutta** olması çok önemli. Önce C-20'yi (boş kâse) üret, sonra diğerlerinde onu ekleyip "same size and angle" de.

### ★ C-20 `bowl-basic-empty.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw one large empty white ceramic ramen bowl with a thin teal band around the outside and a subtle red rim line, seen from a three-quarter high angle so the full round opening is visible as a wide ellipse and the inside of the bowl is visible and empty. Centered, the bowl fills about 70% of the image width. Transparent background. Same art style. No text, no watermark.
```

### ★ C-21 `bowl-broth-shoyu.png` / C-22 `bowl-broth-miso.png` / C-23 `bowl-broth-tonkotsu.png` — 1536×1024, şeffaf arka plan
```
Same bowl as the attached empty bowl image, identical size, angle and position, now filled to about 80% with clear dark reddish-brown shoyu ramen broth with small golden fat droplets, nothing else in it (no noodles, no toppings). Transparent background. Same art style. No text, no watermark.
```
```
Same bowl as the attached empty bowl image, identical size, angle and position, filled to about 80% with opaque golden-orange miso ramen broth, nothing else in it. Transparent background. Same art style. No text, no watermark.
```
```
Same bowl as the attached empty bowl image, identical size, angle and position, filled to about 80% with creamy milky-white tonkotsu broth, nothing else in it. Transparent background. Same art style. No text, no watermark.
```

### ★ C-24 `bowl-noodles-thin.png` / C-25 `bowl-noodles-thick.png` — 1536×1024, şeffaf arka plan
```
Draw ONLY a nest of cooked thin straight pale-yellow ramen noodles shaped to sit inside the attached bowl's opening (same ellipse size and angle as the bowl opening), as if floating on broth, no bowl and no broth visible, only the noodles. Transparent background. Same art style. No text, no watermark.
```
```
Draw ONLY a nest of cooked thick wavy golden ramen noodles shaped to sit inside the attached bowl's opening (same ellipse size and angle as the bowl opening), no bowl and no broth visible, only the noodles. Transparent background. Same art style. No text, no watermark.
```

### C-26 `bowl-red.png` / C-27 `bowl-black.png` / C-28 `bowl-sakura.png` / C-29 `bowl-festival.png` — 1536×1024, şeffaf arka plan
```
Same bowl as the attached empty bowl image, identical size, angle and position, empty, but redesigned as a traditional glossy deep red lacquer-style bowl with a golden band. Transparent background. Same art style. No text, no watermark.
```
```
Same bowl, identical size, angle and position, empty, redesigned as a premium matte black ceramic bowl with a thin red band. Transparent background. Same art style. No text, no watermark.
```
```
Same bowl, identical size, angle and position, empty, redesigned as a pale pink ceramic bowl decorated with small painted sakura flowers. Transparent background. Same art style. No text, no watermark.
```
```
Same bowl, identical size, angle and position, empty, redesigned as a festive bowl with red and gold wave and firework patterns. Transparent background. Same art style. No text, no watermark.
```

### C-30 `food-ramen-complete.png` — 1024×1024, şeffaf arka plan
(Sipariş balonu, tarif kitabı ve menü logosu için.)
```
Using the attached style reference, draw a finished, beautiful bowl of spicy miso ramen in the white teal-band bowl, three-quarter top view: golden-orange broth, thick noodles, two chashu slices, a halved soft-boiled egg, green onion, corn, chili threads, and two nori sheets standing at the back, gentle steam. Transparent background. Same art style. No text, no watermark.
```

---

## D — Karakterler

**Her karakter için sıra:**
1. Karakter sayfasını (`-sheet`) üret ve kaydet.
2. Sonraki 6 promptu, karakter sayfasını ekleyerek üret.

**Ortak 6 ifade/poz promptu** (`<NAME>` yerine karakterin adını yaz):
```
Using the attached character sheet, draw <NAME> standing, three-quarter view facing slightly left, full body, with a NEUTRAL calm expression, arms relaxed. Exactly the same character design, outfit and colors as the sheet. Transparent background. Same art style. No text, no watermark.
```
Aynı promptta sadece ifade kısmını şu sırayla değiştir:
- `-neutral.png` → `with a NEUTRAL calm expression`
- `-happy.png` → `with a very HAPPY expression, big smile, eyes closed in joy, one hand slightly raised`
- `-angry.png` → `with an ANGRY grumpy expression, frowning brows, pouting, arms crossed`
- `-confused.png` → `with a CONFUSED expression, one eyebrow raised, head tilted, scratching the head`
- `-surprised.png` → `with a SURPRISED expression, wide round eyes, open mouth, hands up`
- `-talking.png` → `TALKING cheerfully with mouth open mid-word, one hand gesturing`

**Yürüme pozu** (`-walk.png`):
```
Using the attached character sheet, draw <NAME> walking to the left, pure side view, full body, mid-stride with one leg forward, arms swinging. Same design and colors. Transparent background. Same art style. No text, no watermark.
```

**Oturma pozu** (`-seated.png`, sadece müşteriler):
```
Using the attached character sheet, draw <NAME> sitting on a stool, three-quarter view, upper body leaning slightly forward, happily eating ramen with chopsticks from a bowl held in front. Same design and colors. Transparent background. Same art style. No text, no watermark.
```

### Karakter sayfası promptu (her karakter için)
`<DESCRIPTION>` kısmına aşağıdaki tablodan karakterin tarifini koy:
```
Using the attached style reference, create a character turnaround sheet for a 2D mobile cooking game: the same character shown 3 times side by side, full body, front view, three-quarter view and side view, standing in a relaxed neutral pose, evenly spaced, on a plain flat light cream background. Character: <DESCRIPTION>. Proportions: cute but not chibi, about 3 heads tall, big expressive eyes, readable silhouette. Style: premium hand-drawn 2D cartoon mobile game art, clean dark-brown ink outlines (#292323), soft painterly shading, warm light from the upper left. Respectful, no cultural stereotypes. No text, no labels, no watermark.
```

| # | Dosya öneki | Kim | `<DESCRIPTION>` |
|---|---|---|---|
| ★ D-01 | `char-chef` | Oyuncu, baş aşçı | a friendly young head ramen chef in their late 20s, warm smile, short dark brown hair, dark walnut-brown bandana tied on the head, cream-white chef jacket with dark brown trim, dark apron, dark trousers, simple shoes |
| ★ D-02 | `char-mei` | Üniversite öğrencisi | a university student girl around 20, black bob haircut with bangs, round thin-framed glasses, soft teal hoodie with cream drawstrings, grey jeans, white sneakers, a backpack strap over one shoulder, slightly tired but kind face |
| ★ D-03 | `char-kenji` | Ofis çalışanı | a busy office worker man around 35, neat side-parted black hair, navy suit jacket, white shirt, deep red tie slightly loosened, dark trousers, a slim briefcase, a little stressed but polite |
| ★ D-04 | `char-ece` | Sporcu | an energetic athletic young woman around 24, dark brown hair in a high ponytail, cream sweatband on the forehead, deep red track jacket with cream stripes, black sports leggings, running shoes, a sports bag, confident grin |
| ★ D-05 | `char-hoshino` | Mahallenin yaşlı müdavimi | a kind elderly man around 75, bald head with neat white hair on the sides, small round glasses, warm brown knitted cardigan with golden buttons over a cream shirt, dark trousers, a wooden walking cane, gentle grandfatherly smile |
| ★ D-06 | `char-lukas` | Gezgin turist | a cheerful tall traveler around 28, curly ginger-orange hair, freckles, bright orange short-sleeve shirt over a teal t-shirt, khaki shorts, hiking sandals, a camera on a strap around the neck, a small map in hand |
| ★ D-07 | `char-taro` | Yardımcı aşçı | a cheerful assistant ramen cook around 22, short black hair, white headband (hachimaki) with a small red circle, white cook uniform, dark apron, rolled-up sleeves |
| D-08 | `char-nami` | Hazırlık elemanı | a focused prep cook woman around 30, dark brown hair in a neat bun, teal shirt with a cream collar, dark apron, holding a small knife and cutting board |
| D-09 | `char-bora` | Garson | a friendly waiter man around 26, short black hair, black shirt with a golden name-tag shape (blank), dark apron, carrying an empty round serving tray |
| D-10 | `char-critic` | Yemek eleştirmeni (sonraki fazlar) | a stylish food critic woman around 45, sleek grey bob, elegant dark green coat, small notebook and pen, one raised eyebrow |
| D-11 | `char-visitor` | Gizemli ziyaretçi (sonraki fazlar) | a mysterious visitor of unclear age, long dark coat, wide-brim hat shadowing the eyes, kind hidden smile, scarf |

Çalışanlar (Taro, Nami, Bora) için ek pozlar:
```
Using the attached character sheet, draw <NAME> working at a kitchen station, three-quarter view, upper body, lifting a noodle basket and shaking off water, focused happy face. Same design and colors. Transparent background. Same art style. No text, no watermark.
```
```
Using the attached character sheet, draw <NAME> carrying a ramen bowl on a red tray with both hands, walking to the right, side view, full body. Same design and colors. Transparent background. Same art style. No text, no watermark.
```

---

## E — Efektler

### ★ E-01 `fx-steam.png` — 1024×1536, şeffaf arka plan
```
Using the attached style reference, draw three soft wavy wisps of white cooking steam rising vertically, stylized cartoon steam with soft edges, semi-transparent white. Transparent background. Same art style. No text, no watermark.
```

### ★ E-02 `fx-pour-stream.png` — 1024×1536, şeffaf arka plan
```
Using the attached style reference, draw a short curved stream of brown soup pouring downward with a small splash at the bottom, cartoon style. Transparent background. No text, no watermark.
```

### E-03 `fx-sakura-petals.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw 8 separate single sakura petals in different rotations, scattered with space between them, soft pink with a lighter tip. Transparent background. No text, no watermark.
```

### ★ E-04 `fx-coin.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a single shiny golden game coin with a square hole in the center and a subtle embossed ring pattern, no writing, slight sparkle highlight. Transparent background. Same art style. No text, no numbers, no watermark.
```

### E-05 `fx-sparkle.png` / E-06 `fx-hearts.png` / E-07 `fx-angry-puff.png` — 1024×1024, şeffaf arka plan
```
Draw a set of 4 separate golden four-point star sparkles of different sizes, cartoon style with dark brown outline. Transparent background. No text, no watermark.
```
```
Draw a set of 3 separate small cute pink hearts of different sizes floating upward, cartoon style with dark brown outline. Transparent background. No text, no watermark.
```
```
Draw a small grumpy dark grey cartoon puff cloud with a red anger symbol shape (crossed veins) beside it, cartoon style. Transparent background. No text, no watermark.
```

---

## F — Arayüz (UI)

Hepsinde: **yazı olmasın.** Yazıları oyun ekler.

### ★ F-01 `ui-panel-wood.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw an empty game UI panel: a rounded rectangle of warm cream paper with a thick warm wooden frame border, small brass corner studs, a wooden header bar across the top (empty), soft drop shadow. Flat front view, empty center. Transparent background. Same art style. No text, no icons, no watermark.
```

### ★ F-02 `ui-button-red.png` / F-03 `ui-button-gold.png` / F-04 `ui-button-teal.png` / F-05 `ui-button-cream.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw one empty rounded-rectangle game button, wide horizontal pill shape, glossy deep red (#A93C35) with a lighter top highlight, thick dark-brown outline and a darker bottom edge for a 3D pressed look. Empty, no text. Centered. Transparent background. No text, no watermark.
```
> Diğer üçü için `glossy deep red (#A93C35)` yerine sırasıyla `golden yellow (#F5CA72)`, `soft teal (#76B9B2)` ve `cream (#FFF0D6)` yaz.

### ★ F-06 `ui-hud-pill.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw an empty horizontal rounded pill-shaped HUD bar for a mobile game top bar, cream with a thin wooden-brown outline and a soft shadow, with an empty round slot on the left for an icon. No text. Transparent background. No watermark.
```

### ★ F-07 `ui-speech-bubble.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw an empty cartoon speech bubble for a game: large rounded rectangle, warm off-white cream with a thick dark-brown outline, a small tail pointing to the lower left, soft shadow. Empty inside. Transparent background. No text, no watermark.
```

### ★ F-08 `ui-order-card.png` — 1024×1536, şeffaf arka plan
```
Using the attached style reference, draw an empty restaurant order ticket for a game: tall cream paper slip with a slightly torn top edge, pinned by a small red clip at the top, faint horizontal ruled lines, soft shadow. Empty, no writing. Transparent background. No text, no watermark.
```

### ★ F-09 `ui-step-button.png` — 1536×1024, şeffaf arka plan
```
Using the attached style reference, draw one empty wide wooden cooking-step button for the bottom bar of a cooking game: rounded rectangle, light warm wood with a cream inner area, thick dark-brown outline, and a small empty dark-red circle badge on the top-left corner (for a step number added later). Empty, no text. Transparent background. No watermark.
```

### ★ F-10…F-17 Gezinme ikonları — her biri 1024×1024, şeffaf arka plan
Ortak prompt (`<ICON>` kısmını değiştir):
```
Using the attached style reference, draw a single game menu icon: <ICON>, inside a rounded square warm-wood button with a thick dark-brown outline and a soft highlight, cute readable cartoon style, centered. Transparent background. No text, no letters, no watermark.
```
| Dosya | `<ICON>` |
|---|---|
| `icon-shop.png` | a small Japanese shop stall with a red-and-white striped awning |
| `icon-upgrades.png` | a steel cooking pot with a teal upward arrow above it |
| `icon-employees.png` | two smiling cooks' faces, one with a white chef hat |
| `icon-recipes.png` | an open recipe book with a small ramen bowl drawn on the page |
| `icon-tasks.png` | a paper scroll checklist with two teal check marks |
| `icon-events.png` | a pink folding fan with a small firework above it |
| `icon-customize.png` | a paint brush next to a small red paper lantern |
| `icon-achievements.png` | a golden medal with a red ribbon and a star |

### F-18…F-27 Diğer ikonlar — her biri 1024×1024, şeffaf arka plan
Aynı ortak prompt, sadece çerçeve olmadan: `…a single game icon without a button frame: <ICON>…`

| Dosya | `<ICON>` |
|---|---|
| `icon-settings.png` | a cream cogwheel |
| `icon-pause.png` | two cream rounded pause bars |
| `icon-clock.png` | a round cream wall clock |
| `icon-satisfaction.png` | a smiling pink round face |
| `icon-star.png` | a golden star |
| `icon-lock.png` | a grey steel padlock |
| `icon-step-broth.png` | a small steaming soup pot with brown broth |
| `icon-step-noodles.png` | a noodle basket with yellow noodles |
| `icon-step-bowl.png` | an empty white ramen bowl |
| `icon-step-toppings.png` | a halved egg next to a chashu slice |
| `icon-step-serve.png` | a ramen bowl on a red tray with steam |

---

## G — Menü ve yükleme ekranı

### ★ G-01 `menu-storefront.png` — 1536×1024
```
Using the attached style reference, draw the exterior of the small Ramen Stories restaurant at dusk, straight-on front view: a cozy traditional wooden two-story Japanese shopfront, red noren curtain over the sliding door with a white ramen-bowl emblem, glowing red paper lanterns on both sides, warm light from the windows, a blooming sakura tree on the left, a small wooden bench and potted plants, a quiet stone-paved street, soft purple-orange evening sky, a few petals floating. Leave the upper-middle area of the sky fairly calm for a game logo. No people. Style: premium hand-drawn 2D cartoon mobile game art, clean dark-brown ink outlines, soft painterly shading, warm cozy lighting. No text, no letters, no signs with writing, no watermark.
```

### ★ G-02 `menu-logo-emblem.png` — 1024×1024, şeffaf arka plan
```
Using the attached style reference, draw a game logo emblem with NO text: a beautiful steaming bowl of ramen with chopsticks resting across it, sitting on top of an empty wooden plaque banner with rounded ends and a red ribbon (leave the plaque surface empty for the title added later). Front view, centered. Transparent background. Same art style. No text, no letters, no watermark.
```

### G-03 `loading-background.png` — 1536×1024
```
Using the attached style reference, draw a soft blurred close-up background of a ramen kitchen counter at night: out-of-focus glowing lanterns (bokeh), steam, warm wood, very soft and calm, suitable behind a loading bar. No objects in sharp focus. No text, no watermark.
```

---

## Bitince

1. Görselleri bu dosyadaki adlarla kaydet.
2. Klasörlere ayır: `A-mekan`, `B-ekipman`, `C-malzeme`, `D-karakter`, `E-efekt`, `F-arayuz`, `G-menu`.
3. Hepsini (ya da önce ★ olanları) bana gönder. Oyuna ben yerleştiririm: konumları, katmanları ve animasyonları ayarlarım.
