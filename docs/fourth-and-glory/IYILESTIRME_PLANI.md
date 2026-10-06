# Fourth & Glory 3D (v0.7): Teknik ve Tasarım İyileştirme Planı

> Kapsam: `Fourth_and_Glory_3D` paketinin tamamı (`js/*.js`, `css/style.css`, `index.html`, `tests/*`) satır satır incelendi.
> Mevcut 4 Node testi (`gameplay`, `career`, `models`, `ui`) **geçiyor**. Aşağıdaki hatalar bu testlerin kapsamadığı alanlarda: gerçek zamanlama, ekran üst üste binmesi, GPU görüntüsü ve denge.
> Dosya/satır referansları v0.7 kaynağına göredir.

---

## Uygulama durumu (v0.8)

Plan, `public/fourth-and-glory/` altındaki oyuna uygulandı (yayında `/fourth-and-glory/index.html`). Ölçümler `TEST_SONUCLARI.txt` dosyasında. Plandan sapmalar ve yeni bulgular:

| Konu | Durum |
|---|---|
| B1, B2/B3, B6, B7 | Düzeltildi. E2E testi v0.7'de başarısız, v0.8'de geçiyor. |
| B4 (çift dokunuş), B5 (PAS AT gecikmesi) | **Plandaki tespit abartılıydı**: v0.7'de yeniden üretilemedi (ekran anında değiştiği için ikinci dokunuş girişe düşüyor; snap arayüzü zaten doğrudan güncelliyor). Korumalar yine de eklendi, çünkü yeni geçiş animasyonları bu riskleri gerçek kılıyor. |
| B8 | Yanlış tespitti (`unlocked` 10'da sınırlanıyor); plandan çıkarıldı. |
| **B10 (yeni)** | Karakter oluşturma sekmeleri telefon boyutunda **hiç tıklanamıyordu**: grid satırı, `overflow-x:auto` sekme şeridi yüzünden eziliyordu. Düzeltildi, E2E testi eklendi. |
| Zorluğun kök nedeni | §2.1'deki parametrelere ek olarak asıl neden: **play'ler tamamen deterministikti.** Başarısız bir play birebir aynı haliyle tekrarlandığı için çözüm ezberleniyordu. Tohumlanabilir rastgelelik ve tekrar varyantları eklendi. |
| Zorluk ayarı | §2.3 tablosuna seviye çarpanı `k` eklendi ve botlarla hedef eğriye ayarlandı (tablodaki ham değerler oyunu fazla zorlaştırıyordu). Ayrıca §2.5'e göre iki düzeltme yapıldı: Topa yalnızca hedefi kollayan ya da iniş noktasını *görebilen* savunmacı kırılır (`vision`), ve receiver'ın yanındaki savunmacı artık otomatik INT değil çekişmeli top üretir. |
| Forma kontrastı | Rakip forması ile ev forması arasında ≥3:1 uygulandı (kural gereği rakiplerin çoğu beyaz deplasman formasıyla çıkıyor). "Çime karşı ≥3:1" koşulu uygulanmadı: koyu formaların hiçbiri bunu sağlamıyor, gerçek sahada da sağlamıyor. |
| Güneş yönü (Level 2) | "Kameranın arkası" yerine sol-ön (az −105°) kullanıldı: uzun gölgeler sahayı enine keser, ufuktaki altın hale görünür. |
| Paket kartları | WebGL düzlemleri yerine GPU hızlandırmalı CSS 3D + holografik konik degrade kullanıldı. 5 aşama, Atla ve azaltılmış hareket desteği plandaki gibi. |
| Yapılmayanlar | Yağmur seçeneği, ekran uzayı lens flare (yerine projektör parlama sprite'ı var), `popstate` ile geri tuşu (yerine Esc). |

## 0. Yönetici özeti

| # | Alan | Kök neden (tek cümle) | Öncelik | Efor |
|---|---|---|---|---|
| 1 | **Oyun seçim ekranı** | Ekranlar ve katmanlar merkezi bir durum makinesi olmadan, birbirinden habersiz `classList.toggle` çağrılarıyla yönetiliyor. İptal edilmeyen zamanlayıcılar ve tekrar girilebilen işleyiciler var. | **P0** | 3–4 gün |
| 2 | **Zorluk** | Pas tamamen otomatik nişanlanıyor. Savunmacılar her seviyede receiver'dan yavaş. Oyun saati azalıyor ama hiçbir sonucu yok. Top taşıyıcıyı kimse yakalayamıyor. | **P0** | 6–8 gün |
| 3 | **Level 2 görseli** | Kolej aşamasında gün batımı ışığı, sabit öğle mavisi 2D gökyüzünün altında render ediliyor. Seviye verisi gece/şehir/neon temalı, harita ise turkuaz bir katmanla örtülü. Üç kaynak birbiriyle çelişiyor. | **P1** | 5–6 gün |
| 4 | **Karakter ve paket** | Önizleme, stadyum ışık düzeninin ortamsız ve zeminsiz bir kopyası. Paket açılımı 2D CSS çevirmesinden ibaret ve parlama animasyonu sonradan eklenen bir CSS kuralıyla kapatılmış. | **P1** | 8–10 gün |
| 5 | **Stadyum** | Görsel seviye iyi. Ancak seyirci tek blok halinde zıplıyor, sahne yüzlerce ayrı `BoxGeometry` ile çiziliyor ve çevreyle etkileşim yok. | **P2** | 5–7 gün |

Önerilen sıra: **Sprint 1** (1 + 2'deki hızlı düzeltmeler) → **Sprint 2** (2'nin AI bölümü + 3) → **Sprint 3** (4 + 5). Gerekçe: Önce oyunu kıran ve oyuncuyu kaybettiren sorunlar düzelir, sonra görsel tutarlılık gelir. Paylaşılan renderer altyapısı (Bölüm 3.2) 4 ve 5'in ortak temelidir.

---

## 1. Oyun Seçim Ekranı: Hata Düzeltme ve UI/UX

### 1.1 Tespit edilen hatalar (yeniden üretilebilir)

| ID | Belirti ("tam oturmama") | Kök neden | Konum |
|---|---|---|---|
| **B1** | Seviye biter bitmez Duraklat → Haritaya dön yapılırsa, harita ekranının üstünde "SEVİYE TAMAM" kartı açılır. Ödül ikinci kez işlenebilir ya da hiç işlenmeyebilir. | `levelEnd`, 450 ms'lik bir `setTimeout` kuruyor ve bu zamanlayıcı **hiç iptal edilmiyor**. Bu arada pause düğmesi aktif kalıyor. `S.finishLevel` yalnızca `showEnd` içinde çağrıldığından, ödülün kaydedilmesi bir UI zamanlayıcısına bağlı. | `ui.js` → `GAME.hooks.levelEnd` |
| **B2** | Seviye 1 bitince "SONRAKİ SEVİYE"ye basılınca üniversite seçimi, **donmuş oyun sahasının üstünde** açılıyor. × ile kapatılırsa oyuncu, hiçbir kontrol olmadan duran bir sahada kalıyor. | `openIntro` → `FG_CAREER_UI.gate()` → `careerOverlay` açılıyor. Ancak aktif ekran hâlâ `gameScreen` (phase `done`, `paused`). `careerClose` yalnızca katmanı kapatıyor, ekranı geri almıyor. | `career-ui.js` → `gate`, `close` |
| **B3** | Okul seçilince harita bir kare görünüp hemen kayboluyor (titreme). | `choose` → `FG_UI.openMap()` haritayı **baştan inşa ediyor** (SVG + düğümler). Hemen ardından `openIntro` oyun ekranına geçiyor. | `career-ui.js` → `gate` içindeki `onclick` |
| **B4** | Düğüme hızlı çift dokunulunca ses ve banner iki kez çalıyor, seviye iki kez başlatılıyor. | `openIntro` tekrar girilebilir. Kilit (busy flag) yok, `GAME.startLevel` iki kez çalışıyor. | `map.js` → `.node` `onclick`, `ui.js` → `openIntro` |
| **B5** | Snap'ten sonra PAS AT düğmesi ve hareket kontrolü gecikmeli beliriyor, bazen 250 ms boyunca tıklama boşa gidiyor. | `controls()` yalnızca `hud()` içinden çağrılıyor. `hud()` ise render döngüsünde **250 ms'de bir** çalışıyor (`game.js` `frame`). Faz değişimi olay tabanlı değil, periyodik sorgulamaya (polling) bağlı. | `game.js` `frame`, `career-ui.js` `controls` |
| **B6** | Katmanlar sert biçimde açılıp kapanıyor. İki katman aynı anda açık kalabiliyor (ör. `packsOverlay` + `careerOverlay`). | Tüm `.overlay` öğeleri `z-index:50`, sıralamayı DOM sırası belirliyor. `display:none↔flex` ile geçiş animasyonu yapılamıyor. Açık katmanları tutan bir yığın (stack) yok. | `style.css:112-113` |
| **B7** | Oyuncum/Soyunma sonrasında oyuna dönünce önizleme ya da saha bazen siyah kalıyor (özellikle iOS Safari). | Oyun + `creatorCanvas` + `playerCanvas` + `lockerCanvas` için **4 ayrı WebGL context** açılıyor (`FG_GL.create` her canvas için yeni bir `WebGLRenderer` oluşturuyor). Mobil tarayıcılar context sayısını sınırlıyor ve en eskisini düşürüyor (`webglcontextlost` işlenmiyor). | `preview.js` `mount`, `gl3d-enhanced.js` `create` |
| **B9** | Açık ama yıldızsız bir düğüm "tamamlandı" gibi görünüyor. | `cls=st?"done":current?"current":unlocked?"done":"locked"`. Açık olup oynanmamış düğüm de `done` sınıfını alıyor. | `map.js` `build` |

### 1.2 Mimari çözüm: Merkezi UI durum makinesi

Sorunların ortak kökü: `show()`, `overlay()`, `GAME.pause()` ve `GAME.setRunning()` birbirinden bağımsız çağrılıyor. Geçersiz durum kombinasyonları (oyun ekranı + kariyer katmanı + paused) oluşabiliyor. Çözüm, tek bir kaynaktan yönetilen bir FSM'dir.

```js
// js/ui-state.js (yeni). ui.js ve career-ui.js'ten önce yüklenir
(function(){
  const SCREENS={ creator:"#creatorScreen", map:"#mapScreen", game:"#gameScreen" };
  // Hangi ekranda hangi katman açılabilir? Geçersiz kombinasyonu baştan engeller.
  const ALLOWED={
    creator:[], map:["career","packs","player","locker","settings","open"],
    game:["intro","pause","end","open"]
  };
  const st={ screen:"boot", stack:[], busy:false, timers:new Set() };
  const $=s=>document.querySelector(s);

  function later(fn,ms){ const t=setTimeout(()=>{ st.timers.delete(t); fn(); },ms); st.timers.add(t); return t; }
  function cancelAll(){ st.timers.forEach(clearTimeout); st.timers.clear(); }

  function screen(name){
    if(st.screen===name) return;
    cancelAll();                                   // B1: ekran değişince bekleyen tüm UI zamanlayıcıları ölür
    st.stack.slice().reverse().forEach(close);     // önceki ekranın katmanları kapanır
    document.querySelectorAll(".screen").forEach(s=>{
      const on=s.matches(SCREENS[name]); s.classList.toggle("active",on); s.inert=!on;
    });
    st.screen=name;
    FG_GAME.setRunning(name==="game"); if(name!=="game") FG_GAME.pause(true);
  }
  function open(id){
    if(!ALLOWED[st.screen]?.includes(id)) { console.warn(`[ui] ${id} katmanı ${st.screen} ekranında açılamaz`); return false; }
    const el=$("#"+id+"Overlay"); if(st.stack.includes(id)) return true;
    st.stack.push(id); el.style.zIndex=50+st.stack.length; el.classList.add("show"); el.inert=false;
    st.stack.slice(0,-1).forEach(o=>$("#"+o+"Overlay").inert=true);   // alttaki katmanlar tıklanamaz
    return true;
  }
  function close(id){
    const el=$("#"+id+"Overlay"); st.stack=st.stack.filter(x=>x!==id);
    el.classList.remove("show"); el.inert=true;
    const top=st.stack.at(-1); if(top) $("#"+top+"Overlay").inert=false;
  }
  // B4: tekrar girişi engelleyen sarmalayıcı (geçiş animasyonu süresince kilit)
  function guard(fn,ms=350){ return (...a)=>{ if(st.busy) return; st.busy=true; later(()=>st.busy=false,ms); return fn(...a); }; }

  window.FG_UISTATE={ screen, open, close, guard, later, cancelAll, get:()=>({...st,stack:[...st.stack]}) };
})();
```

### 1.3 Hata bazlı düzeltmeler

**B1: Sonucu hemen kaydet, sunumu iptal edilebilir zamanlayıcıyla ertele**
```js
// ui.js
GAME.hooks.levelEnd=res=>{
  const committed=commitResult(level,res);           // S.finishLevel + FG_CAREER.record ŞİMDİ yapılır
  $("#pauseBtn").disabled=true;                     // son 450 ms'de duraklatma kapalı
  FG_UISTATE.later(()=>{ GAME.pause(true); showEnd(res,committed); $("#pauseBtn").disabled=false; },450);
};
```
`showEnd`, ödülü artık hesaplamaz, yalnızca `committed` nesnesini gösterir. Böylece kaydın yazılması zamanlayıcıya bağlı olmaz.

**B2/B3: Kariyer kapısı her zaman harita ekranında açılır, kapatınca harita kalır**
```js
// career-ui.js → gate()
if(document.getElementById('gameScreen').classList.contains('active')) FG_UI.openMap(); // önce haritaya dön
...
b.onclick=FG_UISTATE.guard(()=>{ if(C.choose(reason,b.dataset.choice)){ close(); FG_UI.openIntro(next); } });
// openMap() tekrar çağrılmaz: harita zaten açık. Böylece B3 titremesi kalkar.
```

**B5: Faz değişimi olay tabanlı olmalı**
```js
// game.js: G.phase'e doğrudan atama yerine:
function setPhase(p){ if(G.phase===p) return; G.phase=p; hud(); G.hooks.phase&&G.hooks.phase(p); }
// snap(), throwBall(), updateQB() içindeki tüm `G.phase='...'` atamaları setPhase(...) ile değişir.
// frame() içindeki 250 ms'lik hud() yalnızca saat/skor gibi sürekli değerler için kalır.
```

**B6: Geçişli katmanlar (CSS)**
```css
.overlay{display:flex;opacity:0;visibility:hidden;pointer-events:none;
  transition:opacity .22s cubic-bezier(.2,.7,.2,1),visibility 0s linear .22s}
.overlay.show{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .22s cubic-bezier(.2,.7,.2,1)}
.overlay .sheet,.overlay .intro-card,.overlay .end-card{transform:translateY(14px) scale(.98);transition:transform .32s cubic-bezier(.2,.9,.25,1.05)}
.overlay.show .sheet,.overlay.show .intro-card,.overlay.show .end-card{transform:none}
.screen{display:block;opacity:0;visibility:hidden;transition:opacity .28s,visibility 0s .28s}
.screen.active{opacity:1;visibility:visible;transition:opacity .28s}
@media (prefers-reduced-motion:reduce){.overlay,.screen,.overlay *{transition:none!important}}
```
> Not: `tests/ui.cjs` yalnızca sınıf durumunu kontrol ettiği için bu değişiklik testleri bozmaz.

**B7: Tek WebGL context**

Oyun renderer'ı tekil (singleton) olur. Önizlemeler aynı `WebGLRenderer` ile ekran dışı bir `WebGLRenderTarget`'a çizilir, sonuç `canvas.getContext('2d').drawImage(renderer.domElement, …)` ile kopyalanır. Alternatif olarak tek bir tam ekran canvas üzerinde `setScissor` + `setViewport` kullanılabilir. Ayrıca:
```js
renderer.domElement.addEventListener('webglcontextlost',e=>{ e.preventDefault(); FG_GAME.pause(true); });
renderer.domElement.addEventListener('webglcontextrestored',()=>{ rebuildStadium(); FG_UI.toast('Grafikler yeniden yüklendi.'); });
```

**B9**
```js
// map.js
const cls=st?"done":l.id===s.unlocked?"current":unlocked?"open":"locked"; // yeni .node.open stili
```

### 1.4 UX iyileştirmeleri (seçim ekranı)

- **Durum geri bildirimi**: Her düğmeye `:active` (ölçek 0.96) ve 80 ms'lik haptic (`navigator.vibrate(8)`) eklenir. Gecikmeli işlemlerde (paket açma, seviye yükleme) düğme `aria-busy="true"` ile kilitlenir.
- **Dokunma hedefleri**: Minimum 44×44 px. Harita düğümlerinde dokunma alanı görselden büyük tutulur (`::before` ile 64 px).
- **Hiyerarşi**: Kariyer kapısı (üniversite/draft) bir **tam ekran sinematik karar ekranına** dönüşür. Seçenekler yan yana kartlar halinde sunulur, kilitli kartlarda "Scout X gerekli" bir ilerleme çubuğuyla gösterilir.
- **Geri dönüş tutarlılığı**: Donanım ve tarayıcı geri tuşu (`popstate`) FSM yığınındaki en üst katmanı kapatır.

### 1.5 Doğrulama: gerçek tarayıcıda E2E

Mevcut UI testleri sahte bir DOM adaptörü kullanıyor, zamanlama hatalarını yakalayamaz. Ortamda Chromium + Playwright hazır:

| Senaryo | Beklenen |
|---|---|
| Seviye bitir → 200 ms içinde Duraklat → Haritaya dön | Haritada `endOverlay` **yok**. Ödül **bir kez** yazılmış. |
| Seviye 1 bitir → SONRAKİ SEVİYE → × | Aktif ekran `mapScreen` |
| Düğüme 2× hızlı dokun | `startLevel` 1 kez çağrılmış (spy) |
| Snap → 50 ms sonra PAS AT'ın görünürlüğü | Görünür |
| Oyuncum ↔ Oyun 20 kez geçiş (CDP ile context limiti düşürülmüş) | Siyah canvas yok |
| Her ekranda aynı anda açık `.overlay.show` sayısı | ≤ ALLOWED yığını |

---

## 2. Oyun Zorluğu ve Dengeleme

### 2.1 Kolaylığın kanıtı (kod değerleri)

| Mekanik | Mevcut değer | Etki |
|---|---|---|
| Nişan | `assistedPass`, seçili receiver'ın gelecekteki konumunu 5 iterasyonla **tam isabetle** hesaplıyor. Hata yalnızca `l.vx += error*…`: tipik olarak 0,05–0,3 m/s, yani ~1 sn uçuşta 0,3 m'den az sapma. | Pas neredeyse hiç kaçmıyor |
| Yakalama / INT yarıçapı | Yakalama `1.1 + (catching-50)*.008 + catchBonus(≤.4)` ≈ **1,1–1,6 m**. INT `rad` **.65 m** (yıldız .82). | Topu kapma penceresi, yakalama penceresinin yarısından küçük |
| Hız | WR `4.5 + i*.08` → 4,5–5,22 m/s. DB `id===1 ? 2.5 : 3.8 (+.5 yıldız)`. | **Her seviyede savunmacı daha yavaş.** Ayrışma her saniye artıyor. |
| Man coverage | Receiver'ın 1,8 m (L1: 3,2 m) gerisini takip ediyor | Zaten açık olan receiver'lar |
| Topa tepki | Pastan .3 sn (L1 .65 sn) sonra başlıyor, sadece .35 sn ileriyi tahmin ediyor | Pas arasına girme yok denecek kadar az |
| Cep süresi | `4.5 - id*.12 + blockBonus(≤.8) + i*.25` → L10'da bile ≈ 3,3–4,1 sn. Üstüne ilk 1,4 sn **×0,55 ağır çekim**, nişanda **×0,22**. | Gerçekte 5 sn'den fazla düşünme süresi |
| Oyun saati | `P.clock` azalıyor ama 0'a ulaşınca **hiçbir şey olmuyor** (`game.js` updateQB) | Zaman baskısı yok |
| Topla koşu | Taşıyıcı `6.1 + …` m/s. Takip `4.1 + id*.12` (L10: 5,3), **saf takip** (hedefe doğrudan koşma). Tackle için 0,8 m gerekiyor. | Yakalandıktan sonra tackle neredeyse imkânsız |
| Tekrar | Aynı rotalar ve aynı coverage (`j` indeksine göre deterministik) | Ezberleyerek geçiliyor |
| Can | 4 play için 3 can, yıldız = kalan can | 1 hata bile 2 yıldız demek. Mükemmeliyet ödüllendirilmiyor. |

### 2.2 Tasarım hedefleri

1. **Adil**: Her başarısızlık okunabilir olmalı ("neden kaybettim?"). Hata sinyali ekranda ve tekrar kamerasında görünür.
2. **Rekabetçi**: Ustalık tavanı yüksek olmalı. Yıldızlar performansla kazanılır, canla değil.
3. **Testere dişi eğri**: Her bölüm sonunda zirve, ardından nefes alınan bir seviye. Bölümler: Kamp → Kolej (2–6) → Combine (7, dinlenme) → Pro (8–10).
4. **Hedef ilk deneme başarı oranları** (telemetriyle izlenir):

| Seviye | 1 | 2 | 3 | 4 (derbi) | 5 | 6 (final) | 7 (combine) | 8 | 9 | 10 (Bowl) |
|---|---|---|---|---|---|---|---|---|---|---|
| İlk deneme başarı | %90 | %80 | %70 | %60 | %62 | %50 | %70 | %55 | %45 | %35–40 |
| Ortalama deneme | 1.1 | 1.3 | 1.5 | 1.8 | 1.7 | 2.2 | 1.5 | 2.0 | 2.4 | 2.8 |

### 2.3 Veri güdümlü zorluk tablosu

Sabit sayılar koddan çıkarılıp tek bir tabloya taşınır (`js/difficulty.js`). Tasarımcı kod değiştirmeden ayar yapabilir.

```js
// js/difficulty.js
// hold: cep süresi (s) | dbRatio: DB hızı / WR hızı | react: topa tepki gecikmesi (s)
// intR: INT yarıçapı | catchR: taban yakalama yarıçapı | assist: nişan yardımı 0..1
// clock: oyun saati kuralı | slow: ilk 1.4 sn zaman ölçeği | pursuit: takip hızı / taşıyıcı hızı
window.FG_DIFF={
  levels:{
     1:{hold:6.0,dbRatio:.80,react:.55,intR:.70,catchR:1.10,assist:1.00,clock:"off", slow:.55,pursuit:.70},
     2:{hold:4.6,dbRatio:.86,react:.45,intR:.75,catchR:1.05,assist:.85,clock:"warn",slow:.65,pursuit:.78},
     3:{hold:4.3,dbRatio:.90,react:.38,intR:.80,catchR:1.00,assist:.70,clock:"on",  slow:.75,pursuit:.84},
     4:{hold:4.0,dbRatio:.94,react:.32,intR:.86,catchR:.95, assist:.60,clock:"on",  slow:.85,pursuit:.88},
     5:{hold:4.0,dbRatio:.93,react:.30,intR:.86,catchR:.95, assist:.55,clock:"on",  slow:.90,pursuit:.88}, // nefes
     6:{hold:3.6,dbRatio:.97,react:.25,intR:.95,catchR:.90, assist:.45,clock:"on",  slow:1,  pursuit:.92},
     7:{hold:9.9,dbRatio:0,  react:0,  intR:0,  catchR:.80, assist:.30,clock:"on",  slow:1,  pursuit:0},   // combine: isabet testi
     8:{hold:3.5,dbRatio:.98,react:.22,intR:1.0,catchR:.88, assist:.35,clock:"on",  slow:1,  pursuit:.94},
     9:{hold:3.3,dbRatio:1.0,react:.20,intR:1.05,catchR:.86,assist:.30,clock:"on",  slow:1,  pursuit:.96},
    10:{hold:3.1,dbRatio:1.02,react:.18,intR:1.10,catchR:.85,assist:.25,clock:"on", slow:1,  pursuit:.98}
  },
  // Seviye içi rampa: 4. play (red zone) her zaman biraz daha zor
  playRamp:[1.00,1.03,1.06,1.10],
  // Kullanıcı ayarı (erişilebilirlik): tablo değerlerini ölçekler
  presets:{ rookie:.80, pro:1.00, allpro:1.12, glory:1.25 }
};
FG_DIFF.get=(level,play)=>{ const b=FG_DIFF.levels[level], k=FG_DIFF.playRamp[play]||1, p=FG_DIFF.presets[FG_STATE.get().settings.difficulty||"pro"], m=k*p*FG_DDA.factor();
  return {...b, hold:b.hold/m, react:b.react/m, dbRatio:b.dbRatio*Math.sqrt(m), intR:b.intR*m, catchR:b.catchR/Math.sqrt(m), assist:Math.max(0,b.assist/m)}; };
```

`game.js` içinde değiştirilecek yerler: `updateQB` cep süresi (`hold`), DB hızı (`3.8` → `wrSpeed*dbRatio`), topa tepki (`.3`), `assistedPass` (aşağıda), `cr` (yakalama), `d.rad` (INT), carry takip hızı, `simulate` içindeki `.55` (ağır çekim).

### 2.4 Nişan: "yardım", "otomatik pilot" olmaktan çıkar

```js
// assistedPass sonunda: hedef noktaya, yardım seviyesine ve özelliklere bağlı bir hata konisi
const D=FG_DIFF.get(G.level.id,G.si), skill=A(est<10?'shortAcc':est<25?'mediumAcc':'deepAcc');
const pressure=…; // mevcut hesap
const sigma=(1-D.assist)*(.9-skill/140) + pressure*(1-A('pocketPresence')/100)*.8 + (G.P.qb.moving||0)*(1-A('throwOnRun')/100)*.6;
dest.x+=randn()*sigma*1.2; dest.z+=randn()*sigma*.8;        // metre cinsinden: L10'da ~0,5–1,2 m
// Zamanlama ustalığı: receiver kırılım noktasındayken (seg değişimi ±0.25 sn) atılan pas: sigma *= .5 ve "ON TIME" floater'ı
```
Böylece doğru okuma + doğru zamanlama + temiz cep **ölçülebilir biçimde** ödüllendirilir. Rastgelelik var ama oyuncunun kontrolündeki faktörlere bağlı.

### 2.5 Savunma yapay zekâsı: kurallardan yardımcı-fonksiyon tabanlı (utility) karara

Mevcut AI, her savunmacı için tek satırlık sabit kurallardan oluşuyor. Önerilen yapı katmanlı:

```
DefenseCoordinator (snap öncesi, play başına)
  ├─ Oyuncunun eğilimlerini okur (son 8 pasın hedefi, derinliği, pas süresi)
  ├─ Coverage seçer (ağırlıklı rastgele; L1–3 sabit, L4+ adaptif)
  └─ Disguise: snap öncesi gösterilen ≠ gerçek (L5+). Snap sonrası 0,6 sn rotasyon.
Defender (her kare, utility puanlaması)
  ├─ Görevler: MAN_TRAIL, MAN_PRESS, ZONE_DROP, ZONE_MATCH, BREAK_ON_BALL, RUSH, SPY, PURSUE
  ├─ Algı: tepki gecikmesi (react), görüş konisi (QB'nin gözüne bakan safety = gerçek "göz okuma")
  └─ Hareket: hız eğrisi (ivme 6 m/s², dönüşte hız kaybı) → ani kırılımlara geç kalma = adil açıklık
```

**a) Topa kırılma (ball-hawk):** Pas atıldığında her savunmacı, topun ineceği noktaya receiver'dan önce ulaşıp ulaşamayacağını hesaplar.
```js
function ballHawk(d,b,D){
  const land=predictLanding(b);                          // predict() zaten var
  const tBall=land.t, tDef=D.react + hyp(d,land)/d.speed;
  if(tDef < tBall-.05) return {task:'INTERCEPT',x:land.x,z:land.z};       // gerçek INT şansı
  if(tDef < tBall+.25) return {task:'PBU',x:land.x,z:land.z};             // savuşturma
  return null;                                                            // receiver'ı tackle'la
}
```
Bu, "riskli pas" etiketinin gerçekten risk taşımasını sağlar. Oyuncu ekranda okuduğu açıklığın bedelini öder.

**b) Zone pattern-matching:** Bölgesindeki receiver dikine koşuyorsa (go/post) devir yerine onu takip eder. Böylece cover-3/4 arasında okunabilir bir fark oluşur.

**c) Takip açısı (lead pursuit):** Saf takip yerine kesişme noktasını hedefler.
```js
function pursuitPoint(d,c,speed){            // c: taşıyıcı {x,z,vx,vz}
  const rx=c.x-d.x, rz=c.z-d.z, a=c.vx*c.vx+c.vz*c.vz-speed*speed, bq=2*(rx*c.vx+rz*c.vz), cq=rx*rx+rz*rz;
  const disc=bq*bq-4*a*cq; let t=disc<0||Math.abs(a)<1e-6? Math.sqrt(cq)/speed : (-bq-Math.sqrt(disc))/(2*a);
  if(!(t>0)) t=(-bq+Math.sqrt(Math.max(0,disc)))/(2*a);
  t=Math.min(Math.max(t||0,0),1.5);           // 1,5 sn'den uzak geleceği tahmin etme (aldatılabilir kalsın)
  return {x:c.x+c.vx*t, z:c.z+c.vz*t};
}
```
Ek olarak taşıyıcıya **juke** (ani yön değiştirme) yeteneği verilir: `agility`'ye bağlı olarak 0,3 sn boyunca savunmacının tahmini bozulur. Hız farkı azalınca beceri ön plana çıkar.

**d) Pas hücumu:** OL/DL eşleşmeleri her play'de bir "kazanma" olasılığıyla çözülür: `p = sigmoid((DL - OL)/10)`, `blockBonus` OL'ye eklenir. Kazanan DL dış koridordan gelir (cep kenardan çöker). Bu, oyuncuyu **cepte öne adım atmaya** yönlendirir; oyunun içinde öğretilen bir beceri olur.

**e) Oyun saati kuralı:** `clock:"warn"`: son 2 sn kırmızı nabız + saat sesi. `clock:"on"`: 0'da **sack** sayılır (savunma QB'ye ulaşır). Topu saha dışına atma (throw-away) seçeneği eklenir: can gitmez, play tekrar edilir, ancak puan düşer.

### 2.6 Dinamik zorluk ayarı (DDA): dar bantlı ve şeffaf

Amaç sürekli kaybeden oyuncuyu kaybetmemek, ama ustaya "lastik bant" hissi de vermemek.

```js
// js/dda.js
window.FG_DDA=(function(){
  const S={ skill:0, fails:0 };                         // skill ∈ [-1, 1]
  const BAND=.08;                                        // en fazla ±%8 etki
  function onPlay(r){                                    // r: 1 temiz başarı, .6 baskılı başarı, 0 başarısız
    S.skill=S.skill*.75 + (r-.65)*.25*2;                 // EMA
    S.fails=r?0:S.fails+1;
  }
  function factor(){
    if(FG_GAME.G.level?.final) return 1;                 // final ve "boss" play'lerde kapalı
    const streakHelp=Math.min(S.fails,3)*.02;            // 3 üst üste hatada +%6 yardım
    return Math.max(1-BAND, Math.min(1+BAND, 1 + S.skill*BAND - streakHelp));
  }
  function reset(){ S.skill=0; S.fails=0; }              // her seviye başında
  return {onPlay,factor,reset,_s:S};
})();
```
- `endShot` içinde `FG_DDA.onPlay(success?(pressureAtThrow>.5?.6:1):0)`.
- Etki, istatistik ve ödül hesaplarına **girmez**. Yalnızca savunma parametrelerine uygulanır.
- Ayarlar'da "Uyarlanabilir zorluk: Açık/Kapalı". Rekabetçi oyuncu kapatabilir.

### 2.7 Puanlama ve yıldızlar

Yıldız artık "kalan can" değil, **performans puanıyla** belirlenir:

```
playScore = 40·(başarı) + 20·(pas zamanlaması: kırılımda=1) + 15·(okuma: hedefin açıklığı) + 15·(YAC/hedef yard) + 10·(cep: baskı altında temiz)
★1: seviye bitti | ★2: ort. ≥ 70 ve ≤ 1 can kaybı | ★3: ort. ≥ 85 ve 0 can kaybı
```
`FG_CAREER.record` zaten pas istatistiklerini tutuyor. Scout puanı bu skorla beslenir, draft sırası daha anlamlı hale gelir.

### 2.8 Ezberlemeye karşı varyasyon

- Her play için 2–3 rota **ailesi** tanımlanır (ör. j=0: slant/corner **veya** stick/flat **veya** mesh). Seed `levelId*31 + attempt` olduğu için tekrar denemede farklı bir aile gelir, ama aynı deneme deterministik kalır (test edilebilirlik).
- Coordinator L4+'da oyuncunun favori receiver'ına bracket (çift koruma) uygular. Ekranda "WR1'e çift koruma!" ipucu gösterilir; adil uyarı + yeni bir okuma.

### 2.9 Ölçüm ve doğrulama

- **Bot tabanlı denge testi**: `tests/gameplay.cjs` zaten başsız (headless) simülasyon yapıyor. Üç bot profili eklenir:
  `novice` (rastgele hedef, geç atış), `average` (açık receiver'ı 1,5 sn'de atar), `expert` (kırılımda en açık hedef). Her seviye için 500 simülasyon → başarı oranları 2.2'deki hedef tablosuyla **±%7** içinde olmalı. Aksi halde CI kırmızı.
- **Telemetri (yerel, anonim)**: `level, play, result, timeToThrow, pressure, targetOpenness, attempts`. Ayarlar'dan dışa aktarılabilir. Huni analizi ile seviye bazlı kopma noktaları izlenir.

---

## 3. Karakter Değişimi ve Paket Açılımı: Sinematik Standart

### 3.1 Neden stadyumdan geri kalıyor (kök nedenler)

| Bulgu | Konum |
|---|---|
| Önizleme, sahadaki ışık düzeninin aynısını kullanıyor (Hemisphere + 2 Directional), ama **ortam haritası, zemin ve temas gölgesi yok**. Arka plan şeffaf (`setClearColor(0,0)`), model boşlukta yüzüyor. | `gl3d-enhanced.js` `create`, `preview.js` `frame` |
| Kamera iki sabit nokta arasında **anlık** zıplıyor (`z>1.4 ? 2.6 : 5.4`). Yüz/kask geçişi kesme ile yapılıyor. | `preview.js` `frame` |
| Görünüm değişince modelde hiçbir tepki yok, malzemeler yalnızca `color.set` ile değişiyor. Sadece A-pose ve dönme var. | `ui.js` `refreshCreator`, `gl3d-enhanced.js` `applyLook` |
| 30 FPS sınırı, dönen modelde takılma hissi veriyor. | `preview.js` `if(t-(v.lastFrame||0)<1/30)return;` |
| Paket: 2D CSS `rotateY` çevirmesi, 650 ms'lik düz bir mühür kutusu. Epic/Legend parlaması **sonradan eklenen bir kuralla kapatılmış**: `style.css:303` → `.card.glow .back{animation:none;…}` | `ui.js` `openPack`, `style.css:274-303` |
| Rarity farkı yalnızca çerçeve rengi. Beklenti (anticipation) inşası yok. | `ui.js` `openPack` |

### 3.2 Altyapı: "Studio" sahnesi (paylaşılan renderer)

B7 çözümüyle birlikte tek bir `WebGLRenderer` ve iki sahne kurulur: `stadiumScene` ve `studioScene`. Studio, stadyumun ışık dilini ve renk sıcaklığını bilinçli olarak devralır:

- **Ortam aydınlatması (IBL):** Harici HDR dosyası kullanılmaz (paket çevrimdışı). `PMREMGenerator.fromScene()` ile prosedürel bir "soyunma odası" ortamı üretilir: koyu bir küp, tavanda 3 emissive şerit, bir yanda takım renginde bir emissive panel. `scene.environment` olarak atanır, sonra `MeshStandardMaterial` kask ve yüzeylerde gerçek yansıma verir.
- **Üç nokta ışık:** Key (5600K, sol üst, `SpotLight` + yumuşak `penumbra:.6`), Fill (ambiyans %35), **Rim** (takım ikincil rengi, arkadan). Kask silueti ayrışır. Rim rengi `homeKit.trim` değerinden gelir.
- **Zemin:** Kauçuk soyunma odası zemini. `ShadowMaterial` + tek bir 1024² gölge haritası, yalnızca karakter için (`shadow.camera` 2×2 m frustum). Mobilde düşük kalite modunda blob gölge kullanılır.
- **Arka plan:** Bulanık dolap/locker silüeti. Sahne derinliğiyle uyumlu bir **sahte DOF** (önceden bulanıklaştırılmış canvas dokulu bir düzlem); pahalı post-process gerekmez.
- **Renk yönetimi:** Stadyumla aynı `ACESFilmic` ve exposure. `outputColorSpace` sabit. Aşamaya göre (camp/college/pro) LUT benzeri bir renk sıcaklığı preset'i uygulanır: karakter ekranı, oyuncunun kariyer aşamasıyla aynı atmosferi taşır.

### 3.3 Kamera sistemi (karakter oluşturma ve soyunma odası)

Kategori → çekim tablosu. Geçişler **kritik sönümlü yay (critically damped spring)** ile yapılır; kesme yok.

| Seçim | Çekim | Hedef | FOV | Süre |
|---|---|---|---|---|
| Genel / Fizik | Tam boy, hafif alttan (kahraman açısı) | pelvis | 32° | 600 ms |
| Yüz, saç, sakal, göz boyası | Yakın plan, kask çıkar | baş | 22° | 500 ms |
| Kask, facemask, visor | Omuz üstü, 3/4 açı | kask | 26° | 500 ms |
| Eldiven, bileklik, kolluk, bilek koçu | Atış eli yakın, karakter topu kavrar | el kemiği | 24° | 450 ms |
| Krampon, çorap | Alçak açı, ayak | ayak | 28° | 450 ms |
| Forma, numara | Sırt dönük, numara okunur | gövde | 30° | 600 ms |

```js
// Kritik sönümlü yay (kare hızından bağımsız)
function spring(cur,vel,target,omega,dt){ const x=omega*dt, e=1/(1+x+.48*x*x+.235*x*x*x);
  const ch=cur-target, tmp=(vel+omega*ch)*dt; vel=(vel-omega*tmp)*e; return [target+(ch+tmp)*e, vel]; }
```

### 3.4 Karakter "canlılığı" (mikro animasyonlar)

- **Idle**: Nefes (göğüs ölçeği ±%1,5, 0,25 Hz), ağırlık aktarımı, 4–7 sn'de bir rastgele kask ayarı ya da eldiven çekme.
- **Equip tepkisi**: Öğe değiştiğinde ilgili bölgede 250 ms'lik animasyon (kask takma, eldiven bileği çekme, kramponu yere vurma) + rarity rengiyle yayılan bir **fresnel parıltısı**:
```js
mat.onBeforeCompile=s=>{ s.uniforms.uGlow={value:0}; s.uniforms.uGlowColor={value:new THREE.Color()};
  s.fragmentShader=s.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
   float fr=pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);
   gl_FragColor.rgb+=uGlowColor*fr*uGlow;`).replace('void main() {','uniform float uGlow;uniform vec3 uGlowColor;\nvoid main() {');
  mat.userData.glow=s.uniforms; };
// uGlow: 0→1→0, 450 ms, easeOutCubic
```
- **Göz/baş takibi**: Baş kemiği, yumuşak bir look-at (±25° sınırlı) ile parmağın ya da imlecin konumuna döner.
- **Önizleme kare hızı**: 30 FPS sınırı kaldırılır, `requestAnimationFrame` hızında çizilir. Performans korumak için yalnızca **görünür ve değişen** karelerde render edilir (dirty flag + idle animasyon 30 FPS, kamera hareketi 60 FPS).

### 3.5 Paket açılımı: 5 aşamalı sinematik akış

Sonuç zaten animasyondan **önce** belirleniyor (`S.openPack`); bu adil ve doğru, korunur. Atla düğmesi her aşamada doğrudan son duruma gider.

| Aşama | Common/Rare | Epic | Legendary | İçerik |
|---|---|---|---|---|
| 1. Giriş | 0,6 sn | 0,8 sn | 1,0 sn | Kamera stadyum **tünelinden** (stadium.js'te tünel zaten var: `box(22,2.3,-74…)`) sahaya doğru dolly. Kalabalık sesi yükselir. |
| 2. Paket | 0,5 sn | 0,6 sn | 0,8 sn | 3D paket mesh'i (foil shader: anizotropik parlama + iridescence için `MeshPhysicalMaterial`). Oyuncu tutup çekerek yırtar; dokunma = otomatik. |
| 3. İpucu | 0,4 sn | 0,9 sn | 1,4 sn | Tünel ışıkları rarity rengine döner. **Kategori ipucu** (kask silüeti → renk → isim), FIFA "walkout" mantığında kademeli. |
| 4. Kartlar | 0,26 sn/kart | +0,45 sn | +0,9 sn + kamera sarsıntısı | 3D kart düzlemleri. Ön yüz `clearcoat`, epic+ için holografik `iridescence`. Arka yüzden ön yüze geçişte ışık süpürmesi. |
| 5. Sonuç | — | — | — | Kartlar sırayla karakterin üzerine "uçar". Karakter studio sahnesinde yeni eşyayla belirir (3.4'teki equip tepkisi). |

Uygulama notları:
- **Zaman çizelgesi motoru**: `setTimeout` zinciri yerine tek bir `Timeline` sınıfı (`add(at, dur, fn(t))`, `seek(end)`). Atla = `seek(end)`. Timeline'lar FSM'e bağlıdır; ekran değişince otomatik iptal olur (B1 sınıfı hataların tekrarını önler).
- **Ses katmanları**: Mevcut `FG_AUDIO` sentezine `riser` (rarity'ye göre perde yükselen bir sweep), `impact` ve `shimmer` eklenir. Legend'da kalabalık patlaması.
- **CSS düzeltmesi**: `style.css:303` içindeki `.card.glow .back{animation:none…}` kaldırılır. 3D kartlara geçilince CSS kart katmanı yalnızca WebGL kullanılamayan cihazlar için yedek olarak kalır.
- **Erişilebilirlik**: `prefers-reduced-motion` açıksa aşama 1 ve 3 atlanır, sarsıntı ve flaş kapatılır. Legend flaşı WCAG 2.3.1'e uyar (saniyede 3 flaştan az).

### 3.6 Kabul kriterleri

- Kamera geçişlerinin hiçbirinde kesme yok, tümü ≤ 600 ms.
- Orta segment Android'de (ör. Snapdragon 7xx) studio sahnesi ≥ 55 FPS, paket aşama 4 ≥ 45 FPS.
- Karakter ekranı ve stadyum ekran görüntüleri yan yana konduğunda aynı renk sıcaklığı, aynı kontrast ve aynı malzeme dilini taşımalı (art director onayı + Playwright görsel regresyon referansı).

---

## 4. Stadyum Atmosferi: Benchmark'a Dönüştürme

### 4.1 Korunacaklar

Saha dokusu (çim varyasyonu, yard/hash, numaralar), aşamaya göre büyüyen tribünler, instanced seyirci, sideline detayları (bench, görevli, kamera noktası, tünel, pano), pro aşamadaki gece sisi.

### 4.2 Düzeltilecek kusurlar

| Kusur | Konum | Çözüm |
|---|---|---|
| Seyirci **tek parça** halinde zıplıyor: tüm InstancedMesh'in `position.y`'si değişiyor. | `gl3d-enhanced.js` → `stadium.userData.crowd.position.y=Math.sin(...)` | Vertex shader içinde instance başına faz (aşağıda) |
| Her `box()` çağrısı yeni bir `BoxGeometry` ve ayrı bir mesh oluşturuyor. Pro stadyumda **yüzlerce draw call**. | `stadium.js` `box()` | Renge göre `InstancedMesh` batch'i (aşağıda) |
| Gökyüzü her aşamada aynı öğle mavisi (2D) | `engine.js` `drawSky` | Bölüm 5'teki aşama bazlı gökyüzü kubbesi |
| Oyuncu gölgeleri sabit opaklıkta daire | `gl3d-enhanced.js` `groundShadows` | Yüksek kalitede gerçek gölge, düşük kalitede ışığa göre yönlenen elips |

```js
// stadium.js: box() batch'leme (dönüş değeri hiçbir yerde kullanılmıyor, güvenli)
const unit=new T.BoxGeometry(1,1,1), batches=new Map(), tmp=new T.Object3D();
function box(x,y,z,w,h,d,c){ (batches.get(c)||batches.set(c,[]).get(c)).push([x,y,z,w,h,d]); }
function flush(){ for(const [c,list] of batches){ const im=new T.InstancedMesh(unit,material(c),list.length);
  list.forEach(([x,y,z,w,h,d],i)=>{ tmp.position.set(x,y,z); tmp.scale.set(w,h,d); tmp.updateMatrix(); im.setMatrixAt(i,tmp.matrix); });
  im.frustumCulled=false; g.add(im); } }
// create() sonunda: flush(); return g;
```
Beklenen etki: Pro stadyumda draw call sayısı yaklaşık renk sayısına iner (~25–40).

```js
// Seyirci: instance başına faz + olaya bağlı coşku (WebGL2: gl_InstanceID)
const crowdU={uTime:{value:0},uCheer:{value:0}};
crowd.material.onBeforeCompile=s=>{ Object.assign(s.uniforms,crowdU);
  s.vertexShader='uniform float uTime;uniform float uCheer;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float ph=fract(sin(float(gl_InstanceID)*12.9898)*43758.5453)*6.2831;
   float stand=step(.35,fract(ph*.37))*uCheer;                       // ~%65'i ayağa kalkar
   transformed.y+=max(0.,sin(uTime*(2.5+uCheer*6.)+ph))*(.03+stand*.25)+stand*.12;`); };
// render(): crowdU.uTime.value=opt.time; crowdU.uCheer.value=opt.cheer (E.cheer'ı render opt'una ekle)
```

### 4.3 Çevresel etkileşimler (benchmark katmanı)

| Etkileşim | Tetik | Teknik |
|---|---|---|
| **Kalabalık dalgası / ayağa kalkma** | Uzun pas havada, TD, 3rd down | `uCheer` + bölgesel maske (topun z'sine yakın tribünler önce kalkar) |
| **3rd down gürültüsü** | Son play (j=3) | Ses: kalabalık gürültüsü filtre frekansı ↑; görsel: tribünde takım renginde kart koreografisi (instance renkleri dalga hâlinde değişir) |
| **Flaşlar** | Gece (pro), uzun pas ve TD | Tribünde rastgele instance'larda 1 kare emissive (sprite pool, max 30) |
| **Sideline tepkisi** | TD / INT | Bench oyuncuları (zaten mesh) kollarını kaldırır; rakip bench'te başlar eğik |
| **Zincir ekibi** | First down hedefi | `fd` işaretine giden 3 görevli mesh'i; yeni hedefe yürür |
| **Çim izleri** | Sack, tackle, dalış | Saha dokusuna ayrı bir decal katmanı (`CanvasTexture`, en fazla 40 iz, play sonunda solar) |
| **Konfeti / şampiyonluk** | Glory Bowl | GPU parçacık (`Points`, 2000 adet, vertex shader ile fizik) |
| **Stadyum ışıkları** | Gece | Işık direklerinde additive billboard parlaması + hafif lens flare (ekran uzayı, kamera ışığa bakarken) |
| **Hava** | Aşama/seviye verisi | Kolej: altın saat havada asılı toz; Pro: hafif sis + yağmur seçeneği (`Points`, düşük kalitede kapalı) |

### 4.4 Çim shader'ı (en çok ekran alanı kaplayan yüzey)

`MeshStandardMaterial` korunur, `onBeforeCompile` ile:
- **Biçme şeritleri**: Kamera açısına göre değişen parlaklık (`dot(viewDir, stripeDir)`), gerçek stadyumdaki "iki ton yeşil" görünümünü verir.
- **Yakın mesafe detay**: Kameraya 15 m'den yakın bölgelerde ikinci bir döşemeli gürültü dokusu (karıştırma uzaklığa göre).
- **Kenar AO**: Sideline ve end zone çizgilerinde hafif koyulaşma.

### 4.5 Kalite kademeleri ve performans bütçesi

| Kademe | Gölge | Seyirci | Parçacık | Pixel ratio | Hedef |
|---|---|---|---|---|---|
| Düşük | Blob | Shader (statik) | 300 | 1.0 | 30 FPS |
| Orta | 1024² (sadece oyuncular) | Shader + coşku | 1000 | 1.25 | 60 FPS |
| Yüksek | 2048² + PCF soft | + kart koreografisi | 2000 | 1.5 | 60 FPS |

Otomatik seçim: İlk 120 karenin ortalama süresine göre kademe düşürülür. Ayarlar'dan elle seçilebilir.
Bütçe (orta kademe): draw call < 150, üçgen < 400k, GPU kare süresi < 10 ms.

### 4.6 "Benchmark" tanımı

Stadyumun referans olması için ölçülebilir bir standart belirlenir:
1. 6 sabit referans kamera açısı (snap öncesi, pas havada, TD, tribün yakın, tünel, gece genel). Playwright ile her sürümde ekran görüntüsü alınır ve görsel regresyon testi yapılır.
2. Diğer tüm sahneler (karakter, paket, harita) bu referanslardaki renk sıcaklığına, exposure'a ve malzeme diline göre onaylanır.

---

## 5. 2. Bölüm (Level 2) Görsel Revizyonu

### 5.1 Neden "tema dışı" görünüyor: üç kaynağın çatışması

Seviye 2, kariyerin **ilk kolej maçı** (`career.js`: `stage(2)='college'`). Görüntüyü üç farklı kaynak belirliyor ve her biri farklı bir hikâye anlatıyor:

| Katman | Ne söylüyor | Konum |
|---|---|---|
| Seviye verisi | Rakip **"Metro Wolves"**, mekân **"Şehir Işıkları"** (gece/şehir), forma **#3a3f5c + neon lila #b493ff** | `data.js` seviye 2 |
| Işık | `college` → **gün batımı** güneşi (`0xffd5a8`), ama `scene.background=null` ve sis yok | `gl3d-enhanced.js` `render` |
| Gökyüzü | Her aşamada aynı **öğle mavisi** degrade (`#5d8fc4 → #d9e7f2`) | `engine.js` `drawSky` |
| Saha | End zone'lar **seçilen okulun** rengiyle (turkuaz/bordo/lacivert) boyanıyor; zemin yazısı genel bir "COLLEGE FOOTBALL" | `stadium.js` |
| Tribün | Kampla aynı gri kutular, sadece 10 sıra. Kolej kimliğini taşıyan bir öğe yok. | `stadium.js` |
| Harita | Kolej bandı `#164a49` turkuaz, `opacity .7` ile çimi boğuyor | `map.js` `chapters` |

Sonuç: Turuncu gün batımı ışığıyla aydınlanmış oyuncular, öğle mavisi bir gökyüzü önünde, lila-neon rakip formasıyla ve turkuaz end zone'larla aynı karede duruyor. Renk sıcaklığı, günün saati ve mekân üçü birden çelişiyor. Pro aşaması (gece) tutarlı görünüyor, çünkü orada `scene.background` ve sis ayarlanmış ve 2D gökyüzünü örtüyor.

### 5.2 Konsept: "Kampüse Hoş Geldin: Homecoming, Altın Saat"

Seviye 2 duygusal bir eşik: Oyuncu okulunu yeni seçmiş ve ilk kez kendi formasıyla, kendi stadyumunda çıkıyor. Kamp (gündüz, sade) ile pro (gece, ışıklı) arasında **köprü** olacak bir atmosfer gerekiyor:

- **Zaman**: Altın saat (güneş yüksekliği ~12°, renk sıcaklığı ~3800K), maç ilerledikçe hafif kararır. Play 1 → play 4 boyunca güneş 12° → 6°'ye iner. Bölüm sonuna doğru ışıklar yanar ve pro gecesine bir ön izleme verir.
- **Mekân**: Kampüs içi **at nalı (U) kolej stadyumu**. Açık uçtan tuğla kampüs binaları ve saat kulesi görünür. Öğrenci tribünü, bando, homecoming pankartları.
- **Renk senaryosu**: Ana renk okulun forması (oyuncunun seçimi), destek renkleri sıcak tuğla (#9c4a32), krem taş (#e8dcc0), gökyüzü (#f6c48a → #6d8bb5). Rakip forması bu palete uyacak şekilde desatüre edilir.

### 5.3 Adım adım uygulama

**Adım 1: Aşama görünüm tablosu (tek doğruluk kaynağı)**

Işık, gökyüzü, sis, exposure ve harita renkleri artık 3 dosyaya dağılmaz, tek tabloda durur:

```js
// js/stage-look.js (yeni). gl3d-enhanced.js, engine.js ve map.js bunu okur
window.FG_LOOK={
  camp:   { sky:["#7fb2e0","#dceaf5"], sun:{color:0xfff0d9,int:2.8,elev:55}, amb:2.3, fog:null,                     exposure:1.15, mapTint:null },
  college:{ sky:["#6d8bb5","#f2b97c","#f9dcae"], sun:{color:0xffc690,int:3.1,elev:12,az:-60}, amb:1.7, ambSky:0xffd9b0, ambGround:0x4a3b2a,
            fog:{color:"#e8b88a",near:110,far:300}, exposure:1.05, rim:{color:0xffe2b8,int:1.1}, mapTint:"#7a4a2b" },
  combine:{ sky:["#9aa7b6","#dfe5ea"], sun:{color:0xf2f6ff,int:2.4,elev:60}, amb:2.4, fog:null,                     exposure:1.1,  mapTint:"#46566a" },
  pro:    { sky:["#0b1828","#1d3350"], sun:{color:0xdbeaff,int:1.5,elev:70}, amb:1.8, fog:{color:"#26374a",near:90,far:240}, exposure:1.0, mapTint:"#203750" }
};
```

**Adım 2: Gökyüzü uyuşmazlığını kökten çöz**
- `engine.js` `drawSky`: Sabit renkler yerine `FG_LOOK[stage].sky` degradesi kullanılır. WebGL yedek yolu (2D) için de doğru olur.
- WebGL yolunda 2D gökyüzü yerine **gökyüzü kubbesi** (ters normalli küre + degrade shader + güneş diski + yumuşak bulut gürültüsü) gelir. Güneş diskinin konumu `sun.elev/az` ile directional ışığın yönüyle **aynı vektörden** hesaplanır, böylece gölge yönü ile görülen güneş tutarlı olur.
```glsl
// sky.frag (özet)
uniform vec3 uTop,uMid,uHorizon,uSunDir,uSunColor; varying vec3 vDir;
void main(){ vec3 d=normalize(vDir); float h=d.y;
  vec3 c=mix(uHorizon,uMid,smoothstep(0.,.18,h)); c=mix(c,uTop,smoothstep(.18,.7,h));
  float s=max(dot(d,uSunDir),0.); c+=uSunColor*(pow(s,600.)*4.+pow(s,8.)*.35);   // disk + hale
  gl_FragColor=vec4(c,1.); }
```
- `scene.fog`, kolej için sıcak tonlu ve uzak (110–300 m) olur. Tribünleri atmosferik perspektifle oturtur.

**Adım 3: Kolej stadyumu geometrisi (`stadium.js` `college` dalı)**

| Öğe | Detay | Ölçü/metrik |
|---|---|---|
| U-bowl tribün | Uzun kenarlarda 14 sıra, kapalı uçta 12 sıra, bir uç **açık** | Sıra yüksekliği .62 m (mevcutla tutarlı) |
| Kampüs manzarası | Açık uçta tuğla binalar + saat kulesi (low-poly, tek InstancedMesh pencere ışıkları) | Sahaya 95–140 m; sisin içinde kalır |
| Öğrenci tribünü | Okul renklerinde yoğun seyirci, sürekli hareketli (`uCheer` tabanı .3) | Tribünün %20'si |
| Bando | End zone arkasında 6×8 grid, enstrüman parlaması | Instanced, 48 adet |
| Pankartlar | "HOMECOMING", okul adı, "WELCOME FRESHMEN" (CanvasTexture) | 4 adet |
| Işık direkleri | Söner durumda başlar, play 3'ten itibaren yanar (emissive 0 → 1) | Pro direkleriyle aynı mesh |
| Saha boyası | Orta saha: **seçilen okulun** monogramı. End zone'lar: okul adı (ev) / rakip adı (deplasman). Genel "COLLEGE FOOTBALL" yazısı kaldırılır. | Doku 1024×2048 korunur |

**Adım 4: Seviye verisi ve kimlik uyumu (`data.js` / `career.js`)**
- Seviye 2 rakibi: "Metro Wolves / Şehir Işıkları" yerine **"Riverside State Wolves"**, mekân **"[Okul] Stadyumu · Homecoming"** (mekân adı seçilen okuldan türetilir: `career.js` `D.levels` map'inde `venue` kolej için `school().name+' Stadyumu'` olur).
- Rakip forması: `#3a3f5c / #b493ff` → `#2f3a4a / #c9a46a` (gri-lacivert + eskitilmiş altın). Altın saat paletiyle uyumlu ve okul renklerinin hiçbiriyle çakışmıyor (CU turkuaz, NV bordo, MS lacivert-altın; MS için ikincil kit `#e9e2d0` beyaz deplasman forması).
- **Okunabilirlik kontrolü**: Ev ve rakip formalarının çime ve birbirine göre luminans kontrastı ≥ 3:1 olmalı. `tests/` altına otomatik bir test eklenir (WCAG göreli luminans formülüyle, tüm okul × rakip kombinasyonları için).

**Adım 5: Harita ile uyum (`map.js`)**
- Kolej bandının `#164a49` (opacity .7) katmanı kaldırılır. Yerine çimin üzerine **sıcak bir ton** (`mapTint` multiply, opacity .25) ve kenarlarda tuğla bina silüetleri gelir (mevcut kolej binası çizimi tuğla rengine çekilir).
- Seviye 2 düğümünün yanına küçük bir "HOMECOMING" bayrağı eklenir. Harita da hikâyeyi anlatır.

**Adım 6: Seviye tasarımı ve kamera metrikleri**
- Kolej sahası pro ile aynı ölçüde kalır (53,34 × 120 yd). Oynanış metrikleri değişmez, yalnızca çevre değişir. Bu sayede zorluk tablosu (Bölüm 2) görselden bağımsız ayarlanır.
- Kamera (`camCfg` career): Altın saat ışığı arkadan gelecek şekilde güneş azimutu **kameranın arkasına −60°** yerleştirilir. Oyuncu yüzleri aydınlık kalır, uzun gölgeler sahada derinlik çizgisi oluşturur ve receiver'ları okumayı kolaylaştırır.
- Görüş hattı: Snap öncesi kamerada ufuk çizgisi ekranın üst %22'sinde. Kampüs silüeti ve saat kulesi bu bantta görünür, böylece atmosfer HUD ile çakışmaz.

**Adım 7: Ses tasarımı**
- Bando teması (prosedürel: 3 notalı fanfar, `FG_AUDIO` osilatörleriyle), öğrenci tribününden tezahürat ve play 3'te ışıklar yanarken bir "kalabalık patlaması".

### 5.4 Kabul kriterleri (Level 2)

- [ ] Gökyüzündeki güneş diski, directional ışık yönü ve oyuncu gölgeleri aynı yönü gösteriyor.
- [ ] Ekrandaki baskın renk sıcaklığı 3500–4200K aralığında (referans ekran görüntüsünün ortalama renginden ölçülür).
- [ ] Ev/rakip forma kontrastı ≥ 3:1 (otomatik test).
- [ ] Haritadaki kolej bölümü, oyun içi kolej sahnesiyle aynı palet tokenlarını kullanıyor.
- [ ] Draw call < 150, orta segment Android'de ≥ 55 FPS.
- [ ] Art director'ın kamp → kolej → pro üç ekran görüntüsünü yan yana koyduğunda "tek oyun" algısı.

---

## 6. Yol Haritası

| Sprint | İçerik | Çıktı |
|---|---|---|
| **S1 (1 hafta)** | UI FSM + B1–B7, B9 düzeltmeleri, CSS geçişleri, Playwright E2E. `FG_DIFF` tablosu + oyun saati kuralı + nişan hata konisi + lead pursuit. | Kırılmayan seçim akışı, belirgin şekilde zorlaşan seviyeler 4–10 |
| **S2 (1,5 hafta)** | Savunma AI katmanları (ball-hawk, pattern-match, OL/DL), DDA, performans tabanlı yıldızlar, bot denge testi. `FG_LOOK` + gökyüzü kubbesi + Level 2 revizyonu. | Hedef başarı eğrisi CI'da doğrulanıyor, Level 2 tutarlı |
| **S3 (2 hafta)** | Paylaşılan renderer + Studio sahnesi + kamera yayları + equip tepkisi. Paket açılımının 5 aşaması. Stadyum batch'leme, seyirci shader'ı, çevresel etkileşimler, kalite kademeleri. | Sinematik karakter/paket deneyimi, ölçülebilir stadyum benchmark'ı |

### Riskler ve önlemler

| Risk | Önlem |
|---|---|
| Zorluk artışı, mevcut oyuncuların kayıtlarındaki ilerlemeyi zorlaştırabilir | Kayıt sürümü `v3`; mevcut yıldızlar korunur. Eski oyuncular için zorluk ön ayarı ilk açılışta sorulur. |
| Mobilde shader derleme takılması (onBeforeCompile) | Yükleme ekranında `renderer.compile(scene,camera)` ile ön ısıtma |
| WebGL1 cihazlarda `gl_InstanceID` yok | Instance fazı için `InstancedBufferAttribute` (aFaz) yedeği |
| Mevcut testlerin bağımlı olduğu iç API'ler (`G.phase`, `_simulate`) | `setPhase` geriye uyumlu; testler yeni bot profilleriyle genişletilir, mevcutlar korunur |
