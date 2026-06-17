# dev-memreduct.ps1 — 编译 memreduct-viewstage.exe 供 cargo tauri dev 使用
# 用法: cd memreduct; .\dev-memreduct.ps1

$ErrorActionPreference = 'Stop'

$memreductDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outExe = Join-Path $memreductDir 'bin\64\memreduct-viewstage.exe'

# 查找 vcvarsall.bat
$vsRoots = @(
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Community",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Professional",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Enterprise",
    "${env:ProgramFiles}\Microsoft Visual Studio\18\Community",
    "${env:ProgramFiles}\Microsoft Visual Studio\18\Professional"
)

$vcvarsall = $null
foreach ($root in $vsRoots) {
    $candidate = Join-Path $root 'VC\Auxiliary\Build\vcvarsall.bat'
    if (Test-Path $candidate) {
        $vcvarsall = $candidate
        break
    }
}

if (-not $vcvarsall) {
    Write-Host '[ERROR] 未找到 Visual Studio (2022/2026)，请先安装 VS 并勾选 "使用 C++ 的桌面开发" 工作负载' -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] vcvarsall: $vcvarsall" -ForegroundColor Cyan

# 在 vcvarsall 环境中执行 msbuild
$msbuildCmd = @"
call "$vcvarsall" amd64 >nul 2>&1
msbuild "$memreductDir\memreduct.sln" -property:Configuration=Release -property:Platform=x64 -verbosity:minimal
if errorlevel 1 exit /b 1
"@

cmd /c $msbuildCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] msbuild 编译失败' -ForegroundColor Red
    exit 1
}

if (Test-Path $outExe) {
    $size = (Get-Item $outExe).Length / 1KB
    Write-Host "[OK] $outExe ({0:N0} KB)" -f $size -ForegroundColor Green
} else {
    Write-Host "[ERROR] 编译成功但未找到 $outExe" -ForegroundColor Red
    exit 1
}
