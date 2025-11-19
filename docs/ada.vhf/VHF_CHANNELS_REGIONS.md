# Bölgesel Marina & Liman Kanal Listesi ve Otomasyon Protokolleri

**Tarih:** 18 Kasım 2025  
**Durum:** Güncel  
**Standart:** IMO SMCP (Standard Marine Communication Phrases) Uyumlu

Bu belge, Ada ekosistemindeki otonom gemi node'larının (`ada.sea.*`) coğrafi konuma göre hangi VHF kanalını dinlemesi gerektiğini ve marina çağrılarına nasıl otomatik cevap vereceğini tanımlar.

---

## 📍 Bölgesel Kanal Listesi (Geo-Fencing)

Ada node'ları, GPS konumlarına göre aşağıdaki öncelik sırasına sahip kanalları otomatik olarak "Primary Watch" (Birincil İzleme) kanalına alır.

| Öncelik | Bölge | Kanal | Frekans (MHz) | Tipik Kullanıcılar |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Marmara** | **73** | 156.675 | Ataköy, Kalamış, Setur Fenerbahçe, Viaport, Pendik |
| **2** | **İstanbul Boğazı** | **12** | 156.600 | VTS İstanbul, Boğaz Trafik |
| **3** | **Çanakkale** | **73** | 156.675 | Çanakkale Marina, Kepez Limanı |
| **4** | **Kuzey Ege** | **74** | 156.725 | Ayvalık, Dikili, Foça, Kuşadası |
| **5** | **Orta Ege** | **72** | 156.625 | Çeşme, Alaçatı Port, Sığacık, Didim D-Marin |
| **6** | **Güney Ege** | **71** | 156.600 | Bodrum (tüm marinalar), Yalıkavak Palmarina, Turgutreis |
| **7** | **Göcek – Fethiye** | **72** | 156.625 | Skopea Liman, Göcek (D-Marin, Marinturk), Fethiye |
| **8** | **Marmaris** | **74** | 156.725 | Netsel, Yacht Marin, Albatros |
| **9** | **Yunan Adaları (Kuzey)** | **71** | 156.600 | Mykonos, Paros, Naxos, Kos, Rhodes (Mandraki) |
| **10** | **Yunan Adaları (Güney)** | **09** | 156.450 | Santorini, Crete (Birçok ada 09 kullanır) |

> **Not:** Kanal 16 (156.800 MHz) bölge fark etmeksizin her zaman arka planda "Dual Watch" modunda izlenir.

---

## 🤖 Otomatik Çalışma Mantığı

`ada.vhf` node'u aşağıdaki mantıksal akışı izler:

1.  **Konum Belirleme:** Cihaz açıldığında veya saat başı GPS konumunu kontrol eder.
2.  **Kanal Seçimi:** Tablodan en yakın bölgeyi belirler ve RTL-SDR'ı o bölgenin marina kanalına (örn. Marmara için Ch 73) kilitler.
3.  **Sürekli Dinleme:**
    *   Sinyal algılandığında **OpenAI Whisper API** devreye girer.
    *   Ses, gerçek zamanlı olarak metne dökülür (STT).
4.  **Tetikleyici (Trigger) Algılama:**
    *   Eğer metin içinde **"ADA SEA"** veya geminin kendi adı (örn. **"PHISEDELIA"**) geçerse sistem uyanır.
5.  **Cevap Verme:**
    *   LLM, bağlamı analiz eder.
    *   1-2 saniye içinde PTT (Push-to-Talk) tetiklenir.
    *   Aşağıdaki SMCP standartlarına uygun cevap, TTS (Text-to-Speech) ile yayınlanır.
6.  **Loglama:** Tüm konuşma OLED ekrana yazılır ve `ada.orchestrator` veritabanına kaydedilir.

---

## 🗣️ Örnek Otomatik Cevaplar (SMCP + Türkiye Pratiği)

Sistem, Türkçe ve İngilizce çağrıları otomatik ayırt eder ve aynı dilde yanıt verir.

### Senaryo 1: Marina Çağrısı
**Marina:** "Ada Sea, Kalamış Marina."
**Ada (TR):** "Kalamış Marina, burada Ada Sea, kanal 73, dinlemede."
**Ada (EN):** "Kalamış Marina, this is Ada Sea, standing by channel 73."

### Senaryo 2: Palamar / Yer Bilgisi İsteme
**Marina:** "Ada Sea, berth assignment?"
**Ada (TR):** "Ada Sea, giriş için berth bilgisi rica ediyorum."
**Ada (EN):** "Ada Sea, requesting berth assignment."

### Senaryo 3: Yere Yanaşma Talimatı
**Marina:** "Ada Sea, proceed to C-12."
**Ada (TR):** "Anlaşıldı, C-12’ye ilerliyorum, palamar ekibi rica ediyorum."
**Ada (EN):** "Understood, proceeding to C-12, requesting linesmen."

### Senaryo 4: Liman Çıkış İzni
**Gemi:** "Ada Sea, departure clearance?"
**Ada (TR):** "Ada Sea, çıkış onayı rica ediyorum."
**Ada (EN):** "Ada Sea, requesting departure clearance."

### Senaryo 5: İşlem Tamam
**Marina:** "Ada Sea, you are cleared."
**Ada (TR):** "Onay için teşekkürler, iyi çalışmalar."
**Ada (EN):** "Clearance acknowledged, thank you, good watch."

### Senaryo 6: Yunanistan Liman Girişi
**Gemi:** "Mandraki port control, this is sailing yacht Ada Sea on channel 71, requesting berthing instructions."
*(Not: Yunan sularında İngilizce standarttır)*