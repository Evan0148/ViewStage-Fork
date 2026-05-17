param(
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "===== ViewStage 兼容版构建 =====" -ForegroundColor Cyan
Write-Host "目标: Windows 10 全版本支持 (1507-)" -ForegroundColor Cyan
Write-Host ""

$originalConfig = Join-Path $ProjectRoot "src-tauri\tauri.conf.json"
$backupConfig = Join-Path $ProjectRoot "src-tauri\tauri.conf.json.bak"
$compatConfig = Join-Path $ProjectRoot "src-tauri\tauri.conf.compat.json"

if (-not (Test-Path $compatConfig)) {
    Write-Error "找不到兼容配置: $compatConfig"
    exit 1
}

Copy-Item $originalConfig $backupConfig -Force
Write-Host "[1/4] 原始配置已备份"

Copy-Item $compatConfig $originalConfig -Force
Write-Host "[2/4] 已切换为兼容配置 (downloadBootstrapper)"

Write-Host "[3/4] 开始构建..." -ForegroundColor Yellow

if (-not $SkipBuild) {
    Set-Location $ProjectRoot
    cargo tauri build --bundles nsis,msi

    if ($LASTEXITCODE -ne 0) {
        Write-Error "构建失败!"
        Copy-Item $backupConfig $originalConfig -Force
        exit 1
    }

    $releaseDir = Join-Path $ProjectRoot "src-tauri\target\release"
    $nsisDir = Join-Path $releaseDir "bundle\nsis"
    $msiDir = Join-Path $releaseDir "bundle\msi"

    if (Test-Path $nsisDir) {
        Get-ChildItem $nsisDir -Filter "ViewStage_*.exe" | ForEach-Object {
            $newName = $_.Name -replace "ViewStage_", "ViewStage_Compat_"
            Rename-Item $_.FullName -NewName $newName
            Write-Host "  安装包: $newName"
        }
    }

    if (Test-Path $msiDir) {
        Get-ChildItem $msiDir -Filter "ViewStage_*.msi" | ForEach-Object {
            $newName = $_.Name -replace "ViewStage_", "ViewStage_Compat_"
            Rename-Item $_.FullName -NewName $newName
            Write-Host "  MSI: $newName"
        }
    }
}

Write-Host "[4/4] 恢复原始配置"
Copy-Item $backupConfig $originalConfig -Force
Remove-Item $backupConfig -Force

Write-Host ""
Write-Host "===== 兼容版构建完成 =====" -ForegroundColor Green
