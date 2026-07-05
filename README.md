# ⚡ TTBar

Windows 10/11 için şimşek hızında çalışan, minimalist ve nostaljik (Windows XP/7 tarzı) bir dosya ve uygulama başlatıcı.

## ❓ Ne İşe Yarar?

* `Alt + Space` kısayolu ile anında ekrana gelir.
* Bilgisayarındaki uygulamaları, Masaüstü, Belgeler, İndirilenler, Resimler, Videolar ve Müzik klasörlerindeki dosyaları ve klasörleri fuzzy (harf hatası veya kısaltma toleranslı) olarak arar.
* Sonuçlar arasında yön tuşlarıyla gezinip `Enter` ile dosyayı/uygulamayı anında açabilirsin.
* İstemediğin dosyaları listedeyken yanındaki **✕** butonuyla doğrudan diskten silebilirsin.
* Bilgisayar açıldığında otomatik olarak arka planda çalışmaya başlar.

## 🚀 Büyük İddia

Bu uygulamanın, Windows'un kendi o hantal ve işe yaramaz web aramalarıyla dolu **Windows Search Bar**'ından çok daha hızlı, pratik ve kullanışlı olduğunu iddia ediyorum. Arama sonuçlarını Bing veya reklamlarla kirletmez, diski yormaz, RAM'den (<20MB) milisaniyeler içinde sonuç getirir.

## 📦 Nasıl İndirilir ve Başlatılır?

### 1. Sadece Kullanmak İsteyenler İçin (Normal Kullanıcı)
1. GitHub sayfasının sağ tarafında bulunan **"Releases"** (Sürümler) bölümüne gidin.
2. En güncel sürümün altındaki **`ttbar.exe`** dosyasını bilgisayarınıza indirin.
3. İndirdiğiniz `ttbar.exe` dosyasını bilgisayarınızda kalıcı olmasını istediğiniz bir konuma (örneğin *Belgeler* klasörü) taşıyın ve çift tıklayarak çalıştırın.
4. **`Alt + Space`** tuş kombinasyonunu kullanarak arama barını açabilirsiniz. 
*(Uygulama ilk çalıştırıldığında otomatik olarak başlangıç klasörünüze eklenecektir, sonraki açılışlarda elle başlatmanıza gerek kalmaz).*

### 2. Geliştiriciler İçin (Kaynak Koddan Çalıştırma)
Bilgisayarınızda Node.js, Rust ve C++ Build Tools kurulu olmalıdır.

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme modunda çalıştırın
npm run tauri dev

# Kendi exe dosyanızı üretmek için
npm run tauri build
```
📁 Derlenen exe dosyası şu konumda oluşur: `src-tauri/target/release/ttbar.exe`
