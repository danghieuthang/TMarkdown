@echo off
setlocal
echo ===============================================
echo    TMarkdown - Dong goi Ban phat hanh Windows
echo ===============================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1"
pause
