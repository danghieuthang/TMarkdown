# Script chạy TMarkdown ở chế độ phát triển (Tự động nạp PATH cho Wails và Go)
$env:Path = "$env:USERPROFILE\go\bin;C:\Program Files\Go\bin;" + $env:Path
wails dev
