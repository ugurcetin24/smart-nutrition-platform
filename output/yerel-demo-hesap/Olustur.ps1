#requires -Version 7.0
param([switch] $ValidateOnly, [switch] $Diagnose)

$ErrorActionPreference = 'Stop'
$repoPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$apiBin = Join-Path $repoPath 'backend/src/SmartNutrition.Api/bin/Debug/net10.0'
if (-not (Test-Path -LiteralPath (Join-Path $apiBin 'SmartNutrition.Api.dll'))) {
    throw 'Mevcut API derlemesi bulunamadi. Once projeyi normal sekilde derleyip baslatin.'
}
$taskTemp = Join-Path ([IO.Path]::GetTempPath()) ('limely-demo-account-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $taskTemp | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Program.cs') -Destination $taskTemp
$escapedBin = [System.Security.SecurityElement]::Escape($apiBin)
$projectText = @"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <NuGetAudit>false</NuGetAudit>
    <RestoreSources></RestoreSources>
  </PropertyGroup>
  <ItemGroup>
    <FrameworkReference Include="Microsoft.AspNetCore.App" />
    <Reference Include="$escapedBin/*.dll" />
  </ItemGroup>
</Project>
"@
$projectPath = Join-Path $taskTemp 'LocalDemoAccount.csproj'
[IO.File]::WriteAllText($projectPath, $projectText)
[IO.File]::WriteAllText((Join-Path $taskTemp 'NuGet.Config'), '<configuration><packageSources><clear /></packageSources></configuration>')
& dotnet build $projectPath --nologo --verbosity quiet
if ($LASTEXITCODE -ne 0) { throw 'Yerel hesap araci derlenemedi; veritabanina yazilmadi.' }
$programPath = Join-Path $taskTemp 'bin/Debug/net10.0/LocalDemoAccount.dll'
$runArgs = @($programPath, $repoPath)
if ($ValidateOnly) { $runArgs += '--check' }
if ($Diagnose) { $runArgs += '--diagnose' }
& dotnet @runArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Islem durdu. Yukaridaki migration ve sutun listesini paylasabilirsiniz; baglanti sifresini paylasmayin.' -ForegroundColor Yellow
    exit $LASTEXITCODE
}
