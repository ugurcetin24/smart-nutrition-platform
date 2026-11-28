using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Npgsql;
using SmartNutrition.Api.Data;
using SmartNutrition.Api.Features.Auth;
using SmartNutrition.Api.Features.Dietitians;

// One-off synthetic development account. This is not a production approval workflow.
try
{
    var root = Path.GetFullPath(args[0]);
    var apiPath = Path.Combine(root, "backend", "src", "SmartNutrition.Api");
    var config = new ConfigurationBuilder()
        .SetBasePath(apiPath)
        .AddJsonFile("appsettings.json")
        .AddJsonFile("appsettings.Development.json", optional: true)
        .AddUserSecrets(typeof(AppDbContext).Assembly, optional: true)
        .AddEnvironmentVariables()
        .Build();
    var connectionText = config.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(connectionText))
        throw new InvalidOperationException("Yerel API baglanti ayari bulunamadi.");
    var connection = new NpgsqlConnectionStringBuilder(connectionText);
    if (connection.Host is not ("localhost" or "127.0.0.1" or "::1") ||
        connection.Port != 5433 || connection.Database != "smart_nutrition")
        throw new InvalidOperationException("Bu arac yalniz localhost:5433/smart_nutrition gelistirme veritabaninda calisir.");
    connection.Timeout = 5;
    connection.CommandTimeout = 10;
    connection.IncludeErrorDetail = false;
    var policy = config.GetSection(RegistrationPasswordPolicy.SectionName).Get<RegistrationPasswordPolicy>()
        ?? throw new InvalidOperationException("Parola politikasi bulunamadi.");
    var password = "Limely!" + Convert.ToHexString(RandomNumberGenerator.GetBytes(10)) + "a7";
    if (policy.Validate(password).Count != 0)
        throw new InvalidOperationException("Uretilen parola mevcut politikaya uymuyor.");
    if (args.Contains("--check"))
    {
        var expected = new Dictionary<string, string> { ["public.users.id"] = "uuid", ["public.users.email"] = "text" };
        if (SchemaDifferences(expected, expected).Count != 0 ||
            SchemaDifferences(expected, new Dictionary<string, string> { ["public.users.id"] = "uuid" }).Count != 1 ||
            SchemaDifferences(expected, new Dictionary<string, string> { ["public.users.id"] = "text", ["public.users.email"] = "text" }).Count != 1)
            throw new InvalidOperationException("Sema kontrolunun kendi dogrulamasi basarisiz.");
        Console.WriteLine("Derleme, yerel hedef, parola politikasi ve sema karsilastirmasi kontrol edildi. DB baglantisi/yazma yapilmadi.");
        return 0;
    }

    var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connection.ConnectionString).Options;
    await using var database = new AppDbContext(options);
    var pendingMigrations = (await database.Database.GetPendingMigrationsAsync()).ToArray();
    if (pendingMigrations.Length > 0)
    {
        Console.WriteLine("Migration gecmisinde uygulanmamis gorunen kayitlar:");
        foreach (var migration in pendingMigrations) Console.WriteLine("  " + migration);
    }
    // Migration history can be absent after an existing schema was provisioned differently.
    // Check the actual model tables/column types instead of treating every history gap as incompatibility.
    var expectedColumns = database.Model.GetRelationalModel().Tables
        .SelectMany(table => table.Columns.Select(column => new KeyValuePair<string, string>(
            (table.Schema ?? "public") + "." + table.Name + "." + column.Name, column.StoreType)))
        .ToDictionary(x => x.Key, x => x.Value);
    var actualColumns = new Dictionary<string, string>();
    await database.Database.OpenConnectionAsync();
    await using (var command = database.Database.GetDbConnection().CreateCommand())
    {
        command.CommandText = """
            SELECT n.nspname, c.relname, a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod)
            FROM pg_catalog.pg_attribute a
            JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE a.attnum > 0 AND NOT a.attisdropped AND c.relkind IN ('r', 'p')
              AND n.nspname NOT IN ('pg_catalog', 'information_schema')
            """;
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            actualColumns[reader.GetString(0) + "." + reader.GetString(1) + "." + reader.GetString(2)] = reader.GetString(3);
    }
    var differences = SchemaDifferences(expectedColumns, actualColumns);
    if (differences.Count > 0)
    {
        Console.Error.WriteLine("Mevcut API modeline gore eksik veya farkli sutunlar:");
        foreach (var difference in differences) Console.Error.WriteLine("  " + difference);
        throw new InvalidOperationException("Hesap olusturulmadi. Sema uyumsuz; migration veya mevcut veri degistirilmedi.");
    }
    Console.WriteLine("API modelinin tablo ve sutun tipleri mevcut. Migration gecmisi degistirilmedi.");
    if (args.Contains("--diagnose"))
    {
        Console.WriteLine("Salt okunur inceleme tamamlandi. Hesap olusturulmadi.");
        return 0;
    }
    const string email = "diyetisyen.onizleme@example.test";
    var normalizer = new UpperInvariantLookupNormalizer();
    if (await database.Users.AnyAsync(x => x.Email == normalizer.NormalizeEmail(email)))
        throw new InvalidOperationException("Bu deneme e-postasi zaten mevcut. Hesap veya sifre degistirilmedi.");
    var hasher = new PasswordHasher<User>();
    await using var transaction = await database.Database.BeginTransactionAsync();
    var service = new DietitianApplicationService(database, normalizer, hasher, Options.Create(policy), TimeProvider.System);
    var user = await service.ApplyAsync(new DietitianApplicationRequest
    {
        Email = email,
        Password = password,
        DisplayName = "Limely Deneme Diyetisyeni",
        LicenseInfo = "Sentetik yerel gelistirme hesabi; gercek mesleki yeterlilik veya kimlik dogrulamasi degildir."
    }, CancellationToken.None);
    // Set flags only on this newly inserted synthetic identity, within the same transaction.
    database.Entry(user).Property(x => x.IsEmailVerified).CurrentValue = true;
    database.Entry(user.DietitianProfile!).Property(x => x.IsVerified).CurrentValue = true;
    await database.SaveChangesAsync();
    database.ChangeTracker.Clear();
    var saved = await database.Users.AsNoTracking().Include(x => x.DietitianProfile).SingleAsync(x => x.Id == user.Id);
    if (!saved.IsEmailVerified || saved.DietitianProfile?.IsVerified != true ||
        hasher.VerifyHashedPassword(saved, saved.PasswordHash, password) == PasswordVerificationResult.Failed)
        throw new InvalidOperationException("Yeni hesabin dogrulamasi basarisiz; islem geri alinacak.");
    await transaction.CommitAsync();
    Console.WriteLine();
    Console.WriteLine("YEREL DENEME HESABI OLUSTURULDU");
    Console.WriteLine("Giris: https://localhost:5173/giris");
    Console.WriteLine("E-posta: " + email);
    Console.WriteLine("Sifre: " + password);
    Console.WriteLine("Parola yalniz bu terminalde gosterilir; dosyaya kaydedilmez.");
    Console.WriteLine("Kayit, parola hash'i ve profil onayi DB'den kontrol edildi. Tarayici girisi kontrol edilmedi.");
    Console.WriteLine("Hesaba danisan veya saglik verisi eklenmedi; paneller bos baslar.");
    return 0;
}
catch (Exception error)
{
    // Do not leak connection strings, SQL parameters, credentials or driver diagnostics.
    if (error is InvalidOperationException && error.InnerException is null)
        Console.Error.WriteLine(error.Message);
    else
        Console.Error.WriteLine("Islem tamamlanamadi (" + error.GetType().Name + "). Yerel PostgreSQL ve API ayarlarini kontrol edin.");
    return 1;
}

static List<string> SchemaDifferences(IReadOnlyDictionary<string, string> expected, IReadOnlyDictionary<string, string> actual)
{
    var differences = new List<string>();
    foreach (var column in expected.OrderBy(x => x.Key))
    {
        if (!actual.TryGetValue(column.Key, out var actualType))
            differences.Add(column.Key + " eksik (beklenen: " + column.Value + ")");
        else if (column.Value != actualType)
            differences.Add(column.Key + " tip farki (beklenen: " + column.Value + ", mevcut: " + actualType + ")");
    }
    return differences;
}
