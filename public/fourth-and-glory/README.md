# Fourth & Glory — Road to Glory v0.8

Amerikan futbolu kariyer prototipi. QB oynanışı ana oyundur; ayrı bir QB modu yoktur. Mevcut 10 düğümlü harita, navigasyon, paketler, soyunma odası ve ilerleme düzeni korunur. Oynanış ve kariyer bunların içine eklenir.

## v0.8'de neler değişti

Ayrıntılı gerekçe ve ölçümler: depo kökündeki `docs/fourth-and-glory/IYILESTIRME_PLANI.md`.

- **Seçim ekranı ve menüler:** `js/ui-state.js` tek aktif ekranı, açık katman yığınını ve ekrana bağlı zamanlayıcıları yönetir. Seviye sonucu anında kaydedilir; kart gösterimi iptal edilebilir. Kariyer kapısı her zaman haritada açılır. Önizlemeler tek WebGL bağlamını paylaşır. Karakter sekmeleri telefon boyutunda artık tıklanabilir. Esc en üstteki katmanı kapatır.
- **Zorluk:** Eski sürümde play'ler tamamen deterministikti; başarısız bir play birebir aynı haliyle tekrar ediliyor ve ezberlenebiliyordu. `js/difficulty.js` seviye bazlı veri tablosu, Rookie/Pro/All-Pro/Glory ön ayarları ve ±%8 bantlı uyarlanabilir zorluk içerir. Tekrar denemelerde rota varyantı değişir. Paslarda isabet konisi, çekişmeli yakalama ve görüş mesafesine bağlı topa kırılma vardır. Oyun saati uygulanır ve play başına bir kez top dışarı atılabilir. Favori hedefe çift koruma uygulanır, takipte önden kesme ve juke vardır. Yıldızlar performans puanından gelir.
- **Görünüm:** `js/stage-look.js`, aşama başına gökyüzü, güneş, sis, pozlama ve harita tonunu tek kaynaktan verir. Gökyüzü kubbesindeki güneş, ışığın yönüyle aynıdır. Forma çakışmasında rakip beyaz forma giyer.
- **Seviye 2 (Homecoming):** Altın saatte at nalı kolej stadyumu, açık uçta tuğla kampüs ve saat kulesi var. Orta sahada okul monogramı, öğrenci tribünü kart gösterisi, bando ve pankartlar bulunuyor. Işıklar 3. play'de yanar.
- **Stadyum:** Statik kutular renk başına tek InstancedMesh'tir. Seyirci ve bench, instance başına shader animasyonuyla topa ve olaylara tepki verir. Gece flaşları, projektör parlaması, zincir ekibi, çim izleri, şampiyonluk konfetisi ve görüş açısına bağlı çim şeritleri eklendi. Kalite ayarı Otomatik/Düşük/Orta/Yüksek'tir; Yüksek'te gerçek gölge vardır.
- **Karakter ve paketler:** Kamera çekimleri sekmeye ve kategoriye göre yaylı geçişle değişir. Stüdyo ışığı, ortam yansıması ve zemin gölgesi eklendi. Eşya takılınca nadirlik renginde parıltı ve kısa bir jest oynar. Paket açılımı 5 aşamalıdır; "Atla" her an sonuca gider.

## Başlatma

ZIP'i tamamen çıkarın. `index.html` tarayıcıda açılabilir. Tavsiye edilen yerel sunucu:

```sh
python -m http.server 8080
```

Bilgisayar: `http://localhost:8080`. Aynı ağdaki telefon: `http://BILGISAYARIN-YEREL-IP-ADRESI:8080`. HTTPS/localhost üzerinde çevrimdışı önbellek etkinleşir. Three.js ve tüm kaynaklar pakettedir; CDN, ücretli model, hesap ya da API anahtarı gerekmez.

## Kontroller

1. Haritada açık seviyeyi seç, görev kartını oku, BAŞLA'ya bas.
2. Snap öncesi rotalara bak; receiver seçebilirsin. SNAP ile oyunu başlat.
3. Receiver düğmesine veya oyuncuya dokunarak hedefi değiştir. PAS AT'a kısa basış normal, uzun basış daha güçlü pas verir. Bullet/Touch/Lob farklı uçuş süreleri ve yaylar sağlar.
4. Sahada kaydırarak seçili receiver'ın önüne küçük yön düzeltmesi yapabilirsin. Kaydırırken zaman yavaşlar; basit düğme kontrolünde ayrıca çizgi çizmek gerekmez.
5. Soldaki kontrol QB'yi hareket ettirir. Hücum çizgisini geçersen pas seçeneği kapanır, QB koşusuna geçilir.
6. Receiver yakalayınca kontrol ona geçer. Kontrolü bırakırsan ileri koşar; yön vererek savunmadan uzaklaş. Kısa görevlerde hedef mesafe geçildikten sonra kısa koşuyla oyun tamamlanır. TD görevlerinde end zone gerekir.
7. Bilgisayarda WASD/oklar: hareket. 1–5: receiver seçimi. Boşluk: snap/pas. Esc: duraklat / katmanı kapat. Ekrandaki duraklatma düğmesi oyunu dondurur.
8. TOPU AT DIŞARI: Cep çökerken play başına bir kez kullanılır. Can kaybı olmaz, play yeni bir varyantla tekrarlanır, performans puanı düşer.
9. Sağ üstteki saat dolarsa (Seviye 3'ten itibaren) savunma QB'ye ulaşır. Ayarlar → Zorluk ve Uyarlanabilir zorluk ile seviye ayarlanabilir.

## Kariyer

| Seviye | Kariyer olayı |
|---|---|
| 1 | Kamp, 3 receiver, kolay savunma, uzun cep koruması |
| 2 | Üniversite seçimi, 4 pas seçeneği |
| 3–4 | Forma mücadelesi, derbi, man/zone okumaları |
| 5–6 | Playoff ve üniversite finali, gizli baskılar, 5 pas seçeneğine geçiş |
| 7 | Combine görevleri ve scout değerlendirmesi |
| 8 | Performansa uygun profesyonel takım tercihi, çaylak dönemi |
| 9–10 | Playoff ve Glory Bowl |

Her seviyede dört QB görevi ve üç can vardır. Görevler bitmeden sıradaki seviye açılmaz. Kalan can yıldızı belirler. Üç yıldız zorunlu değildir. Haritanın çevresi kamp, üniversite, combine ve profesyonel bölüm arasında değişir; menülerin konumu aynı kalır.

Üniversiteler farklı koç güveni, yakalama desteği ve cep koruma süresi sunar. Scout ilgisi yıldız, pas yüzdesi, yard, TD, interception ve sack sonuçlarına bağlıdır. Draft turu, sıra tahmini ve temsilî kontrat bu puandan hesaplanır. Takımlar ve üniversiteler kurgusaldır; resmi NFL/NCAA lisansı kullanılmaz.

Oyuncu kartında takım, rol, QB OVR, pas yardı, TD, isabet, INT, QB rating, koşu yardı, koç güveni, scout ilgisi, sezon programı ve geçmiş bulunur. İstatistikler her seviyenin ilk başarılı tamamlanışını, o denemedeki başarısız play'ler dahil, kaydeder. Tekrar oynayarak scout/istatistik biriktirilmez.

## Oynanışın içi

11 hücum ve 11 savunma oyuncusu vardır. Başlangıçta 3, ileride 4 ve 5 eligible receiver kullanılır. Boş kalan hücum oyuncuları blok dizilişindedir. Slant, corner, out, post, go, curl, flat, wheel ve crossing rotaları kademeli devreye girer.

Man/Cover 1, iki/üç/dört derin alan sorumluluğu ve blitz davranışları bulunur. İleri görevlerde snap öncesi safety dizilişi gerçek sorumluluğu gizler; snap sonrasında alanına döner. Savunma topa, receiver'a ve QB hareketine tepki verir. OL blokları zaman kazandırır; rush oyuncuları çevresinden çıkar ve temasla sack üretir. Topun yüksekliğine göre pas savuşması veya interception oluşur. Bu sistem tam bir profesyonel futbol simülasyonu değil, kısa mobil görevler için sadeleştirilmiş savunma modelidir.

Paslar balistik uçuş kullanır. Hareketli hedefin ilerideki konumu hesaplanır. Kol gücü, kısa/orta/uzun isabet, hareketli pas, cep farkındalığı, clutch ve release speed oynanışa etki eder. Koşu hızı ve çeviklik hareketi etkiler. Başlangıç yardımı giderek azalır. Riskli pas ve baskı geri bildirimi kısa süre görünür.

## Karakter, ekipman ve paketler

Aynı kariyer karakteri korunur. Dengeli, pocket, strong arm, mobile ve improviser gelişim tarzları başlangıç özelliklerini değiştirir; oyun modu değildir.

Yüz oranı, ten, saç/sakal, boy/kilo, el tercihi, pas stili ve duruş düzenlenebilir. Forma, pantolon, çorap, kask, facemask, visor, eldiven, kolluk, bileklik, havlu, dişlik, göz boyası, sırt plakası, krampon ve QB bilek koçu kategorileri vardır. Kozmetikler oynanış gücü vermez; DP özellik geliştirmeye harcanır.

Modelin iskeleti ve geometrisi seçenek değişince yeniden oluşturulmaz. Mevcut malzemeler, ölçekler ve önceden oluşturulmuş aksesuarların görünürlüğü güncellenir. Forma numarası dokuları önbellektedir. Önizleme en fazla yaklaşık 30 kare/saniye güncellenir; gizli tuvallere çizim yapılmaz. Bu bir performans tasarımıdır, her telefonda 30/60 FPS garantisi değildir.

Common/Rare/Elite/Legend paketleri mevcut ekonomiyi kullanır. Açılım kısa mühür geçişi, kart dönüşü ve rarity çerçeveleri içerir; Atla düğmesiyle hemen sonuç görülebilir. Ekipman tekrarında cash, seviyelerde DP kazanılır. Aynı yıldızla tekrar seviye bitirmek yeni DP/paket üretmez.

## Stadyum

WebGL'de saha, goalpost, tribün, seyirci, sideline ve oyuncular aynı 3D kamerayı paylaşır. Çim varyasyonu, yard/hash çizgileri, end zone, midfield işareti, pylon, bench, ekipman, görevliler, hakem temsilleri, kamera noktaları, tünel ve panolar eklenmiştir. Kalabalık instancing kullanır; binlerce ayrı animasyonlu karakter üretilmez. Kamp küçüktür; üniversite daha büyük ve sıcak ışıklı, pro stadyumu gece aydınlatmalıdır. Üretilmiş seyirci/temas/ayak/top sesleri harici ses dosyası istemez.

Görseller prosedüreldir. Gerçek sporcu taraması, gerçek seyirci fotoğrafı, gerçek seslendirilmiş spiker, volumetrik ışık, yağmur fiziği ve uzun tünel sinematiği bu pakette yoktur. Gölgeler mobil maliyetini sınırlamak için basitleştirilmiştir. WebGL yoksa eski Canvas yedek çizici kullanılır.

## Antrenman ve kayıt

Eski 41 karma görev, Oyuncum → Serbest antrenman içindedir. Vuruş, koşu, tackle, dalış ve hedef görevleri buradadır; ana kariyer ayrılmaz. Antrenmanlar kariyer istatistiği/ödülü vermez.

`fourth_glory_career_v2` kaydı korunur. v0.4/v0.5 oyuncusu, ekipmanı, para, DP, yıldızları ve açık seviyeleri silinmez. Yeni QB özellikleri eksikse 58 ile eklenir. Eski pozisyon QB kariyerine uyarlanır; eski pozisyon kariyer verisinde saklanır. Üniversite/pro tercihleri eksikse ilgili bölüme ilk girişte sorulur. Eski performans verisi olmadığı için yeni istatistikler sıfırdan başlar. Önceki kök beta `fourth-glory-v1` için oyuncu/para/DP aktarımı desteklenir, farklı görev haritası birebir aktarılmaz.

Ayarlar → Kaydı dışa aktar / içe aktar ile JSON yedeği alınabilir. Tarayıcı veya site adresi değişirse bu yedeği kullanın. Hatalı içe aktarma mevcut kaydı değiştirmez.

## Kaynaklar ve testler

- `js/data.js`: özgün görevler, ekipman, stat ve başlangıç build'leri.
- `js/career.js`: 40 görev, kariyer kararları, performans ve takımlar.
- `js/game.js`: fizik, receiver rotaları, savunma, kontrol ve play akışı.
- `js/state.js`: kayıt, doğrulama, envanter, ekonomi.
- `js/ui.js`, `js/career-ui.js`, `js/map.js`: mevcut ekranlar ve eklenen kariyer bileşenleri.
- `js/stadium.js`, `js/gl3d-enhanced.js`, `js/engine.js`: ortak 3D saha ve yedek çizici.
- `js/athlete-model.js`, `js/athlete-game.js`, `js/preview.js`: iskeletli model ve önizleme.
- `js/ui-state.js`, `js/difficulty.js`, `js/stage-look.js`: UI durum makinesi, zorluk tablosu + DDA, aşama görünümü.
- `tests/`: Node ile çalışan testler; `e2e.mjs` dışındakiler harici npm kurulumu gerektirmez.

```sh
node tests/gameplay.cjs
node tests/career.cjs
node tests/models.cjs
node tests/ui.cjs
node tests/contrast.cjs     # forma kontrastı ve kolej görünümü
node tests/balance.cjs      # bot tabanlı zorluk eğrisi (~4–5 dk); --report yalnızca tabloyu yazar
node tests/e2e.mjs          # gerçek Chromium: UI zamanlama/durum hataları (playwright gerekir)
```

Testler mantık, kayıt, model değişimi ve arayüz olaylarını kontrol eder. Gerçek GPU görüntüsü ve iOS/Android dokunmatik performansı bu ortamda ölçülmemiştir. Detaylar `TEST_SONUCLARI.txt` içindedir.

Tüm oyun kaynakları düzenlenebilir olarak dahildir. Three.js lisansı `vendor/LICENSE-three.txt` içindedir. Kullanılan sporcu ve stadyum geometrisi bu proje için kodla üretilmiştir.
