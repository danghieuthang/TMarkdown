# Script dong goi ban phat hanh TMarkdown cho Windows
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   TMarkdown - Dong goi Ban phat hanh Windows  " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Nap PATH cho Go va Wails
$env:Path = "$env:USERPROFILE\go\bin;C:\Program Files\Go\bin;" + $env:Path

# 2. Tao thu muc release
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }
$releaseDir = Join-Path $scriptDir "release"

if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

# 3. Thuc thi Wails build sach
Write-Host "`n[*] Dang bien dich frontend va dong goi ung dung native Wails..." -ForegroundColor Green
wails build -clean

$exePath = Join-Path $scriptDir "build\bin\TMarkdown.exe"
if (Test-Path $exePath) {
    $zipPath = Join-Path $releaseDir "TMarkdown-windows-x64.zip"
    Write-Host "`n[*] Dang nen tep thuc thi vao: $zipPath..." -ForegroundColor Green
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path $exePath -DestinationPath $zipPath -Force

    # Sao chep tep .exe vao release
    Copy-Item -Path $exePath -Destination (Join-Path $releaseDir "TMarkdown.exe") -Force

    Write-Host "`n[+] HOAN TAT THANH CONG!" -ForegroundColor Green
    Write-Host "    - File thuc thi: release\TMarkdown.exe" -ForegroundColor White
    Write-Host "    - File nen zip:  release\TMarkdown-windows-x64.zip" -ForegroundColor White
    Write-Host "    Ban co the gui tep zip nay cho ban be giai nen va dung ngay.`n" -ForegroundColor Cyan
} else {
    Write-Host "`n[-] Qua trinh build that bai. Vui long kiem tra lai log." -ForegroundColor Red
}
