param(
  [Parameter(Mandatory = $true)]
  [string]$VpsHost,
  [string]$VpsUser = 'matias',
  [int]$LocalPort = 55432,
  [string]$RemoteCredsPath = '/home/matias/reindr-postgres-sudo/reindr_db_credentials.env',
  [string]$DbUser = 'reindr_mvp',
  [string]$DbName = 'reindr_marketplace',
  [string]$DbPassword = '',
  [switch]$UseExistingTunnel,
  [switch]$WithSeed
)

$ErrorActionPreference = 'Stop'

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )
  Write-Host "==> $Label"
  & $Action
}

function Parse-RemoteEnv {
  param([Parameter(Mandatory = $true)][string]$Raw)
  $map = @{}
  $lines = $Raw -split "`r?`n"
  foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $match = [regex]::Match($trimmed, '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$')
    if (-not $match.Success) { continue }
    $key = $match.Groups[1].Value
    $value = $match.Groups[2].Value.Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $map[$key] = $value
  }
  return $map
}

function First-Value {
  param(
    [Parameter(Mandatory = $true)]$Map,
    [Parameter(Mandatory = $true)][string[]]$Keys,
    [string]$DefaultValue = ''
  )
  foreach ($key in $Keys) {
    if ($Map.ContainsKey($key) -and $Map[$key]) {
      return $Map[$key]
    }
  }
  return $DefaultValue
}

function Wait-LocalPort {
  param(
    [Parameter(Mandatory = $true)][int]$Port,
    [int]$TimeoutSeconds = 20
  )
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
    $open = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($open) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Get-ExistingDatabaseUrl {
  param([Parameter(Mandatory = $true)][string]$EnvPath)
  if (-not (Test-Path $EnvPath)) { return '' }
  $lines = Get-Content $EnvPath
  foreach ($line in $lines) {
    if ($line -match '^DATABASE_URL=(.+)$') {
      return $Matches[1].Trim()
    }
  }
  return ''
}

function Export-DatabaseUrlFromEnv {
  param([Parameter(Mandatory = $true)][string]$EnvPath)
  $databaseUrl = Get-ExistingDatabaseUrl -EnvPath $EnvPath
  if (-not $databaseUrl) {
    throw "DATABASE_URL not found in $EnvPath"
  }
  $env:DATABASE_URL = $databaseUrl
}

$workspaceDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $workspaceDir '.env'
$envExample = Join-Path $workspaceDir '.env.example'
$tunnelProcess = $null
$startedTunnel = $false
$previousEnsureMode = $env:CONTRACT_RAG_ENSURE_MODE
$ragMigrateSkipped = $false

try {
  Invoke-Step -Label "Resolving DB credentials" -Action {
    $existingDatabaseUrl = Get-ExistingDatabaseUrl -EnvPath $envFile
    if ($UseExistingTunnel -and -not $DbPassword -and $existingDatabaseUrl) {
      Write-Host "Using existing DATABASE_URL from .env"
      return
    }

    $resolvedUser = $DbUser
    $resolvedName = $DbName
    $resolvedPassword = $DbPassword

    if (-not $resolvedPassword) {
      $rawCreds = & ssh "$VpsUser@$VpsHost" "cat '$RemoteCredsPath'"
      if ($LASTEXITCODE -ne 0 -or -not $rawCreds) {
        throw "Unable to read remote credentials at $RemoteCredsPath. Pass -DbPassword explicitly or configure SSH key access."
      }

      $envMap = Parse-RemoteEnv -Raw $rawCreds
      $resolvedUser = First-Value -Map $envMap -Keys @('DB_USER', 'POSTGRES_USER', 'REINDR_DB_USER') -DefaultValue $DbUser
      $resolvedPassword = First-Value -Map $envMap -Keys @('DB_PASSWORD', 'POSTGRES_PASSWORD', 'REINDR_DB_PASSWORD')
      $resolvedName = First-Value -Map $envMap -Keys @('DB_NAME', 'POSTGRES_DB', 'REINDR_DB_NAME') -DefaultValue $DbName
    }

    if (-not $resolvedPassword) {
      throw 'DB password is empty. Pass -DbPassword or ensure remote credentials file includes DB_PASSWORD.'
    }

    $encodedPassword = [uri]::EscapeDataString($resolvedPassword)
    $databaseUrl = "postgres://$resolvedUser`:$encodedPassword@localhost:$LocalPort/$resolvedName"

    if (-not (Test-Path $envFile)) {
      Copy-Item $envExample $envFile
    }

    $envLines = Get-Content $envFile
    $updated = $false
    for ($i = 0; $i -lt $envLines.Count; $i++) {
      if ($envLines[$i] -match '^DATABASE_URL=') {
        $envLines[$i] = "DATABASE_URL=$databaseUrl"
        $updated = $true
        break
      }
    }
    if (-not $updated) {
      $envLines += "DATABASE_URL=$databaseUrl"
    }
    Set-Content -Path $envFile -Value $envLines
  }

  if ($UseExistingTunnel) {
    Invoke-Step -Label "Validating existing tunnel on localhost:$LocalPort" -Action {
      if (-not (Wait-LocalPort -Port $LocalPort -TimeoutSeconds 5)) {
        throw "No active tunnel detected on localhost:$LocalPort. Start SSH tunnel manually and retry."
      }
    }
  } else {
    Invoke-Step -Label "Starting SSH tunnel on localhost:$LocalPort" -Action {
      $tunnelProcess = Start-Process -FilePath 'ssh.exe' `
        -ArgumentList @('-N', '-L', "$LocalPort`:127.0.0.1:5432", "$VpsUser@$VpsHost") `
        -WindowStyle Minimized -PassThru
      $startedTunnel = $true

      if (-not (Wait-LocalPort -Port $LocalPort -TimeoutSeconds 20)) {
        throw "SSH tunnel did not open on localhost:$LocalPort."
      }
    }
  }

  Invoke-Step -Label 'Exporting DATABASE_URL from .env' -Action {
    Export-DatabaseUrlFromEnv -EnvPath $envFile
  }

  Invoke-Step -Label 'Installing dependencies' -Action {
    $env:CONTRACT_RAG_ENSURE_MODE = 'baseline'
    & pnpm.cmd --dir $workspaceDir install
    if ($LASTEXITCODE -ne 0) { throw 'pnpm install failed.' }
    if ($null -ne $previousEnsureMode) {
      $env:CONTRACT_RAG_ENSURE_MODE = $previousEnsureMode
    } else {
      Remove-Item Env:CONTRACT_RAG_ENSURE_MODE -ErrorAction SilentlyContinue
    }
  }

  Invoke-Step -Label 'Bootstrapping base schema' -Action {
    & pnpm.cmd --dir $workspaceDir --filter @reindr/api db:bootstrap
    if ($LASTEXITCODE -ne 0) { throw 'db:bootstrap failed.' }
  }

  if ($WithSeed) {
    Invoke-Step -Label 'Applying optional seed' -Action {
      & pnpm.cmd --dir $workspaceDir --filter @reindr/api db:bootstrap:seed
      if ($LASTEXITCODE -ne 0) { throw 'db:bootstrap:seed failed.' }
    }
  }

  Invoke-Step -Label 'Running migrations' -Action {
    & pnpm.cmd --dir $workspaceDir db:migrate
    if ($LASTEXITCODE -ne 0) { throw 'db:migrate failed.' }
  }

  Invoke-Step -Label 'Checking migrations' -Action {
    & pnpm.cmd --dir $workspaceDir db:migrate:check
    if ($LASTEXITCODE -ne 0) { throw 'db:migrate:check failed.' }
  }

  Invoke-Step -Label 'Validating contract-rag' -Action {
    & pnpm.cmd --dir $workspaceDir contract-rag validate
    if ($LASTEXITCODE -ne 0) { throw 'contract-rag validate failed.' }
  }

  Invoke-Step -Label 'Running contract-rag migrate' -Action {
    $previousActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $migrateOutput = & pnpm.cmd --dir $workspaceDir contract-rag migrate 2>&1
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousActionPreference
    $migrateOutput | ForEach-Object { Write-Host $_ }

    if ($exitCode -eq 0) {
      return
    }

    $fullOutput = ($migrateOutput | Out-String)
    if ($fullOutput -match 'extension "vector" is not available') {
      Write-Warning 'contract-rag migrate skipped: pgvector extension is not available on VPS DB.'
      $ragMigrateSkipped = $true
      return
    }

    throw 'contract-rag migrate failed.'
  }

  Invoke-Step -Label 'Running smoke gate' -Action {
    $env:CONTRACT_RAG_ENSURE_MODE = 'baseline'
    & pnpm.cmd --dir $workspaceDir run CI-typecheck-test-smoke
    if ($LASTEXITCODE -ne 0) { throw 'CI-typecheck-test-smoke failed.' }
    if ($null -ne $previousEnsureMode) {
      $env:CONTRACT_RAG_ENSURE_MODE = $previousEnsureMode
    } else {
      Remove-Item Env:CONTRACT_RAG_ENSURE_MODE -ErrorAction SilentlyContinue
    }
  }

  if ($ragMigrateSkipped) {
    Write-Host "SUCCESS with warning: app DB synchronized; contract-rag DB migration skipped (pgvector missing)."
  } else {
    Write-Host "SUCCESS: local workspace is synchronized against VPS PostgreSQL through SSH tunnel."
  }
}
finally {
  if ($null -ne $previousEnsureMode) {
    $env:CONTRACT_RAG_ENSURE_MODE = $previousEnsureMode
  } else {
    Remove-Item Env:CONTRACT_RAG_ENSURE_MODE -ErrorAction SilentlyContinue
  }
  if ($startedTunnel -and $tunnelProcess -and -not $tunnelProcess.HasExited) {
    Stop-Process -Id $tunnelProcess.Id -Force
  }
}
