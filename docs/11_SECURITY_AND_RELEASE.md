# 11 — Yetkilendirme, mahremiyet ve yayın gereksinimleri

Bu belge güvenlik ve gerçek veri/yayın kapılarının ana kaynağıdır. HTTP kimlik taşıma, DTO/hata ve süre/limit değerleri [06](06_API_CONTRACT.md), kalıcı şema [05](05_DATA_DICTIONARY.md), sağlık kaynak/tekilleştirme politikası [20](20_HEALTH_DATA_SYNC_CONTRACT.md)'dedir. Kaynakta kontrol bulunması üretim uygunluğu veya bu görevde test edildiği anlamına gelmez.

## Erişim matrisi

| Kaynak/işlem | Danışan | Diyetisyen | Admin |
|---|---|---|---|
| Kendi günlük beslenme/su/ölçüm ve kişisel hedefler | Kendi ClientProfile kapsamında; ilişki gerekmez | Danışan adına yazamaz | Varsayılan erişim yok |
| Paylaşılmış öğün/su/ölçüm | Kendi verisi | Güncel onaylı uzman + kendi aktif ilişkisi + ilgili bağımsız açık izin; salt okunur | MFA sağlık yetkisi vermez |
| Program ve sürümler | Kendi programlarını okur, yalnız kişisel olanı yazar | İzinli danışanın programını okur; yalnız kendi atadığını yazar | Erişim yok |
| Program–tüketim karşılaştırması | Kendi verisi | Hem nutrition_plans hem meal_logs gerekir | Erişim yok |
| Yorum/cevap | Kendi öğününde | Aktif ilişkide meal_logs izniyle | Erişim yok |
| Görev ve geçmiş | Kendi görevini okur; izinli durum/tercih değişikliği | Özgün aktif ilişki + client_tasks + atayan sahipliği | Erişim yok |
| Kategori izinleri | Kendi aktif ilişkisinde verir/geri çeker | Kendi ilişkisinin izin durumunu okur, danışan adına değiştiremez | Danışan adına açamaz |
| Sağlık bağlantısı/örnek/aktivite | Yalnız client JWT ve kendi profil bağlamı | U3 yolları paylaşım kategorisiyle açılmaz | Erişim yok |
| Uzman incelemesi/onayı | Kendi başvuru durumu | Kendi başvuru durumu | Yalnız MFA web oturumu |
| Laboratuvar belgesi/paylaşımı | Planlanan mobil yükleme, belge geçmişi, işlem durumu ve paylaşım yönetimi; OCR/referans/AI analizi gösterilmez | Planlanan onaylı uzman + aktif ilişki + bağımsız tahlil izni + geri çekilmemiş tahlile özel açık onay; belge/sonuç inceleme, düzeltme/doğrulama, manuel giriş ve notlar webde | Varsayılan erişim yok |

Tek User.role ile ClientProfile/DietitianProfile yetkisi farklıdır. X-Profile-Context başlığı kimlik veya uzman onayı üretmez. Pending/ended ilişki sağlık verisi açmaz; uzman doğrulaması kaybı yeni uzman erişimini kapatır.

Yetki kontrolü satırlar kadar totalCount, toplam, grafik, analiz ve gelecekteki cache/PDF/dosya bağlantılarını da kapsar. Eksik izin “boş veri” diye gizlenmez. Okuma snapshot'ı iptal commit'inden önce başlamışsa tamamlanabilir; sonraki yeni okuma kapanmalıdır. Önceden sunulmuş veriyi uzaktan geri silme garantisi verilmez.

## Bağımsız izin ve geri çekme

Beş mevcut kategori birbirini açmaz; eksik/false satır kapalıdır. Otomatik izin, geçmiş grant kopyası veya backfill yoktur. Genel açılım bayrağı danışan onayı değildir; kapatılması mevcut izin satırını silmez/gizlemez ve yeni tüm okumaları kendiliğinden iptal etmez.

water_logs yalnız su tüketimi okumasıdır; kişisel hedef, başka kategori, yazma veya genel sağlık paylaşımı vermez. İzin geri çekilince su kayıt/toplam/geçmişi yeni okumada kapanır, diğer kategoriler korunur. Su DTO ve gün sınırlarının tek kaynağı [06](06_API_CONTRACT.md)'dır.

Mevcut beş kategoride consentRecordId null'dır; ConsentRecord/tahlil açık onay uygulaması henüz yoktur. Kategori izni, hukuki işleme şartı/açık rıza, AI'ya aktarım amacı ve OS sağlık izni birbirinin yerine geçmez.

Onaylı fakat henüz uygulanmamış U7 tahlil paylaşımı mevcut kategorilerden biriyle veya belge yükleme eylemiyle kendiliğinden açılmaz. Her belge/çıkarım/geçmiş karşılaştırması okumasında ve uzman yazma/doğrulama işleminde sunucu güncel uzmanlığı, aktif ilişkiyi, lab_reports kategori iznini, tahlile özel açık onayı ve raporun o ilişkiye seçilerek paylaşılmasını denetler. İzin ya da açık onay geri çekilince veya ilişki bitince sonraki uzman erişimi kapanır; dosya bağlantıları ve ilgili görünüm de aynı yetki sınırına tabidir. Şema [05](05_DATA_DICTIONARY.md), HTTP [06](06_API_CONTRACT.md)'dadır; mevcut beş kategorili kod kendiliğinden genişlemiş sayılmaz.

Danışanın belge yükleme/paylaşım onayı, yemek analizini MealLog'a kaydetme onayı ve diyetisyenin OCR sonucunu doğrulaması ayrı amaçlardır. Tahlil OCR çıktısı uzman doğrulamasından önce doğrulanmış sonuç sayılmaz; uzman doğrulaması danışanın paylaşım izni veya tahlile özel açık onayının yerine geçmez. Mobilde OCR sonucu, referans değerlendirmesi veya AI destekli tahlil analizi gösterilmez.

## Kimlik, oturum ve sırlar

Parola Identity PasswordHasher ile saklanır; e-posta harf duyarsız unique'dir. Token/secret, hash/MFA metadata'sı veya sağlık değeri API hesabına, hata/log/audit'e taşınmaz. EF sensitive logging ve Npgsql ayrıntılı hata içeriği açılmaz.

JWT her doğrulamada güncel User/rol/e-posta/credentialsVersion kontrolü yapar; başarılı sonuç cache'lenmez, DB kesintisi kapalı erişimdir. Normal logout yalnız refresh ailesini iptal eder; access JWT kalan süre içinde geçebilir. Parola reseti sürüm artırıp bütün web oturumlarını/refresh ailelerini atomik iptal eder; eski JWT yeni doğrulamada reddedilir.

Web cookie/CSRF, tam HTTPS Origin ve Data Protection birlikte kullanılır; credential CORS açılmaz. Windows key ring uygulama hesabına bağlı DPAPI, diğer ortamlarda koruma sertifikasıyla korunur. Çok API örneği aynı uygulama adı/kalıcı korumalı anahtar halkasını kullanmalıdır. Üretim anahtar dağıtımı, rotasyon ve dizin yetkileri ayrıca hazırlanır.

Admin yalnız MFA ile ayrı web oturumu açar; genel login/refresh Admin erişimi vermez. TOTP sırları korunur, kurtarma kodları hash olarak tek kullanımlıdır. Parola reseti TOTP/kurtarma kurulumunu kaldırmaz. İlk kurulum ve MFA yeniden kurulum yerel yönetim komutudur; genel public kurtarma API'si yoktur.

Development e-posta giriş kodu yalnız loopback/Mailpit içindir; üretim MFA alternatifi değildir. Bu oturum kanıtı üretimde reddedilir. Üretim SMTP TLS gerektirir; None yalnız Development loopback SMTP'de geçerlidir. Bellek e-posta/reset kuyruğu teslim dayanıklılığı garantisi vermez.

Mobil access/hesap bellekte, refresh platformun güvenli deposundadır. Web sırları JS kalıcı depolarına yazılmaz; tema tercihi de mevcut kodda yalnız bellektedir. Harici web bağlantısı mobil JWT/refresh veya kullanıcı kimliği taşımaz. Reset fragment temizleme ve mobil manuel kod davranışı [07](07_MOBILE_SPEC.md)/[08](08_WEB_SPEC.md)'dedir.

## Kalıcı veri ve audit

Tek aktif ilişki/program, kaynak kimlikleri, sürümler ve ilişkisel sahiplik DB kısıtlarıyla korunur. Yazmalarda aktör/ClientProfile kilidi altında izin yeniden denetlenir; istemci kimliği veya stale izinle yazma yapılmaz. İlişki bitişinde atanmış aktif program arşivlenir, açık görevler snapshot geçmişiyle iptal edilir.

Mevcut öğün/su/ölçüm soft delete'i veya sağlık tombstone'u KVKK kapsamında kalıcı silme talebinin tamamlandığı anlamına gelmez. Veri koruyan migration Down korumaları atlanmaz; yedek ve uygulama DB değişikliği ayrıca yetkilendirilir. Bu görevde DB'ye bağlanılmamıştır.

AuditEvent uzman onayını aynı transaction'da dietitian_verified/DietitianProfile kimlikleriyle kaydeder; zaten doğrulanmış profilde ikinci olay oluşmaz. Mesleki açıklama/parola/sağlık içeriği metadata'ya konmaz. Geniş oturum/sağlık/silme audit'i ve Admin audit ekranı tamamlanmış sayılmaz.

## Gerçek veri için açık mahremiyet kararları

Veri envanteri her veri türünün amacı, hukuki dayanağı, saklama süresi, erişen rolü ve üçüncü taraf/yurt dışı aktarımını içermelidir. Aydınlatma ve gerekli açık rıza işlemleri ayrılır; tüm amaçlar tek checkbox ile çözülmez. Hukuki gereklilikler gerçek yayından önce ayrıca değerlendirilir; burada yeni süre veya hukuki dayanak seçilmez.

Hesap silme, veri indirme/silme talebi, yedekten silme, retention/anonimleştirme, onay politika sürümü/kanıtı ve istisnai destek erişimi açık kararlardır. İstisnai Admin sağlık erişimi varsa gerekçeli, sınırlı ve audit'li tasarlanmalıdır; mevcut varsayılan engel kaldırılmaz.

Fotoğraf/PDF/OCR için MIME + gerçek içerik kontrolü, boyut, zararlı içerik taraması, private storage, yetkili süreli dosya erişimi ve silme politikası gereklidir. Sağlayıcı/retention/yurt dışı aktarım ayrıca onaylanır. Veri minimizasyonu, yemekte kullanıcı onayı ve tahlilde uzman doğrulaması [10](10_AI_SPEC.md)'dadır.

Yemek görüntüleri için Gemini API yalnız ASP.NET Core backend üzerinden çağrılır; API anahtarı mobil/web istemcisine verilmez. Gemini'nin veri işleme koşulları, yemek fotoğraflarının mahremiyeti ve kota/maliyet sınırları açık teknik kararlardır; sağlayıcı seçimi bu konuların çözüldüğü anlamına gelmez.

**Gerçek tahlil belgeleri Gemini veya başka harici AI servislerine gönderilmez.** Metin katmanlı PDF yerel metin/tablo ayrıştırmasına, fotoğraf/ekran görüntüsü ve taranmış PDF yerel OCR'ye tabidir. U7'nin araç yaklaşımı [10](10_AI_SPEC.md), onaylı dosya sınırları [06](06_API_CONTRACT.md)'dadır. Paket/model sürümü, storage sağlayıcısı ve gerçek veri saklama süresi hâlâ yayın öncesi karardır. Sentetik test verisi kuralı korunur; gerçek sağlık belgesi seed/test/log içine konmaz.

## U7 — onaylı tahlil güvenliği ve yaşam döngüsü, henüz uygulanmadı

29.11.2026 ortak onay teyidi aşağıdaki geliştirme kurallarını kapsar; güvenli depolama, işleyici, erişim iptali veya silme uygulamasının teslimi değildir.

- Üç ayrı danışan eylemi vardır: ilişkiye yönelik tahlil açık onayı, bağımsız lab_reports kategori izni ve rapor bazlı paylaşım seçimi. Yeni yükleme kapalıdır; tüm mevcut/gelecek belgeler tek eylemle sessizce açılmaz. Manuel uzman kaydı oluşturma amacı onay metninde açıkça belirtilir; yalnız o ilişkiye açılan yeni manuel rapor diğer belgelerin iznini değiştirmez.
- Uygulama aynı onayı başka ilişki/amaç/kullanıcı için kullanmaz. İlişki sonu eski kanıtı silmez veya yeni ilişkiye grant üretmez. Açık onayın geri çekilmesi ilgili kategori iznini false yapar; yeniden kabul yeni kanıt gerektirir. Kategori veya rapor seçimi kapalıyken canlı onay tek başına erişim sağlamaz.
- İptal, silme ve ilişki sonu, güncel uzman doğrulamasıyla birlikte dosya, sonuç, sürüm, toplam, not ve karşılaştırmada uygulanır. Aktör/ClientProfile/kaynak kilitleri altında son yetki denetimiyle yazma ve iş sonucu commit edilir. İptal commit'inden sonra başlayan yeni okuma kapanır; önceden başlamış tutarlı snapshot için genel erişim kuralı korunur.
- Yetkisi biten uzman işinin kuyruğu iptal edilir. Çalışan işlemin durdurulması mümkün değilse çıktı atılır; doğrulanmadan/veri sürümü yeniden denetlenmeden rapora uygulanmaz. Fiziksel OCR başarısı kullanıcının sağlık kaydına yazma yetkisi üretmez.
- Danışan ilişkisi olmadan kendi metadata/orijinal belgesini okuyabilir ve silebilir. Mobil sonuç/not/referans analizi göstermemesi kişisel veri erişim/indirme hakkını ortadan kaldırmaz; veri hakları için mevcut açık yayın kapısı ayrıca tamamlanır. Uzman kalıcı silme veya danışan adına izin açma işlemi yapamaz. Admin MFA sağlık verisi yetkisi değildir.
- Orijinal dosya webroot/public bucket dışında, rastgele storage anahtarıyla ve uygulama hesabıyla sınırlı erişimde saklanır. İletimde TLS, depolama/yedekte şifreleme ve anahtar erişim ayrımı gerekir. Sağlık değeri içerebilen kullanıcı dosya adı yalnız gerekli metadata'da tutulur, log/audit/URL'ye eklenmez.
- MIME/imza/gerçek içerik, boyut/sayfa/piksel ve zararlı içerik taranır. Karantina tamamlanmadan görüntüleme/paylaşım/çıkarım yoktur. Tarayıcı önizlemesi aktif PDF içeriğini çalıştırmayan izole yerel görüntüleme kullanır; gerekiyorsa güvenli türev orijinalden ayrı saklanır. Şifreli/bozuk içerikte koruma aşma yoktur.
- Her dosya ve Range isteği backend yetki kontrolünden geçer; kalıcı/public veya tek başına yetkiyi atlayan imzalı URL verilmez. no-store ve nosniff gerekir; sağlık belgeleri CDN, service worker, analitik veya JS kalıcı depoya önbelleklenmez. Oturum/danışan/izin kaybında web görünümü ve geç yanıtlar temizlenir. İndirilmiş kopyayı geri silme garantisi verilmez.
- Python/FastAPI yalnız özel ağ/yerel servis kimliğiyle erişilen çıkarım işleyicisidir. Dış istemci veya dosyanın içeriği servise keyfi URL/path veremez; kullanıcı JWT'si/DB yetkisi taşınmaz. ASP.NET Core sahiplik ve kayıt kararını verir. Belgeler, OCR metni ve sağlık değerleri internete/harici AI'ya veya herkese açık dosya tarama servislerine gönderilmez. Model dosyaları önceden izinli kaynaktan hash/lisans doğrulamasıyla hazırlanır; işlem anında dış indirme/telemetriye güvenilmez.
- OCR süreçleri düşük yetki, sınırlı CPU/bellek/süre/eşzamanlılık ve izole geçici dizin kullanır. Kesin çalışma limitleri U9/U10 ölçümleriyle yapılandırılır. Başarısızlık manuel akışı engellemez; paylaşımdan kalkmış belgeyi retry yeniden açamaz.
- Düzeltme snapshot'ları ve çıkarım JSON'u sağlık verisidir. Genel AuditEvent yalnız aktör, işlem, kaynak kimliği, zaman ve teknik sonucu taşır; değer, OCR metni, not veya onay metni içermez. Uzman doğrulaması danışanın onayı veya laboratuvarın klinik gerçekliğinin kanıtı sayılmaz.

### Saklama ve silme sınırı

Onaylanan teknik temizlik hedefleri: tamamlanan/terk edilen upload parçaları ve geçici OCR rasterları en geç 24 saatte; silme talebinden sonra canlı depodaki orijinal, türev, sonuç, çıkarım ve sağlık içeren sürüm/notlar en geç 24 saatte temizlenir. Erişim talep commit'inde hemen kapanır; fiziksel temizlik doğrulanmadan silindi denmez. Başarısız temizlik kalıcı iş kaydıyla yeniden denenir ve operasyonel hata olarak izlenir. Bu hedefler henüz uygulanıp test edilmemiştir.

Aktif raporlar için süresiz saklama seçilmemiştir. Orijinal, sonuç, not, onay/audit kanıtı ve yedeklerin süreleri veri envanteri ve hukuki değerlendirmeyle ayrıca sürümlenir. Araştırmadaki 30 günlük yedek döngüsü teknik adaydır; kesin/yasal süre değildir. Gerçek veri açılımı, bu süreler ve sağlayıcı/yer seçimi tamamlanana kadar kapalıdır. Zorunlu saklama istisnası varsa açık hukuki dayanak ve erişim kısıtıyla belgelenir; uygulama kendi başına istisna icat etmez.

DELETE yalnız soft delete ile tamamlanmaz: normal erişim kapanır, işler iptal edilir, canlı nesneler ve çocuk sağlık içeriği temizlenir; fiziksel sonuç ve yedek kapsamı ayrı izlenir. Yedek geri yüklemesi silme kayıtlarını yeniden uygular; sağlık içeriği eski yedekten görünür hale getirilemez. Asgari silme/onay kanıtı sağlık değerlerini içermez ve ayrıca onaylanan süreye tabidir.

Kabul kapsamı: rol/hesap/ilişki/kategori/onay/rapor seçimi matrisi; withdrawal–iş sonucu ve ilişki sonu–doğrulama yarışları; eski sürüm ve tekrar istekleri; her Range isteği; eski Flutter okuyucusu; mobil metadata'da sonuç/not olmaması; soft delete sonrası çocuk kaynak izolasyonu; canlı/yedek temizlik; ağ çıkışının engellenmesi. Bunlar planlanan kabul testleridir, geçirilmiş test beyanı değildir.

## Doğrulama ve yayın kapıları

Kabul testleri: rol/kaynak/FK izolasyonu; kategori matrisi/geri çekme; tek aktif ilişki/program yarışları; snapshot/sürüm/rollback; reset–login–refresh ve MFA tekrar kullanımı; CSRF/Origin; istemci geç yanıt/hassas görünüm temizliği; kaynak/birim/örtüşme; gerçek Android/iOS OS izinleri; planlanan yemek onayı, tahlil paylaşım onayı/uzman doğrulaması, dosya/PDF yetkisi ve ilişki bitişinde erişimin kapanması. Gemini anahtarının istemciye verilmemesi, gerçek tahlillerin harici AI'ya gönderilmemesi ve mobilde tahlil analizi gösterilmemesi ayrıca doğrulanmalıdır.

Bu liste test gereksinimidir. Sentetik API/DB testi fiziksel sensör/cihaz, React DOM testi tarayıcı, tarayıcı testi Flutter doğrulaması sayılmaz. Mevcut test kanıtları ve açık eksikler [12](12_TEAM_PLAN_AND_DECISIONS.md)'dedir.

- [ ] Veri sorumlusu/KVKK, üçüncü taraf/yurt dışı aktarım ve olası sağlık/tıbbi cihaz iddiaları uzman değerlendirmesi.
- [ ] Kullanıcı sözleşmesi, aydınlatma, amaç bazlı izin/onay ve veri hakları/saklama/silme.
- [ ] Play Console/App Store sağlık politikaları, veri güvenliği ve izin gerekçeleri; desteklenen cihaz/OS kapsamı.
- [ ] Gerçek dağıtım HTTPS/secret/anahtar, güvenilir proxy ve çok örnekli ortak hız limiti.
- [ ] Üretim e-posta teslimi, yedek/geri yükleme, izleme/çökme/hata/audit ve kesinti temizliği.
- [ ] Gerçek ortam oturum/reset/Admin MFA, kategori/tahlil geri çekme ve dosya/cache/PDF erişim kontrolü.
- [ ] Yemekte kullanıcı onayı ve manuel devam; tahlilde paylaşım onayı/uzman doğrulaması, belirsizlik ve bilimsel iddia olmaması.
- [ ] İmzalı release, paket kimliği, ikon/görseller, destek kanalı; erişilebilirlik ve iki tema doğrulaması.

Sentetik demo, gerçek kullanıcıya açılış ve mağaza yayını ayrı aşamalardır; bu belge güncellemesi hiçbir yayın kapısını tamamlamaz.
