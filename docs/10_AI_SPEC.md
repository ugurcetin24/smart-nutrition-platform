# 10 — AI, besin kataloğu ve laboratuvar/OCR gereksinimleri

**Durum: 3 Aralık 2026 çalışmaları için ürün kararları kesinleşti; uygulama ve doğrulama gerekli.** Kaynakta FoodAnalysis/FoodItem/Recipe/LabReport/LabResult/LabInsight için EF, controller veya çalışan model servisi bulunmuyor. Bağımsız katalog önizlemesi ve React'teki sentetik tahlil görünümü gerçek uygulama entegrasyonu değildir.

İsimler [04](04_NAMING_CONVENTIONS.md), modeller [05](05_DATA_DICTIONARY.md), HTTP [06](06_API_CONTRACT.md)'dadır. 29.11.2026 ortak onay teyidiyle U7 laboratuvar şeması/HTTP/durumları bu kaynaklarda onaylı fakat henüz uygulanmamış sözleşme olarak ayrılmıştır. Yemek/katalog için açık alanlar U7 ile kesinleşmez. Bu belge işleme yaklaşımını ve araştırma sınırını kaydeder.

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

Geçmiş tahlil karşılaştırmaları korunacak ürün gereksinimidir; aynı analit ve aynı/doğrulanmış dönüştürülmüş birim kullanılır. Ölçüm, birim, referans, tarih ve açıklamanın sınırı webde birlikte görünür. U7'de LabInsight ve uzman doğrulaması içerik sürümüne bağlanmıştır; düzeltmede eski doğrulama stale olur ve eski açıklama güncel gösterilmez. method=expert_note/reference_rules, `limitations=list<string>` sözleşmesi [04/05/06](06_API_CONTRACT.md)'dadır. Analit eşleştirme ve birim dönüşümü için kaynak/kurallar doğrulanmadan otomatik dönüşüm veya klinik karşılaştırma yapılmaz.

Sistem hastalık teşhisi, tedavi kararı veya kesin klinik yorum üretmez. LabInsight tanı, reçete veya hastalık saptama iddiası taşımaz; “normal” bayrağı genel sağlıklı hükmü değildir.

## PDF ayrıştırma ve yerel OCR

İlk geliştirme hedefi e-Nabız tahlil belgeleridir; bütün laboratuvar formatları aynı varsayılmaz. Metin katmanı bulunan PDF'lerde doğrudan metin/tablo ayrıştırma önceliklidir. Fotoğraf, ekran görüntüsü ve taranmış PDF'lerde yerel OCR kullanılır. **Gerçek tahlil belgeleri Gemini veya başka harici AI servislerine gönderilmez.**

U7 onayıyla ilk metin katmanı ayrıştırıcısı pdfplumber, raster işleme yaklaşımı özel ağda çalışan Python/FastAPI üzerinden yerel PaddleOCR'dir. PyMuPDF varsayılan bağımlılık değildir; AGPL/ticari lisans yolu ayrıca kararlaştırılmadan ürüne eklenmez. U10'da PaddleOCR/PaddlePaddle/model sürümleri ve CPU yeterliliği doğrulanacaktır; onay araçların kurulmuş veya gerçek e-Nabız çıktısında ölçülmüş olduğu anlamına gelmez. Paket/model hash'leri ve tüm bağımlılık lisansları uygulama öncesinde sabitlenir.

Test adı, değer, birim, referans aralığı, belgedeki mevcut durum işareti ve tarih yapılandırılmış biçimde çıkarılır. Çıktı uzman incelemesi için taslaktır; otomatik çıkarım veya işlemin tamamlanması doğrulanmış sonuç anlamına gelmez.

Güvenlik taraması yüklemede, metin/OCR çıkarımı diyetisyenin açık başlatmasıyla çalışır. Sayfa bazlı yönlendirme kullanılır: metinli sayfada koordinat/tablo ayrıştırma, raster sayfada yerel OCR. Başlık/sütun/satır eşleştirmesi ve çok satırlı adlar korunur; bilinmeyen format/bozuk eşleşme inceleme gerektirir. Virgüllü sayılar bağlama göre ayrıştırılır; 1.234 gibi belirsiz ayırıcı, eksik alan, eşitsizlikli/nitel değer ve belgedeki farklı tarihler tahminle tamamlanmaz. L/N/H kaynak işareti sunucu flag'inden ayrıdır. FoodAnalysisStatus kullanılmaz. Dosya sınırları/durum/DTO [06](06_API_CONTRACT.md), saklama/silme [11](11_SECURITY_AND_RELEASE.md)'dedir. Laboratuvar belgesi ile dışa aktarılan diyetisyen PDF raporu farklı kavramdır.

### U7 araştırma kanıtı ve sınırı — 28.11.2026

Repository dışında yalnız sentetik prototipte Python 3.12.14, pdfplumber 0.11.9, pdfminer.six 20251230, pypdfium2 5.13.0, ReportLab 4.4.9 kullanıldı. Çizgili ve sütunları değiştirilmiş çizgisiz iki PDF'de toplam 30 satırın ad/ham değer/birim/referans/durum/tarih alanları kontrol edildi; 41/41 sentetik kontrol geçti. Türkçe karakter, çok satırlı ad, sıfır/negatif/bilimsel değer, eksik alan, bayrak çelişkisi ve tek kaydırılmış değer örneği kapsandı. Taranmış iki sayfa OCR'ye, karma PDF sayfa bazında yönlendirildi. Bu sayımlar 29.11 belge görevinin yeni test sonucu değildir; geçici prototip dosyaları repository/CI girdisi değildir.

Gerçek e-Nabız belgesi test edilmedi; şablon varsayımlı koordinat prototipi genel format doğruluğu kanıtlamaz. PaddleOCR/PaddlePaddle kurulu değildi; OCR çıkarımı veya CPU/GPU karşılaştırması yapılmadı. İzole PyMuPDF kurulum denemesi paket sunucusunun DNS erişimi nedeniyle başarısız oldu. Doğruluk oranı/servis SLA'sı çıkarılamaz; gerçek sağlık belgesi harici servise gönderilmedi.

Araştırma kaynakları: [pdfplumber projesi ve MIT lisansı](https://github.com/jsvine/pdfplumber), [bağımlılıklar](https://raw.githubusercontent.com/jsvine/pdfplumber/stable/requirements.txt), [PyMuPDF lisans seçenekleri](https://pymupdf.io/licensing), [PaddleOCR paket/lisans tanımı](https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/pyproject.toml), [PaddleOCR kurulum](https://www.paddleocr.ai/main/en/version3.x/installation.html), [Türkçe Latin model kapsamı](https://www.paddleocr.ai/main/en/version3.x/algorithm/PP-OCRv5/PP-OCRv5_multi_languages.html), [PDFium lisans bildirimleri](https://github.com/pypdfium2-team/pypdfium2#licensing), [e-Nabız PDF/tarih aralığı davranışı](https://www.enabiz.gov.tr/Yardim/Index). Hareketli upstream dosyaları üretim lockfile'ı değildir; denenen sürümler de üretim seçimi sayılmaz.

## Model ve değerlendirme

Yemek analizi sağlayıcısı Gemini olarak kesinleşmiştir; model sürümü ve kullanım sınırları araştırılacaktır. Özel model eğitimi veya ayrı Python servisi zorunlu değildir. Model sürümü, değerlendirme tarihi, veri kaynağı/lisansı, sınırlılıklar ve bilinen hata örnekleri izlenmelidir.

Fotoğraf için ayrık test verisi, Türk yemeklerinin temsili, sınıflandırma precision/recall/F1, porsiyon/kalori hata dağılımı ve kullanıcı düzeltme sıklığı değerlendirilir. Veri ve ölçüm olmadan doğruluk oranı taahhüt edilmez.

Laboratuvar ML araştırması uygun, izinli ve bilimsel olarak anlamlı veri bulunması koşuluyla yürütülür. Etiket kalitesi, leakage kontrolü, bağımsız eğitim/test, sınıf dengesi, açıklanabilirlik ve klinik uzman doğrulaması gerekir. Bu koşullar yoksa referans karşılaştırmasının ötesinde iddia üretilmez.

U7 araştırmasında [NHANES ferritin](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/FERTIN_L.htm) ve [NCHS kullanım koşulları](https://www.cdc.gov/nchs/policy/data-user-agreement.html), [MIMIC-IV](https://physionet.org/content/mimiciv/3.1/), [100 hastalık ODbL demo](https://physionet.org/content/mimic-iv-demo/2.2/), [CC BY 4.0 UCI Diabetes](https://archive.ics.uci.edu/dataset/296/diabetes) ve [Apache-2.0 Synthea](https://github.com/synthetichealth/synthea) incelendi. NHANES istatistiksel kullanım/örneklem ağırlığı ve alt grup sınırları, MIMIC credentialing/DUA ve hastane nüfusu, UCI'nin yeniden yatış hedefi nedeniyle bu veriler e-Nabız OCR veya Türk diyetisyen danışanına klinik modelin doğrulaması değildir. Synthea test verisidir. Veri indirme/eğitim yapılmadı; klinik ML geliştirmesi önerilmiyor. U14'te öncelik izinli etiketli belgeyle alan eşleştirme/hata ölçümüdür; referanstan türetilen L/N/H'yi öğrenmek deterministik kuralın yerine bilimsel başarı sayılmaz.

## Mimari ve güvenlik sınırı

Kaynak/rol/ilişki/izin kararını backend verir, model vermez. Yemek fotoğrafının Gemini'ye aktarımı ile tahlilin diyetisyene paylaşımı ayrı amaçlardır. Gemini veri işleme koşulları ve yemek görüntülerinin mahremiyeti açık karardır; tahlillerin harici AI'ya aktarım yasağı korunur. Veri minimizasyonu, sağlayıcı/yer/retention ve hukuki dayanak [11](11_SECURITY_AND_RELEASE.md)'deki yayın kapısına tabidir.

Uygulama öncesi manuel devam, zaman aşımı, izin/onay geri çekme, ilişki bitişi, dosya sahipliği, yemek için kullanıcı onayı, tahlil için uzman doğrulaması ve yanıltıcı/riskli metin kontrolleri test edilmelidir. Mobilde tahlil analizi gösterilmemesi ve gerçek belgelerin harici AI'ya gönderilmemesi de doğrulanır. Bunlar kabul gereksinimleridir; eğitilmiş model, bilimsel başarı veya gerçekleştirilmiş test sonucu değildir. Açık kararların ve görevlerin ana kaynağı [12](12_TEAM_PLAN_AND_DECISIONS.md)'dir.
