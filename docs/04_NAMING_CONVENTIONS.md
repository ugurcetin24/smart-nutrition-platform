# 04 — Kanonik isimler ve terminoloji

Bu belge yalnız adlandırma kaynağıdır. Kalıcı alan/tip/ilişkiler [05](05_DATA_DICTIONARY.md), method/route/DTO/yetki [06](06_API_CONTRACT.md) içindedir. Bir kavramın burada bulunması uygulanmış tablo veya endpoint olduğu anlamına gelmez.

## Uygulanan kavramlar

| Kavram | Kanonik ad |
|---|---|
| Hesap / danışan / uzman profili | User, ClientProfile, DietitianProfile |
| Web oturumu / mobil refresh geçmişi | AuthSession, RefreshToken |
| Diyetisyen–danışan ilişkisi / kategori paylaşımı | DietitianClientRelationship, DataSharingPermission |
| Beslenme programı / içerik sürümü / program kalemi | NutritionPlan, NutritionPlanVersion, NutritionPlanItem |
| Seçili sürümle günlük karşılaştırma | NutritionPlanMealComparisonResponse, NutritionPlanMealComparison, MealLogNutritionSummary, NutritionValueSummary |
| Gerçek tüketim / tüketilen kalem / yorum | MealLog, MealLogItem, MealLogComment |
| Su / günlük toplam DTO'su | WaterLog, WaterLogDailyTotalResponse |
| Programsız kişisel hedefler | PersonalNutritionTarget |
| Vücut ölçümü | BodyMeasurement |
| Danışan görevi / değişmez görev sürümü | ClientTask, ClientTaskVersion |
| Aktarım bağlantısı / native kaynak başlığı | WearableConnection, WearableRecord |
| Normalize sağlık örneği / aktivite / aktarım makbuzu | HealthMetricSample, ActivityLog, WearableSyncBatch |
| Denetim olayı | AuditEvent |

NutritionPlanItem ayrı EF tablosu değildir; program/snapshot içindeki kalemdir. “Plan/program” aynı kavramdır. MealLog gerçek tüketim, NutritionPlanItem tavsiyedir. ClientTask C# asenkron Task tipi veya bildirimle eşanlamlı değildir.

## Korunan gelecek kapsamı

FoodItem (hibrit besin kataloğu), Recipe (özel tarif) ve FoodAnalysis (görsel tahmin) adları korunur; alan adayları [05](05_DATA_DICTIONARY.md)'tedir. Laboratuvar adları aşağıdaki U7 sözleşmesinde kesinleşmiştir. Bu gelecek modellerin mevcut EF kaydı/servisi yoktur. Bildirim/PDF için kesinleşmemiş yeni entity, enum veya DTO adı türetilmez.

## U7 — onaylı laboratuvar adları, henüz uygulanmadı

29.11.2026 tarihli kullanıcı teyidi ortak onayı kaydeder. Şema [05](05_DATA_DICTIONARY.md), HTTP/DTO [06](06_API_CONTRACT.md), güvenlik [11](11_SECURITY_AND_RELEASE.md) kaynağıdır. Bu bölüm mevcut kodda kategori veya endpoint açmaz.

| Kavram | Kanonik ad |
|---|---|
| Danışana ait rapor / sonuç satırı | LabReport / LabResult |
| Orijinal belge / raporun ilişkiye paylaşılması | LabReportDocument / LabReportShare |
| Yerel metin/OCR çıkarım işi | LabProcessingJob |
| Değişmez içerik sürümü / uzman doğrulama kanıtı | LabReportVersion / LabReportVerification |
| Sürüme bağlı uzman notu veya kurallı açıklama | LabInsight |
| Amaç ve ilişki kapsamlı açık onay kanıtı | ConsentRecord |

| Tip/kod grubu | JSON değerleri |
|---|---|
| Yeni DataSharingPermission.category | lab_reports; mevcut beş kategori ayrıca korunur |
| LabReportSource / LabResultSource | document, manual / pdf_text, ocr, manual |
| LabDocumentStatus | quarantined, clean, rejected, pending_deletion, deleted |
| LabProcessingStatus | queued, processing, succeeded, failed, cancelled |
| LabVerificationStatus (türetilen) | unverified, verified, stale |
| LabResultReviewStatus | pending_review, accepted, excluded |
| LabResultChange.operation | add, update, exclude |
| LabFlag | low, normal, high, unknown |
| LabValueComparator | equal, less_than, less_than_or_equal, greater_than, greater_than_or_equal |
| LabDateKind | collection, result, unknown |
| LabInsightMethod | expert_note, reference_rules |
| ConsentRecord.consentType / scope | lab_report_sharing / relationship |

Belgedeki L/N/H metni `sourceFlag`tır; `flag` sunucunun referans karşılaştırmasıdır. İkisi aynı alan değildir. Çıkarım başarısı uzman doğrulaması değildir; FoodAnalysisStatus laboratuvar işlerinde kullanılmaz. `processing` operasyonel durumdur; raporda henüz iş yoksa processingStatus null'dır.

Ortak metadata DTO'su LabReportSummaryResponse, içindeki belge özeti LabDocumentSummary'dir. Sonuç, iş, paylaşım, sürüm, doğrulama ve not DTO'ları sırasıyla LabResultResponse, LabProcessingResponse, LabReportShareResponse, LabReportVersionInfo/LabReportVersionResponse, LabReportVerificationResponse ve LabInsightResponse adlarını kullanır. İstek adları ve alanları yalnız [06](06_API_CONTRACT.md)'da tanımlanır; aynı amaç için mobil/web kopyası üretilmez.

## Kimlik ve dil kuralları

- userId User.id, clientId ClientProfile.id, dietitianId DietitianProfile.id anlamındadır; birbirlerinin yerine kullanılamaz. Dış kaynağın externalRecordId değeri string'dir, UUID olması gerekmez.
- C# tip/property PascalCase, Dart/TypeScript property camelCase; aynı kavram ve JSON anahtarı korunur. JSON camelCase, PostgreSQL tablo/sütun adları snake_case, tablolar çoğuldur.
- C# dosyaları PascalCase.cs, Dart dosyaları snake_case.dart; React bileşenleri PascalCase.tsx, yardımcılar camelCase.ts; mevcut feature düzeni korunur. HTTP kaynakları çoğul kebab-case ve `/api/v1` altındadır.
- MealLog yerine FoodRecord, aynı login için SignIn/Authenticate veya farklı istemciye ikinci yanıt modeli üretilmez. Aynı platformda sözleşme modelleri gereksiz kopyalanmaz.
- Birim adları açıktır: Kcal, Grams, Ml, Kg, Cm, Percent, Minutes, Km, Bpm. `...At` instant, `...Date` takvim günüdür. DayOfWeek ISO 1=Pazartesi…7=Pazar; null tüm günlerdir.
- Yeni boolean'larda is/has kullanımı tercih edilir; mevcut ConsentRecord.granted sırf bu nedenle isGranted yapılmaz.
- Dal, commit/PR başlığı, dosya, klasör ve modül adlarında geliştirme aracı adı kullanılmaz; proje amacı esas alınır. İşlem/yazma izinleri [AGENTS.md](../AGENTS.md) içindedir.

## Uygulanan enum ve kodlar

| Tip/kod grubu | JSON değerleri |
|---|---|
| UserRole | client, dietitian, admin |
| MealType | breakfast, lunch, dinner, snack, other |
| RelationshipStatus | pending, active, rejected, ended |
| NutritionPlanStatus | draft, active, archived |
| RecordSource | manual, wearable, ai_assisted |
| ClientTaskStatus | pending, in_progress, completed, cancelled |
| DataSharingPermission.category | nutrition_plans, meal_logs, body_measurements, client_tasks, water_logs |
| WearableConnection.provider | health_connect, health_kit |
| WearableConnection.status / lastSyncStatus | active, revoked / never, succeeded, failed |
| Health metric | steps, distance, exercise, active_energy, heart_rate |
| Sync operation / hesaplama politikası | upsert, delete / conservative_overlap_v1 |

Enum'un sözlükte bulunması her endpointin bütün değerleri kabul ettiği anlamına gelmez. Örneğin manuel öğün/su/ölçüm POST'u yalnız manual kabul eder. integer enum kabul edilmez. C# AiAssisted/Dart aiAssisted farklı yazılsa da JSON ai_assisted kalır.

FoodAnalysisStatus için pending/processing/completed/failed gelecekteki sözlük değerleridir; henüz çalışan enum/endpoint değildir. Laboratuvarın onaylı fakat uygulanmamış kodları U7 tablosundadır.

## Değişiklik kuralı

Önce mevcut ad, alan ve route'u ara. Ortak sözleşme değişikliği iki geliştiricinin açık onayını gerektirir; güncel kullanıcı teyidi yeterlidir. Kod–belge çelişkisi yeni alias veya sessiz sözleşme değişikliğiyle giderilmez; somut fark [12](12_TEAM_PLAN_AND_DECISIONS.md)'de izlenir. Belge yazma ve Git izinleri sözleşme onayından ayrı olarak AGENTS.md'ye tabidir.
