param(
  [string]$ConfigPath = "$PSScriptRoot\backup-config.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ConfigPath)) {
  throw "Arquivo de configuração não encontrado: $ConfigPath"
}

$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
$backupDir = $config.localFolder
$functionUrl = $config.functionUrl
$token = $config.token

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$headers = @{ "x-backup-token" = $token }

$run = Invoke-RestMethod -Method Post -Uri $functionUrl -Headers $headers -ContentType "application/json"
if (-not $run.ok) { throw "Erro no Supabase: $($run.error)" }

foreach ($item in $run.results) {
  $safeName = ($item.company_name -replace '[^a-zA-Z0-9_-]+','_')
  $file = Join-Path $backupDir ("Backup_{0}_{1}.xlsx" -f $safeName,$run.backup_date)
  $url = "$($functionUrl)?company_id=$($item.company_id)"

  Write-Host "Baixando $($item.company_name)..."
  Invoke-WebRequest -Uri $url -Headers $headers -OutFile $file
  Write-Host "OK: $file"
}

$log = Join-Path $backupDir "backup-log.txt"
Add-Content -Path $log -Value ("{0} - Backup concluído. Empresas: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$run.results.Count)
Write-Host "BACKUP CONCLUÍDO!" -ForegroundColor Green
