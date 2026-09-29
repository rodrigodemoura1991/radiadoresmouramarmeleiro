$ErrorActionPreference = "Stop"

$repoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $repoDir "backup-config.json"
$scriptPath = Join-Path $repoDir "backup-diario-windows.ps1"

Write-Host ""
Write-Host "=== Backup Diário - Gestão Radiadores Moura ===" -ForegroundColor Cyan
Write-Host ""

$defaultFolder = "D:\BACKUP GESTAO RADIADORES MOURA"
$folder = Read-Host "Pasta local do backup [$defaultFolder]"
if ([string]::IsNullOrWhiteSpace($folder)) { $folder = $defaultFolder }

$token = Read-Host "Cole o token de backup configurado no Supabase" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
try {
  $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

$functionUrl = "https://uwnzpoqhxioxjegflksv.supabase.co/functions/v1/radiadores-backup"

@{
  localFolder = $folder
  functionUrl = $functionUrl
  token = $plainToken
} | ConvertTo-Json | Set-Content -Path $configPath -Encoding UTF8

New-Item -ItemType Directory -Force -Path $folder | Out-Null

$taskName = "Gestão Radiadores Moura - Backup Diário"
$action = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \`"$scriptPath\`""
schtasks.exe /Create /SC DAILY /ST 17:00 /TN "$taskName" /TR "$action" /F | Out-Null

Write-Host ""
Write-Host "Agendamento criado para todos os dias às 17:00." -ForegroundColor Green
Write-Host "Pasta: $folder"
Write-Host ""
Write-Host "Para testar agora, execute:"
Write-Host "powershell.exe -ExecutionPolicy Bypass -File \`"$scriptPath\`""
Write-Host ""
