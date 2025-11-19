# Denizcilik VHF Telsiz İzleme ve Donanım Kurulumu (RTL-SDR)

## Genel Bakış
Denizcilik amaçlı **VHF bandı** (marine VHF), uluslararası standartlarda **156-174 MHz** aralığında yer alır. Gemi-gemi, gemi-kıyı iletişimi ve acil durum çağrıları için kullanılır. En kritik frekans, **Kanal 16 (156.800 MHz)** acil durum kanalıdır.

**RTL-SDR (Software Defined Radio)** cihazları, bu frekans aralığını kapsayarak düşük maliyetli ve etkili bir **sadece-dinleme (receive-only)** çözümü sunar. Ada ekosisteminde `ada.vhf` node'unun fiziksel dünyadaki kulakları bu donanım üzerine kuruludur.

---

## 🛠️ Donanım Kurulumu

### 1. RTL-SDR Dongle
*   **Önerilen Model:** RTL-SDR Blog V3 veya V4.
*   **Neden:** TCXO kristalli olduğu için frekans kayması (drift) yapmaz, ısınınca kararlı çalışır. Standart ucuz dongle'lar ısınınca frekans kaçırabilir.

### 2. Anten Seçimi
Stok gelen küçük antenler deniz bandı (156 MHz) için yetersizdir.
*   **En İyi Seçenek:** Marin tip **1/4 dalga** veya **5/8 dalga** dikey anten.
    *   *Örnek:* Sirio GP 160, Diamond NR-770.
*   **Alternatif (DIY):** 48 cm uzunluğunda tel ile yapılan 1/4 dalga Ground Plane anten.

### 3. Kablolama
*   **Kablo:** Düşük kayıplı RG-58 veya RG-213 koaksiyel kablo.
*   **Konnektör:** Genelde SMA (Dongle tarafı) ve N-Tip veya SO-239 (Anten tarafı).

### 4. LNA (Opsiyonel)
*   Sinyal zayıfsa, RTL-SDR Blog Wideband LNA veya özel Marine VHF LNA kullanılabilir. (Bias-Tee özelliği ile dongle üzerinden güç alır).

---

## 💻 Yazılım Kurulumu

### Windows
*   **SDR# (SDRSharp):** En popüler araç.
*   **Ayar:** Modülasyonu **NFM** (Narrow FM) olarak seçin. Bant genişliğini 12.5 kHz veya 25 kHz yapın.
*   **Eklenti:** "Frequency Manager Suite" kurarak aşağıdaki kanal listesini kaydedin.

### Linux / Mac (Raspberry Pi - Ada Node)
*   **GQRX:** Grafik arayüz için.
*   **rtl_fm:** Komut satırı üzerinden ses akışı almak için (Ada'nın otomasyonu için ideal).
*   **AIS-catcher:** AIS verilerini haritaya dökmek için.

---

## 📡 Türkiye Deniz VHF Frekans Tablosu

Aşağıdaki kanallar Türkiye kıyılarında aktif olarak kullanılmaktadır:

| Kanal | Frekans (MHz) | Kullanım Amacı | Tip |
| :--- | :--- | :--- | :--- |
| **16** | **156.800** | **ACİL DURUM, TEHLİKE ve ÇAĞRI** (Sürekli Dinlenmeli) | Simplex |
| **73** | **156.675** | **Marina Operasyonları** (WIM, Setur vb.) | Simplex |
| **72** | **156.625** | Gemi-Gemi İletişimi (Yatçılar arası popüler) | Simplex |
| **09** | 156.450 | Balıkçılar, Gemi-Gemi, Arama Kurtarma | Simplex |
| **06** | 156.300 | Arama Kurtarma (Hava-Deniz işbirliği) | Simplex |
| **08** | 156.400 | Sahil Güvenlik (Genelde şifreli/dijital olabilir) | Simplex |
| **67** | 156.375 | Meteoroloji ve Seyir Duyuruları (Türk Radyo) | Simplex |
| **70** | 156.525 | DSC (Dijital Seçmeli Çağrı - *Ses yok*) | Dijital |

---

## 🤖 Ek Özellikler (AIS & DSC)

### AIS (Otomatik Tanımlama Sistemi)
Gemilerin haritadaki yerini görmek için:
*   **Frekanslar:** 161.975 MHz ve 162.025 MHz.
*   **Yazılım:** `AIS-catcher` veya `aisdeco2`.
*   **Ada Entegrasyonu:** `ada.sea` node'ları bu veriyi işleyerek "Fleet Map" oluşturur.

### DSC (Dijital Seçmeli Çağrı)
*   **Frekans:** 156.525 MHz (Kanal 70).
*   **Yazılım:** `YAND` veya `Multipsk`.
*   Acil durum sinyallerini dijital olarak yakalar.

---

## ⚠️ Yasal Uyarı
RTL-SDR ile deniz VHF yayınlarını dinlemek (amatör/kıyı emniyeti amaçlı) yasaldır. Ancak:
1.  Özel konuşmaları kaydetmek ve izinsiz yayınlamak (KVKK) suçtur.
2.  Bu cihazlarla **YAYIN YAPILAMAZ**. Sadece alıcıdır.

*Doküman Tarihi: 2024 - Ada Maritime Docs*