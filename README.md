# ⚡ TTBar

<p align="center">
  <b>Windows için Şimşek Hızında Nostaljik Dosya ve Uygulama Başlatıcı</b><br>
  <sub>A Lightning-Fast Nostalgic App & File Launcher for Windows</sub>
</p>

<p align="center">
  <img src="src/assets/retro_magnifier.png" width="100" alt="TTBar Logo">
</p>

---

## 📖 Proje Hakkında / About the Project

**TTBar**, Windows 10/11 işletim sistemlerinde kullanılmak üzere tasarlanmış, klavye odaklı, minimalist ve nostaljik esintiler taşıyan şimşek hızında bir dosya, klasör ve uygulama başlatıcıdır (Spotlight / Alfred alternatifi). 

Görsel olarak 2000'lerin sonundaki (**Windows XP ve Windows 7 Explorer**) ikonik arama çizgilerinden esinlenirken; arka planda **Rust** ve **Tauri v2** teknolojisiyle en modern ve yüksek performanslı mimariyi kullanır.

---

## ✨ Özellikler / Features

- ⌨️ **Global Kısayol (`Alt + Space`):** Bilgisayarın neresinde olursanız olun kısayola bastığınız an arama çubuğu ekrana gelir. Tekrar bastığınızda veya dışarı tıkladığınızda anında kaybolur.
- 🔍 **Akıllı Fuzzy Arama (Fuzzy Matching):** Yazım hatalarına ve kısaltmalara karşı toleranslıdır. Örneğin, `vsc` yazarak *Visual Studio Code*'u veya `gch` yazarak *Google Chrome*'u saniyeler içinde bulabilirsiniz.
- 📂 **Genişletilmiş İndeksleme:** Sadece uygulamaları değil; Masaüstü, Belgeler, İndirilenler, Resimler, Videolar ve Müzik klasörlerinizdeki dosya ve alt klasörleri de indeksler.
- ⚡ **RAM Tabanlı Hız:** Arama dizini bellekte (RAM) tutulduğu için aramalar **2 milisaniyeden (ms)** kısa sürer. Diski yormaz.
- 🎨 **Nostaljik Tasarım (2008 Retro Style):** Windows XP stili birleşik beyaz arama kutusu, 3D büyüteç simgesi, Windows 7 stili mavi seçim efektleri ve klasik sarı klasör/dosya simgeleriyle nostaljik bir kullanıcı deneyimi sunar.
- 📐 **Dinamik Pencere Boyutlandırma:** Pencere yüksekliği, arama sonuçlarının sayısına göre otomatik ve yumuşak bir şekilde aşağı doğru genişler ve daralır.
- ✕ **Dosya Silme Desteği:** Listelenen dosya ve klasörlerin yanındaki silme butonunu kullanarak istemediğiniz dosyaları (örneğin ekran görüntülerini) onay kutusuyla doğrudan diskten silebilirsiniz.
- ⚙️ **Başlangıçta Otomatik Çalışma:** Uygulama çalıştırıldığında Windows başlangıç klasörüne kısayol ekleyerek bilgisayar açıldığında otomatik olarak arka planda hazır hale gelir.
- 🪶 **Hafif ve Güvenli:** Sadece ~20MB RAM kullanır ve tamamen yerel (local-first) çalışarak verilerinizi dışarı aktarmaz.

---

## ⌨️ Klavye Kısayolları / Keyboard Shortcuts

| Kısayol | İşlem / Action |
|:---|:---|
| `Alt + Space` | TTBar'ı Göster / Gizle (Toggle TTBar) |
| `↑` `↓` | Sonuçlar Arasında Gezin (Navigate results) |
| `Enter` (↵) | Seçili Sonucu Aç (Open selected result) |
| `Esc` | TTBar'ı Kapat (Dismiss TTBar) |
| `Tab` | Sıradaki Sonuca Git (Cycle through results) |

---

## 🛠️ Kurulum ve Çalıştırma / Installation & Running

### Gereksinimler / Prerequisites
Projenin kaynak kodunu derlemek için bilgisayarınızda şunların kurulu olması gerekir:
- **Windows 10/11**
- [Rust Toolchain](https://rustup.rs/) (1.75+)
- [Node.js](https://nodejs.org/) (18+)
- Visual Studio Build Tools (C++ Araçları)

### Geliştirme Modu / Development Mode

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu ve uygulamayı başlatın
npm run tauri dev
```

### Derleme / Production Build

Uygulamanın tek başına çalışan bağımsız `.exe` sürümünü üretmek için:

```bash
npm run tauri build
```

Derleme tamamlandığında, kurulum gerektirmeyen tek parça executable dosyanız şu konumda oluşacaktır:
📁 `src-tauri/target/release/ttbar.exe`

---

## 📁 Proje Yapısı / Project Structure

```
ttbar/
├── src/                     # Frontend (HTML/CSS/JS)
│   ├── index.html           # Arayüz yapısı
│   ├── assets/              # Simgeler ve retro büyüteç
│   ├── styles/              # Klasik Windows 7/XP teması
│   └── js/                  # Uygulama ve Klavye mantığı
│
├── src-tauri/               # Backend (Rust)
│   ├── src/
│   │   ├── main.rs          # Giriş noktası
│   │   ├── lib.rs           # Tray menüsü, Hotkey, Dosya Silme logic'leri
│   │   └── search.rs        # Fuzzy arama ve lnk/dosya tarayıcı motoru
│   ├── Cargo.toml           # Rust bağımlılıkları
│   └── tauri.conf.json      # Tauri pencere ve izin ayarları
│
└── package.json             # npm konfigürasyonu
```

## 📄 Lisans / License

Bu proje **MIT Lisansı** ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına göz atabilirsiniz.
