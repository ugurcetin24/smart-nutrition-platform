# 05 — Kalıcı veri modelleri, alanlar ve kısıtlar

Uygulanan modellerin kaynak inceleme tabanı: 22.11.2026 / `4f160b3`. U7 laboratuvar sözleşmesi 29.11.2026'da ortak onay teyidiyle eklenmiştir; henüz EF/model snapshot'ında uygulanmamıştır. Uygulama DB'sinin migration durumu sorgulanmamıştır. DTO ve HTTP kabul kuralları [06](06_API_CONTRACT.md), adlar/enum değerleri [04](04_NAMING_CONVENTIONS.md) içindedir.

## Tip ve gösterim

`?` nullable'dır. `uuid` PostgreSQL uuid, `instant` timestamptz/UTC, `date` saat dilimsiz takvim günü, `decimal` ölçek zorlamayan numeric, `integer` int32, `int64` bigint'tir. JSON decimal değerleri number'dır; null bilinmeyen değerdir, gerçek sıfıra dönüştürülmez. Genel yuvarlama/precision kararı verilmemiştir.

Aşağıdaki adlar EF property'lerinin camelCase gösterimidir; **HTTP yanıt alanı listesi değildir**. itemsJson/snapshotJson, deletedAt, position, hash ve güvenlik metadata'sı istemci DTO'suna eklenmez. Enum'lar DB'de string tutulur; değer sözlüğü 04'tedir. Ölçüm üst sınırları klinik öneri değildir.

## Kimlik ve uzmanlık

| Entity / tablo | Kalıcı alanlar |
|---|---|
| `User` / `users` | `id: uuid`, `createdAt: instant`, `credentialsVersion: int64`, `email: string`, `emailVerificationExpiresAt: instant?`, `emailVerificationLastSentAt: instant?`, `emailVerificationTokenHash: string?`, `isEmailVerified: boolean`, `lastUsedTotpStep: int64?`, `mfaRecoveryCodeHashes: list<string>` (text[]), `passwordHash: string`, `passwordResetExpiresAt: instant?`, `passwordResetLastSentAt: instant?`, `passwordResetTokenHash: string?`, `role: string`, `totpSecretProtected: string?`, `updatedAt: instant` |
| `ClientProfile` / `client_profiles` | `id: uuid`, `birthDate: date?`, `displayName: string`, `heightCm: decimal?`, `userId: uuid` |
| `DietitianProfile` / `dietitian_profiles` | `id: uuid`, `displayName: string`, `invitationCodeExpiresAt: instant?`, `invitationCodeHash: string?`, `isVerified: boolean`, `licenseInfo: string`, `userId: uuid` |
| `AuthSession` / `auth_sessions` | `id: uuid`, `absoluteExpiresAt: instant`, `createdAt: instant`, `idleExpiresAt: instant`, `isMfaVerified: boolean`, `lastSeenAt: instant`, `revokedAt: instant?`, `userId: uuid` |
| `RefreshToken` / `refresh_tokens` | `id: uuid`, `consumedAt: instant?`, `createdAt: instant`, `expiresAt: instant`, `familyId: uuid`, `revokedAt: instant?`, `role: string`, `tokenHash: string`, `userId: uuid` |
| `AuditEvent` / `audit_events` | `id: uuid`, `action: string`, `actorUserId: uuid`, `createdAt: instant`, `metadata: string?` (jsonb), `resourceId: uuid`, `resourceType: string` |

## İlişki ve paylaşım

| Entity / tablo | Kalıcı alanlar |
|---|---|
| `DietitianClientRelationship` / `dietitian_client_relationships` | `id: uuid`, `clientId: uuid`, `dietitianId: uuid`, `endedAt: instant?`, `requestedAt: instant`, `respondedAt: instant?`, `status: string` |
| `DataSharingPermission` / `data_sharing_permissions` | `id: uuid`, `category: string`, `consentRecordId: uuid?`, `createdAt: instant`, `isGranted: boolean`, `relationshipId: uuid`, `updatedAt: instant` |

## Beslenme ve günlük kayıtlar

| Entity / tablo | Kalıcı alanlar |
|---|---|
| `NutritionPlan` / `nutrition_plans` | `id: uuid`, `clientId: uuid`, `createdAt: instant`, `dailyCaloriesTargetKcal: decimal?`, `dailyWaterTargetMl: decimal?`, `dietitianId: uuid?`, `endDate: date?`, `itemsJson: string` (jsonb), `startDate: date`, `status: string`, `title: string`, `versionNumber: integer` |
| `NutritionPlanVersion` / `nutrition_plan_versions` | `id: uuid`, `createdAt: instant`, `nutritionPlanId: uuid`, `recordedByUserId: uuid`, `snapshotJson: string` (jsonb), `versionNumber: integer` |
| `MealLog` / `meal_logs` | `id: uuid`, `clientId: uuid`, `consumedAt: instant`, `createdAt: instant`, `deletedAt: instant?`, `foodAnalysisId: uuid?`, `mealType: string`, `note: string?`, `source: string` |
| `MealLogItem` / `meal_log_items` | `id: uuid`, `caloriesKcal: decimal?`, `carbsGrams: decimal?`, `displayName: string`, `fatGrams: decimal?`, `foodItemId: uuid?`, `isEstimated: boolean`, `mealLogId: uuid`, `position: integer`, `proteinGrams: decimal?`, `quantityGrams: decimal?`, `recipeId: uuid?` |
| `MealLogComment` / `meal_log_comments` | `id: uuid`, `authorUserId: uuid`, `createdAt: instant`, `mealLogId: uuid`, `parentCommentId: uuid?`, `text: string` |
| `WaterLog` / `water_logs` | `id: uuid`, `amountMl: decimal`, `clientId: uuid`, `consumedAt: instant`, `deletedAt: instant?`, `source: string` |
| `PersonalNutritionTarget` / `personal_nutrition_targets` | `clientId: uuid`, `dailyCaloriesTargetKcal: decimal?`, `dailyCarbsTargetGrams: decimal?`, `dailyFatTargetGrams: decimal?`, `dailyProteinTargetGrams: decimal?`, `dailyWaterTargetMl: decimal?` |
| `BodyMeasurement` / `body_measurements` | `id: uuid`, `bodyFatPercent: decimal?`, `chestCm: decimal?`, `clientId: uuid`, `deletedAt: instant?`, `hipCm: decimal?`, `measuredAt: instant`, `note: string?`, `source: string`, `waistCm: decimal?`, `weightKg: decimal?` |

## Görevler

| Entity / tablo | Kalıcı alanlar |
|---|---|
| `ClientTask` / `client_tasks` | `id: uuid`, `clientId: uuid`, `createdAt: instant`, `description: string`, `dietitianId: uuid`, `dueAt: instant?`, `isReminderEnabled: boolean`, `relationshipId: uuid`, `status: string`, `updatedAt: instant`, `versionNumber: integer` |
| `ClientTaskVersion` / `client_task_versions` | `id: uuid`, `clientTaskId: uuid`, `createdAt: instant`, `recordedByUserId: uuid`, `snapshotJson: string` (jsonb), `versionNumber: integer` |

## Sağlık aktarımı

| Entity / tablo | Kalıcı alanlar |
|---|---|
| `WearableConnection` / `wearable_connections` | `id: uuid`, `clientId: uuid`, `lastAttemptAt: instant?`, `lastErrorCode: string?`, `lastSyncStatus: string`, `lastSyncedAt: instant?`, `provider: string`, `status: string`, `versionNumber: integer` |
| `WearableRecord` / `wearable_records` | `id: uuid`, `clientId: uuid`, `exerciseType: string?`, `externalRecordId: string`, `isDeleted: boolean`, `metric: string`, `rawType: string`, `rawUnit: string`, `recordingMethod: string?`, `sourceId: string`, `sourceName: string?`, `updatedAt: instant`, `versionNumber: integer`, `wearableConnectionId: uuid` |
| `HealthMetricSample` / `health_metric_samples` | `id: uuid`, `clientId: uuid`, `endedAt: instant`, `isDeleted: boolean`, `rawValue: decimal`, `sampleKey: string`, `startedAt: instant`, `unit: string`, `value: decimal`, `wearableRecordId: uuid` |
| `ActivityLog` / `activity_logs` | `id: uuid`, `activityType: string`, `caloriesKcal: decimal?`, `clientId: uuid`, `createdAt: instant`, `distanceKm: decimal?`, `durationMinutes: decimal?`, `endedAt: instant?`, `externalRecordId: string?`, `isDeleted: boolean`, `rawDurationMinutes: decimal?`, `source: string`, `startedAt: instant`, `updatedAt: instant`, `versionNumber: integer`, `wearableConnectionId: uuid?`, `wearableRecordId: uuid?` |
| `WearableSyncBatch` / `wearable_sync_batches` | `id: uuid`, `batchId: uuid`, `clientId: uuid`, `committedAt: instant`, `requestHash: string`, `responseJson: string` (jsonb), `wearableConnectionId: uuid` |

## İlişkiler ve veri bütünlüğü

- User → ClientProfile ve User → DietitianProfile bağlantıları ayrı UUID ve unique userId ile 0..1'dir; iki profil aynı hesapta birlikte bulunabilir. Profiller/sağlık kayıtları User.id ile karıştırılmaz. Kayıt User+ClientProfile, uzman başvurusu User+DietitianProfile olarak atomiktir.
- User.email ICU `users_email_case_insensitive` collation ile harf duyarsız, aksanı ayırt eden unique'dir. PasswordHasher çıktısı ve 64 hex karakter hash'ler sunucudadır. credentialsVersion negatif olamaz. TOTP sırrı korumalı, kurtarma kodları text[] hash'lerdir.
- E-posta/reset hash ve expiry birlikte bulunur; dolu hash için lastSentAt gerekir. Ham token saklanmaz. AuthSession için createdAt ≤ lastSeenAt < idleExpiresAt ≤ absoluteExpiresAt; revokedAt nullable'dır. Refresh token hash unique, aynı ailede tüketilmemiş/iptal edilmemiş en fazla bir kayıt vardır. Süre ve temizlik politikası 06'dadır.
- DietitianClientRelationship.clientId → ClientProfile, dietitianId → DietitianProfile. Client başına `status='active'` kısmi unique, aynı client+dietitian için pending kısmi unique vardır. Geçmişler korunur; yeni ilişki eski izni devralmaz.
- DataSharingPermission.relationshipId zorunlu FK, (relationshipId,category) unique'dir. Kategori check'i yalnız beş mevcut değeri kabul eder; consentRecordId mevcut uygulamada null olmak zorundadır. ConsentRecord tablosuna çalışan FK yoktur. Su kategorisi için yeni izin/backfill eklenmemiştir.
- NutritionPlan.clientId zorunlu, dietitianId nullable FK'dir; null kişisel programdır. Client başına tek active kısmi unique vardır. Title/tarih/hedef/items güncel içeriktir; itemsJson JSONB'dir. NutritionPlanVersion (nutritionPlanId,versionNumber) unique, snapshotJson JSONB ve recordedByUserId User FK'sidir; içerik geçmişi değişmez.
- NutritionPlanItem ayrı tablo değildir. JSONB içindeki alanları: id, nutritionPlanId, nullable dayOfWeek, mealType, description, nullable recommendedQuantity, sortOrder, nullable recipeId ve alternativeGroupId. Gün null veya ISO 1–7; aynı içerikte sortOrder tekildir. Alternatif grup aynı gün/mealType'ta en az iki öğedir. recipeId mevcut yazmada null'dır. Status değişimi içerik sürümü değildir.
- MealLog → MealLogItem 1:N; alt kalemler ayrı tabloda ve dahili position ile istek sırasındadır. Kalem referans sütunları bulunur, fakat FoodItem/Recipe/FoodAnalysis tabloları yoktur; mevcut yazma dolu UUID'leri reddeder. PATCH items verilirse kalemler transaction içinde yenilenir; eski tüketimden gram→besin hesabı yapılmaz.
- MealLogComment.mealLogId → MealLog, authorUserId → User; parentCommentId aynı öğündeki kök yorumu işaret eder. Yanıtın yanıtı desteklenmez. Yorumlar soft-deleted öğün üzerinden okunamaz.
- MealLog/WaterLog/BodyMeasurement dahili deletedAt ile normal okumalardan çıkarılır. Aktif kayıtlar clientId+consumedAt veya measuredAt+id indeksleriyle okunur. Soft delete, kalıcı veri silme/retention kararı değildir.
- WaterLog.amountMl pozitif sonlu numeric/mL'dir; kaynak/tarih dışında hedef veya günlük toplam sütunu yoktur. Daily total/history hesaplanır, entity değildir.
- PersonalNutritionTarget anahtarı ClientId'dir, ayrıca id veya timestamp yoktur. Beş hedef nullable'dır; dolu kcal ≤10000, makroların her biri ≤1000 g, su ≤15000 mL ve hepsi >0. Bunlar teknik kayıt sınırlarıdır; klinik öneri/otomatik hesap veya program hedefi değildir.
- BodyMeasurement en az bir ölçüm ister; kg/cm >0, bodyFatPercent 0–100, not en çok 2000 karakterdir. Kaynak enumu kalıcıdır; manuel CRUD onu sonradan değiştirmez.
- ClientTask özgün ilişki, danışan ve atayan uzman FK'lerini korur. Başlangıç pending/version 1/reminder false; dueAt nullable'dır. ClientTaskVersion (clientTaskId,versionNumber) unique, değişmez snapshot ve aktör FK'si taşır. completedAt sütunu yoktur; tamamlama anı completed snapshot createdAt'inden anlaşılır.
- WearableConnection (clientId,provider), WearableRecord (wearableConnectionId,sourceId,rawType,externalRecordId), HealthMetricSample (wearableRecordId,sampleKey) ve WearableSyncBatch (wearableConnectionId,batchId) unique'dir. provider bağlantıdan türetilir; HealthMetricSample metric/rawUnit'i kaynak başlığından projekte eder, bu iki alan ayrı sample sütunu değildir.
- ActivityLog manuel ve wearable kaynağını aynı kanonik entity'de tutar. WearableRecord/örnek/aktivite tombstone'ları ve receipt kalıcıdır; missing pencere silme değildir. Tam sağlık kısıt/birim/sürüm/tekilleştirme kaynağı [20](20_HEALTH_DATA_SYNC_CONTRACT.md)'dir.
- Geçmiş ve sağlık sahipliği FK'lerinde NoAction/Restrict kullanılır; ilişkileri otomatik silen genel cascade veya süresiz saklama kararı çıkarılmaz. Migration ve silme güvenliği [11](11_SECURITY_AND_RELEASE.md)'dedir.

## Planlanan modeller — henüz kalıcı şema değil

Aşağıdaki önceki sözlük alanları korunur; tablo, migration veya kesin yeni DTO oluşturma onayı sayılmaz. Kesinleşmemiş parçalar uygulamadan önce ortak karara bağlanır.

| Kavram | Korunan alanlar / açık sınır |
|---|---|
| FoodItem | id, name, servingBasisGrams, caloriesKcal, proteinGrams, carbsGrams, fatGrams, dataSource; aynı gram temeli, sağlayıcı/lisans ve birleştirme açık |
| FoodAnalysis | id, clientId, status, createdAt, nullable completedAt/modelVersion/suggestions/errorCode; suggestions adı/miktar/makro/confidence içerir; limitations HTTP kökünde, dahili saklama biçimi açık |
| Recipe | id, userId, name, createdAt; bileşen/porsiyon/görünürlük/geçmiş açık |
| LabReport / LabResult / LabInsight / ConsentRecord | Önceki alan adaylarının yerini aşağıdaki onaylı U7 sözleşmesi alır; henüz kalıcı tablo yoktur |

Bildirim ve PDF için kesinleşmiş kalıcı model yoktur. Bu kavramlar onaylı kapsamdan çıkarılmamıştır; gereksinimler [10](10_AI_SPEC.md), açık kararlar [12](12_TEAM_PLAN_AND_DECISIONS.md)'dedir.

## U7 — onaylı laboratuvar şeması, henüz uygulanmadı

Bu bölüm 29.11.2026 ortak onay teyidinin geliştirme sözleşmesidir; mevcut EF, migration veya çalışan API beyanı değildir. Manuel ve belgeli kayıt aynı LabReport'tur. Belge yüklemek yalnız rapor/belge metadata'sı oluşturur; doğrulanmış sonuç oluşturmaz. Enum sözlüğü [04](04_NAMING_CONVENTIONS.md)'tedir.

| Entity / tablo | Kalıcı alanlar |
|---|---|
| `LabReport` / `lab_reports` | `id: uuid`, `clientId: uuid`, `createdByUserId: uuid`, `source: string`, `labName: string?`, `collectedAt: instant?`, `collectedDate: date?`, `createdAt: instant`, `updatedAt: instant`, `versionNumber: integer`, `deletedAt: instant?` |
| `LabReportDocument` / `lab_report_documents` | `id: uuid`, `labReportId: uuid`, `uploadedByUserId: uuid`, `originalFileName: string`, `mediaType: string`, `sizeBytes: int64`, `sha256: string`, `storageKey: string`, `pageCount: integer?`, `status: string`, `createdAt: instant`, `deletedAt: instant?`, `purgedAt: instant?` |
| `LabReportShare` / `lab_report_shares` | `id: uuid`, `labReportId: uuid`, `relationshipId: uuid`, `isGranted: boolean`, `createdAt: instant`, `updatedAt: instant` |
| `LabResult` / `lab_results` | `id: uuid`, `labReportId: uuid`, `position: integer`, `testCode: string?`, `testName: string?`, `rawValue: string?`, `value: decimal?`, `comparator: string?`, `rawUnit: string?`, `unit: string?`, `rawReference: string?`, `referenceLow: decimal?`, `referenceHigh: decimal?`, `sourceFlag: string?`, `flag: string`, `sourceDate: date?`, `sourceAt: instant?`, `dateRaw: string?`, `dateKind: string`, `source: string`, `reviewStatus: string`, `reviewReason: string?`, `warnings: list<string>` (jsonb), `sourceAnchors: list<object>` (jsonb) |
| `LabProcessingJob` / `lab_processing_jobs` | `id: uuid`, `labReportId: uuid`, `documentId: uuid`, `requestedByUserId: uuid`, `relationshipId: uuid`, `consentRecordId: uuid`, `inputVersionNumber: integer`, `documentSha256: string`, `status: string`, `attemptCount: integer`, `createdAt: instant`, `startedAt: instant?`, `completedAt: instant?`, `errorCode: string?`, `parserVersion: string?`, `ocrVersion: string?`, `modelVersion: string?`, `extractionJson: string?` (jsonb) |
| `LabReportVersion` / `lab_report_versions` | `id: uuid`, `labReportId: uuid`, `versionNumber: integer`, `recordedByUserId: uuid`, `createdAt: instant`, `reason: string`, `snapshotJson: string` (jsonb) |
| `LabReportVerification` / `lab_report_verifications` | `id: uuid`, `labReportVersionId: uuid`, `verifiedByUserId: uuid`, `dietitianId: uuid`, `relationshipId: uuid`, `consentRecordId: uuid`, `documentSha256: string?`, `createdAt: instant` |
| `LabInsight` / `lab_insights` | `id: uuid`, `labReportVersionId: uuid`, `relationshipId: uuid`, `authorUserId: uuid`, `createdAt: instant`, `summary: string`, `method: string`, `modelVersion: string?`, `limitations: list<string>` (jsonb) |
| `ConsentRecord` / `consent_records` | `id: uuid`, `userId: uuid`, `relationshipId: uuid`, `consentType: string`, `scope: string`, `granted: boolean`, `policyVersion: string`, `policyTextHash: string`, `recordedAt: instant`, `withdrawnAt: instant?` |

### Sahiplik, paylaşım ve onay bütünlüğü

- LabReport.clientId → ClientProfile, createdByUserId/uploadedByUserId/recordedByUserId/authorUserId/verifiedByUserId → User. Yükleyen veya manuel kayıt oluşturan uzman sahipliği devralmaz. Tahlil verisi danışanın ilişki geçmişinden bağımsız korunur; saklama süresi [11](11_SECURITY_AND_RELEASE.md)'e tabidir.
- Belge/sonuç/paylaşım/iş/sürüm labReportId alanları LabReport FK'sidir. İş documentId → LabReportDocument, iş ve doğrulama consentRecordId → ConsentRecord; paylaşım/iş/doğrulama/not relationshipId → DietitianClientRelationship ve doğrulama dietitianId → DietitianProfile FK'sidir. Doğrulama labReportVersionId → LabReportVersion'dır. İşin giriş `(labReportId,inputVersionNumber)` çifti aynı raporun sürümünü gösterir. Belge–rapor ve rapor–ilişki danışan eşleşmeleri ile doğrulayan kullanıcı–uzman–ilişki eşleşmesi aynı yetkili transaction'da denetlenir; yabancı UUID'lerle çapraz bağ kurulamaz.
- Raporun 0..1 orijinal belgesi vardır; labReportId belge tablosunda unique'dir. Manuel raporda belge yoktur. Orijinal dosya yerinde değiştirilmez; yeni dosya yeni rapordur. Aynı dosya hash'i farklı danışanlar arasında tekilleştirme veya varlık sorgusu oluşturmaz.
- LabReportShare `(labReportId,relationshipId)` unique'dir. Belge bazlı seçim rapor kapsamındadır; sonuçlar/geçmiş aynı seçime tabidir. Yüklemede paylaşım satırı otomatik açılmaz. Yeni ilişki eski seçimleri devralmaz. Manuel kayıt oluşturma amacı açık onay metninde ayrıca belirtilir; uzman tarafından oluşturulan rapor yalnız bu yetkili ilişkiye, oluşturma transaction'ında paylaşılır; başka raporu açmaz.
- ConsentRecord ilişki kapsamındadır; userId ilişkinin danışanının User.id değeri olmalıdır. consentType=lab_report_sharing, scope=relationship ve güncel politika metni gerekir. İlişki, kullanıcı, kapsam ve amaç eşleşmesi sunucuda denetlenir. Kabul geçmişi değişmez; geri çekmede granted geçmişi yeniden yazılmaz, withdrawnAt kaydedilir. Yeni kabul yeni kayıt oluşturur.
- DataSharingPermission.category altıncı `lab_reports` değerini kabul edecek şekilde genişletilecektir. Mevcut beş kategoride consentRecordId null kalır; lab_reports/isGranted=true için dolu FK gerekir. False izin önceki onay FK'sini kanıt olarak tutabilir. FK tek başına geçerlilik sağlamaz: doğru kullanıcı/ilişki/amaç ve withdrawnAt=null her işlemde kontrol edilir. Yeni kayıtlar/backfill grant üretmez.
- Geçmiş/sağlık sahipliği FK'leri NoAction/Restrict yaklaşımını korur; kalıcı silme onaylı politika ile açık işlem sırasından yürür. Raporun silinmesi çocuk sağlık verisini erişilebilir bırakmaz.

### Değer, tarih ve çıkarım bütünlüğü

- Ham değer/birim/referans/durum çıkarım kanıtıdır; extractionJson ve önceki snapshot'lar korunur. Uzman düzeltmesi güncel alanları değiştirir, önceki kanıtı ezmez. Bilinmeyen değer null'dır; 0 veya negatif sayı kendiliğinden geçersiz sayılmaz. `<0,10` değeri `less_than` ile saklanır; eşit sonuç gibi kullanılmaz.
- Taslakta eksik testName/value/unit bulunabilir. accepted satırda boş olmayan testName ve bir ham sonuç gösterimi gerekir; sayı olmayan sonuç rawValue ile kalır. excluded satırda reviewReason gerekir. Eksik referans/birim belgede gerçekten yoksa satır accepted olabilir; flag yine unknown'dur. Uyarı kodları sağlık değeri içermez.
- Birim/analit ve iki taraflı referans güvenilir ve uyumluysa, kesin sayısal değer için referenceLow ≤ value ≤ referenceHigh normaldir. Eksik/ters aralık, belirsiz birim/analit, pending_review/excluded satır veya eşitsizlikli/nitel değer unknown'dur. Tek taraflı ve alt gruba bağlı aralıklar ilk sürümde ham korunur; klinik eşik/dönüşüm tablosu uydurulmaz. sourceFlag L/N/H metnidir; flag ile çelişkisi inceleme uyarısıdır.
- collectedAt/collectedDate aynı anda dolamaz; yalnız gerçekten bilinen ve ortak örnek alma zamanını ifade eder. Toplu PDF'de satırlar farklı tarihler taşıyabilir. sourceAt açık offsetli kaynak zamanı, sourceDate yalnız takvim günüdür; aynı anda dolamaz. dateKind collection/result/unknown ile anlamı, dateRaw ile özgün metni korur. Offset veya tarih anlamı tahmin edilmez; bilinmeyen tarih uploaded/createdAt ile doldurulmaz.
- sourceAnchors öğesi `{pageNumber,bbox}` biçimindedir; pageNumber 1'den başlar, bbox `[left,top,right,bottom]` orijinal görüntülenen sayfanın 0..1 koordinatlarıdır. OCR döndürme/deskew dönüşümü geriye eşlenir. Manuel satırda boş listedir. extractionJson ham alanları ve gerektiğinde teknik güven skorunu saklar; skor klinik güven veya doğrulama değildir.
- `(labReportId,position)` unique; konum ≥0. Aktif raporlar clientId+createdAt+id ile, sonuçlar labReportId+position ile indekslenir. Boyut/sayfa/sürüm/deneme sayıları uygun pozitif veya sıfır kısıtları taşır; sonlu decimal kapasite aşımı reddedilir, sessiz yuvarlama yapılmaz.

### Sürüm, doğrulama, not ve iş bütünlüğü

- versionNumber 1'den başlar; `(labReportId,versionNumber)` unique ve snapshot değişmezdir. Metadata/sonuçta gerçek değişiklik veya başarıyla uygulanan yeni çıkarım yeni sürüm üretir. Yalnız durum/paylaşım/polling içerik sürümü değildir. Sonuç UUID'si düzeltmede korunur; çıkarılan satır kaybı geçmişi silmez. PATCH gerekçesini uzman verir; ilk yükleme/manuel oluşturma/iş tamamlama sürümlerinde sunucu teknik reason üretir. Yeni çıkarım satırları pending_review'dur; önceki kabul kararı yeni çıkarıma taşınmaz.
- Doğrulama belirli LabReportVersion FK'sine bağlıdır; bir sürüm için en fazla bir doğrulama vardır. Hiç doğrulama yoksa unverified, güncel sürüm doğrulanmışsa verified, yalnız eski sürüm doğrulanmışsa stale türetilir. Doğrulama geçerli erişim altında accepted/excluded kararları tamamlanmış, en az bir accepted satırlı sürümde yapılır. Aktör ve kaynak kanıtıdır; belge/laboratuvarın klinik gerçekliğine garanti değildir.
- LabInsight.labReportVersionId → LabReportVersion; labReportId bu ilişkiden çözülür. Not/kurallı açıklama append-only'dir, eski sürüm kaydı güncel diye sunulmaz. expert_note yazarı uzmandır; reference_rules metni yalnız sunucu üretir, modelVersion null'dır. Notlar özgün ilişkiye bağlıdır; yeni ilişkiye otomatik aktarılmaz. Sonraki uzmana not aktarımı ayrıca kapsam kararı gerektirir.
- İş giriş sürümünü ve değişmez dosya hash'ini yakalar. labReportId üzerinde queued/processing için kısmi unique gerekir; süreç yeniden başladığında kalıcı iş durumu uzlaştırılır. Başlatma, dosya okuma ve sonucu uygulama aşamalarında güncel yetki denetlenir. İzin/onay/ilişki/silme iptalinde iş cancelled olur; geç tamamlanan çıktı rapora uygulanmaz. Sürüm değişmişse iş failed/conflict olur, uzman düzeltmesini ezmez.
- Yazma/kuyruk sonucu/iptal aynı ClientProfile ve ilgili kaynak kilit sırasıyla serialize edilir; aktörün güncel uzmanlığı transaction içinde yeniden denetlenir. extractionJson, snapshot ve fiziksel türevlerin saklama/silme politikası orijinalle birlikte [11](11_SECURITY_AND_RELEASE.md)'e tabidir. Burada yeni broker veya genel iş altyapısı seçilmez.

## Migration sınırı

Kaynakta 20 migration vardır; sonuncu `20261118230136_AddWaterLogSharingCategory`dır. Görev ve sağlık migration'ları sırasıyla `20261118204842_AddClientTasks`, `20261118222117_AddHealthDataSync`tir. Bunlar uygulama DB'sine uygulanmış kabul edilmez.

Yeni modül/kategori migration'larının veri bulunan Down işlemlerini reddeden korumaları vardır; var olan migration silinmez/yeniden adlandırılmaz. Güncel model/snapshot ile gerçek DB uyumu ayrı test/dağıtım kontrolüdür; bu dokümantasyon görevinde EF komutu veya DB bağlantısı çalıştırılmadı.
