# Mağaza Metinleri

Mağaza formlarına kopyala–yapıştır yapmak için hazırlanmış metinler.

## Ortak

**Ad:** Aralık Filtresi – sahibinden.com için

**Kısa açıklama** (Chrome özeti en fazla 132, AMO özeti en fazla 250 karakter):

> sahibinden.com konut aramasında bina yaşı, oda sayısı, kat sayısı ve bulunduğu katı tek tek işaretlemek yerine aralık olarak seç.

**Ana sayfa:** https://github.com/erincayaz/sahibinden-aralik-filtresi

**Destek:** https://github.com/erincayaz/sahibinden-aralik-filtresi/issues

**Gizlilik politikası:** https://github.com/erincayaz/sahibinden-aralik-filtresi/blob/main/PRIVACY.md

**Dil:** Türkçe

## Uzun açıklama

```
sahibinden.com'da ev ararken "5 ile 15 yaş arası, 2+1 veya 3+1, 3. ile 8. kat arası" gibi bir arama yapmak için onlarca kutucuğu tek tek işaretlemen gerekiyor. Bu eklenti her filtrenin üstüne bir başlangıç–bitiş seçici ekler; aralığı seç, "Aralığı uygula"ya bas, gerisini eklenti halletsin.

DESTEKLENEN FİLTRELER

• Bina Yaşı: 0, 1, 2 … 5, 6-10, 11-15 … 31+ arasında aralık. Başlangıç 0 seçilirse "Oturuma Hazır" ve "Yapım Aşamasında" ayrı ayrı seçilebilir.
• Oda Sayısı: Oda ve salon için ayrı aralık. Örneğin "Oda 2–3, Salon 1" → 2+1, 2.5+1, 3+1.
• Kat Sayısı: 1 … 30+ arasında aralık.
• Bulunduğu Kat: 0 ve altı, 1 … 30+ arasında aralık. Başlangıç "0 ve altı" seçilirse Kot, Bodrum, Zemin, Bahçe, Giriş ve Yüksek Giriş ayrı ayrı seçilebilir. Çatı Katı ayrı bir kutucukla dahil edilir veya çıkarılır.

ÖZELLİKLER

• Satılık ve kiralık tüm konut aramalarında çalışır.
• Birden fazla filtrede aralık seçip tek seferde uygulayabilirsin.
• Fiyat, m², konum gibi diğer filtrelerine dokunmaz.
• sahibinden'in kendi kutucuk listesi yerinde kalır, istersen elle seçmeye devam edebilirsin.
• Arama tamamen sahibinden'in kendi altyapısıyla yapılır; eklenti sadece seçimleri senin yerine işaretler.

GİZLİLİK

Hiçbir veri toplamaz, hiçbir sunucuya istek atmaz, izleme veya analitik içermez. Sadece sahibinden.com sayfalarında çalışır. Açık kaynak: https://github.com/erincayaz/sahibinden-aralik-filtresi

Bu eklenti sahibinden.com ile resmi bir bağlantısı olmayan bağımsız bir projedir.
```

## Chrome Web Store

**Kategori:** Alışveriş (Shopping)

**Tek amaç açıklaması (Single purpose):**

```
sahibinden.com konut arama sayfalarındaki bina yaşı, oda sayısı, kat sayısı ve bulunduğu kat filtrelerine, seçenekleri min–max aralığı olarak seçmeyi sağlayan bir arayüz ekler.
```

**İzin gerekçesi — Ana makine izni (https://www.sahibinden.com/*):**

```
Eklenti yalnızca sahibinden.com arama sayfalarında, filtre paneline aralık seçiciyi eklemek ve seçilen aralığa göre arama adresini oluşturmak için content script çalıştırır. Başka hiçbir siteye erişmez.
```

**Uzaktan kod kullanımı:** Hayır, uzaktan kod kullanmıyorum.

**Veri kullanımı:** Hiçbir kutucuğu işaretleme (kişisel bilgi, kimlik doğrulama, konum, web geçmişi, kullanıcı etkinliği, web sitesi içeriği vb. toplanmıyor). Alttaki üç beyanın üçünü de onayla:
- Kullanıcı verilerini onaylanan kullanım alanları dışında üçüncü taraflara satmıyorum/aktarmıyorum.
- Kullanıcı verilerini öğenin tek amacıyla ilgisi olmayan amaçlarla kullanmıyorum/aktarmıyorum.
- Kullanıcı verilerini kredibilite belirlemek veya borç verme amacıyla kullanmıyorum/aktarmıyorum.

**Görseller:**
- Mağaza ikonu: `icons/icon-128.png`
- Ekran görüntüsü (1280×800): `store/screenshot-1280x800.png`
- Küçük tanıtım görseli (440×280): `store/promo-440x280.png`

**Yüklenecek paket:** `dist/sahibinden-aralik-filtresi-<sürüm>-chrome.zip`

## Firefox Add-ons (AMO)

**Dağıtım:** On this site (addons.mozilla.org'da listelenir)

**Kategori:** Shopping

**Lisans:** MIT

**Kaynak kodu gönderimi:** Gerekmez. Kod derlenmemiş/küçültülmemiş, zip'teki dosyalar kaynakla birebir aynı.

**Gözden geçirenlere not (Notes to reviewer):**

```
No build step, no minification, no third-party libraries. The zip contains the source as-is (src/core.js, src/content.js, src/content.css). The extension only runs a content script on https://www.sahibinden.com/* that adds a min–max range picker to four search filters and navigates to the site's own search URL with the selected values. No network requests, no data collection. Source: https://github.com/erincayaz/sahibinden-aralik-filtresi
```

**Görseller:** `store/screenshot-1280x800.png`

**Yüklenecek paket:** `dist/sahibinden-aralik-filtresi-<sürüm>-firefox.zip`
