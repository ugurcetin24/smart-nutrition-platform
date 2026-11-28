# 10 — AI, besin kataloğu ve laboratuvar/OCR gereksinimleri

**Durum: 3 Aralık 2026 çalışmaları için ürün kararları kesinleşti; uygulama ve doğrulama gerekli.** Kaynakta FoodAnalysis/FoodItem/Recipe/LabReport/LabResult/LabInsight için EF, controller veya çalışan model servisi bulunmuyor. Bağımsız katalog önizlemesi ve React'teki sentetik tahlil görünümü gerçek uygulama entegrasyonu değildir.

İsimler [04](04_NAMING_CONVENTIONS.md), korunmuş alan adayları [05](05_DATA_DICTIONARY.md), mevcut olmayan taslak HTTP yolları [06](06_API_CONTRACT.md)'dadır. Bu görevde 04/05/06 değişmez; kesin şema, route, DTO, hata ve analiz durumları araştırma sonuçlarından sonra kararlaştırılacaktır. Bu belge ürün akışını ve Gemini seçimini kaydeder; teknik sözleşmeyi kesinleştirmez.

## Fotoğraftan yemek analizi

Flutter kamera veya galeriden yemek görüntüsü alır. **Google Gemini API**, tek görüntüde tekli ve çoklu yemek tanıma, tahmini porsiyon/gramaj ve yapılandırılmış sonuç üretme amacıyla kullanılacaktır. Sürekli video analizi sonraki sürüm/araştırmadır.

Gemini çağrıları ASP.NET Core backend üzerinden yapılır; API anahtarı mobil veya web istemcisine verilmez. Gemini entegrasyonu için ayrı Python servisi zorunlu değildir. Model sürümü, kota/maliyet sınırları ve veri işleme koşulları henüz seçilmemiştir.

Akış: kontrollü yükleme → Gemini'den yemek ve porsiyon önerileri → doğrulanmış besin kataloğuyla eşleştirme → katalog ve miktar üzerinden enerji/makro hesabı → kullanıcı kontrolü/düzenlemesi ve açık onay → ayrı MealLog kaydı.

Kalori, protein, karbonhidrat ve yağ değerleri doğrulanmış katalogdan hesaplanır. Gemini'nin besin değeri tahminleri kesin veri kabul edilmez. Kullanıcı tanınan yemekleri, eşleştirilen besinleri ve porsiyonları düzenleyebilir, yemek ekleyip çıkarabilir; doğru öneriyi değiştirmeye zorlanmaz.

Tek fotoğraftan güvenilir 3D hacim veya kesin kalori sözü verilmez. Analizi başlatmak/okumak veya işlemenin tamamlanması onay değildir; kullanıcı açıkça onaylamadan MealLog oluşmaz. Mevcut öğünler, kişisel hedefler ve Dashboard korunur; model başarısız/yavaşsa manuel kayıt devam eder. Gemini'nin yapılandırılmış çıktısı doğrudan kesin API/DB şeması sayılmaz; onay kanıtı ve dosya sınırları teknik kararlara tabidir.

## Hibrit besin kaynağı ve tarif

FoodItem değerleri tek servingBasisGrams temeline dayanır; enerji kcal, makrolar gramdır. Veri kaynağı, kaynak/lisans, sürüm ve belirsizlik izlenir. Birden çok sağlayıcıda eşleştirme/öncelik/birleştirme kuralları ayrıca belirlenir.

`previews/usda-tr-catalog/` altındaki 397 kayıtlık USDA Türkçe önizlemesi uygulamaya bağlı değildir ve Türk yemeklerini kapsamaz. Önizlemenin varlığı üretim besin kaynağını, lisans seçimini veya eşleştirme yöntemini kesinleştirmez.

Recipe kullanıcının özel tarifidir; bileşen, miktar, porsiyon, toplam/besin hesabı, görünürlük ve geçmiş düzeni açık kararlardır. Katalog/tarif değişikliği eski MealLogItem veya program snapshot'ını yeniden hesaplayıp değiştirmemelidir. Mevcut manuel API'nin dolu katalog/tarif/analiz UUID'lerini reddetmesi, gelecekteki kapsamın kaldırılması değildir.

## Tahlil belgesi ve uzman çalışma akışı

Danışan mobil **Diyetisyenim → Tahlillerim** bölümünden PDF, fotoğraf veya ekran görüntüsü yükler; belgelerin geçmişini, işlem durumunu ve paylaşımını yönetir. **Mobilde OCR sonucu, referans aralığı değerlendirmesi veya AI destekli tahlil analizi gösterilmez.** Belge aktif ve yetkili diyetisyenin React paneline bağımsız paylaşım izni ve tahlile özel açık onayla ulaşır; izin/onay geri çekilince veya ilişki sona erince uzman erişimi kapanır.

Diyetisyen orijinal belgeyi ve çıkarılan sonuçları birlikte görüntüler, yanlış çıkarımları düzeltir ve doğrular. Manuel tahlil veri girişi ve uzman değerlendirme notları web panelindedir. OCR çıktısı uzman doğrulaması yapılmadan doğrulanmış tahlil sonucu kabul edilmez. Danışanın yükleme/paylaşım onayı ile uzmanın sonuç doğrulaması farklı amaçlardır; biri diğerinin yerine geçmez.

Referans karşılaştırması sunucuda yapılır. Geçerli analit/birim/aralık eşleşmesinde yalnız low/normal/high karşılaştırılır; eksik/geçersiz referans veya birimde unknown olur, kesin değerlendirme üretilmez. Genel pozitif değer kuralı veya otomatik klinik eşik uydurulmaz. Belgeden çıkarılan mevcut durum işareti, sunucunun referans karşılaştırmasından ayrı değerlendirilir.

Geçmiş tahlil karşılaştırmaları korunacak ürün gereksinimidir; aynı analit ve aynı/doğrulanmış dönüştürülmüş birim kullanılır. Ölçüm, birim, referans, tarih ve açıklamanın sınırı webde birlikte görünür. Rapor değişince eski LabInsight güncel sonuç gibi sunulmaz; sürüm/yeniden analiz davranışı, method/limitations biçimi ve uzman doğrulamasının teknik kaydı açık karardır.

Sistem hastalık teşhisi, tedavi kararı veya kesin klinik yorum üretmez. LabInsight tanı, reçete veya hastalık saptama iddiası taşımaz; “normal” bayrağı genel sağlıklı hükmü değildir.

## PDF ayrıştırma ve yerel OCR

İlk geliştirme hedefi e-Nabız tahlil belgeleridir; bütün laboratuvar formatları aynı varsayılmaz. Metin katmanı bulunan PDF'lerde doğrudan metin/tablo ayrıştırma önceliklidir. Fotoğraf, ekran görüntüsü ve taranmış PDF'lerde yerel OCR kullanılır. **Gerçek tahlil belgeleri Gemini veya başka harici AI servislerine gönderilmez.**

Python/FastAPI, PaddleOCR ve PDF ayrıştırma araçları uygunluk araştırmasında değerlendirilir. U10'un OCR servisi görevi bu araştırmaya bağlıdır; kesin PDF/OCR araçları, sürümleri ve servis ayrıntıları henüz seçilmemiştir.

Test adı, değer, birim, referans aralığı, belgedeki mevcut durum işareti ve tarih yapılandırılmış biçimde çıkarılır. Çıktı uzman incelemesi için taslaktır; otomatik çıkarım veya işlemin tamamlanması doğrulanmış sonuç anlamına gelmez.

OCR'nin otomatik veya diyetisyen tarafından başlatılması, dosya türü/boyutu/PDF sayfa sınırları, tarama/depolama/saklama/silme, işleme durumları ve uzman doğrulamasının sunucu kanıtı açık kararlardır. FoodAnalysisStatus OCR'ye otomatik uygulanmaz; yeni iş/DTO/enum alanları varsayılmaz. Laboratuvar belgesi ile dışa aktarılan diyetisyen PDF raporu farklı kavramdır.

## Model ve değerlendirme

Yemek analizi sağlayıcısı Gemini olarak kesinleşmiştir; model sürümü ve kullanım sınırları araştırılacaktır. Özel model eğitimi veya ayrı Python servisi zorunlu değildir. Model sürümü, değerlendirme tarihi, veri kaynağı/lisansı, sınırlılıklar ve bilinen hata örnekleri izlenmelidir.

Fotoğraf için ayrık test verisi, Türk yemeklerinin temsili, sınıflandırma precision/recall/F1, porsiyon/kalori hata dağılımı ve kullanıcı düzeltme sıklığı değerlendirilir. Veri ve ölçüm olmadan doğruluk oranı taahhüt edilmez.

Laboratuvar ML araştırması uygun, izinli ve bilimsel olarak anlamlı veri bulunması koşuluyla yürütülür. Etiket kalitesi, leakage kontrolü, bağımsız eğitim/test, sınıf dengesi, açıklanabilirlik ve klinik uzman doğrulaması gerekir. Bu koşullar yoksa referans karşılaştırmasının ötesinde iddia üretilmez.

## Mimari ve güvenlik sınırı

Kaynak/rol/ilişki/izin kararını backend verir, model vermez. Yemek fotoğrafının Gemini'ye aktarımı ile tahlilin diyetisyene paylaşımı ayrı amaçlardır. Gemini veri işleme koşulları ve yemek görüntülerinin mahremiyeti açık karardır; tahlillerin harici AI'ya aktarım yasağı korunur. Veri minimizasyonu, sağlayıcı/yer/retention ve hukuki dayanak [11](11_SECURITY_AND_RELEASE.md)'deki yayın kapısına tabidir.

Uygulama öncesi manuel devam, zaman aşımı, izin/onay geri çekme, ilişki bitişi, dosya sahipliği, yemek için kullanıcı onayı, tahlil için uzman doğrulaması ve yanıltıcı/riskli metin kontrolleri test edilmelidir. Mobilde tahlil analizi gösterilmemesi ve gerçek belgelerin harici AI'ya gönderilmemesi de doğrulanır. Bunlar kabul gereksinimleridir; eğitilmiş model, bilimsel başarı veya gerçekleştirilmiş test sonucu değildir. Açık kararların ve görevlerin ana kaynağı [12](12_TEAM_PLAN_AND_DECISIONS.md)'dir.
