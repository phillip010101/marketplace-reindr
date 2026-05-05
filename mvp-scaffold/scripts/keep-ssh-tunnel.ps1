param(
  [string]$SshHost = '154.38.184.61',
  [string]$User = 'matias',
  [int]$LocalPort = 55432,
  [string]$RemoteHost = '127.0.0.1',
  [int]$RemotePort = 5432,
  [int]$RestartCooldownSec = 20
)

$ErrorActionPreference = 'Stop'

function Test-TunnelPort {
  param([int]$Port)
  return (Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue)
}

function Get-TunnelProcess {
  param(
    [int]$LPort,
    [string]$RHost,
    [int]$RPort,
    [string]$HostName,
    [string]$Username
  )
  $forwardSignature = "-L $LPort`:$RHost`:$RPort"
  $targetSignature = "$Username@$HostName"
  return Get-CimInstance Win32_Process |
    Where-Object {
      $_.Name -ieq 'ssh.exe' -and
      $_.CommandLine -like "*$forwardSignature*" -and
      $_.CommandLine -like "*$targetSignature*"
    }
}

function Start-Tunnel {
  param(
    [string]$HostName,
    [string]$Username,
    [int]$LPort,
    [string]$RHost,
    [int]$RPort
  )
  Start-Process -FilePath 'ssh.exe' `
    -ArgumentList @(
      '-N',
      '-o', 'ServerAliveInterval=30',
      '-o', 'ServerAliveCountMax=3',
      '-o', 'ExitOnForwardFailure=yes',
      '-L', "$LPort`:$RHost`:$RPort",
      "$Username@$HostName"
    ) `
    -WindowStyle Minimized | Out-Null
}

Write-Host "Keeping SSH tunnel localhost:$LocalPort -> $User@${SshHost}:${RemoteHost}:$RemotePort"
Write-Host 'Press Ctrl+C to stop.'

$lastRestartAttempt = Get-Date '2000-01-01T00:00:00'

while ($true) {
  $tunnelAlive = Test-TunnelPort -Port $LocalPort
  if (-not $tunnelAlive) {
    $runningTunnel = Get-TunnelProcess -LPort $LocalPort -RHost $RemoteHost -RPort $RemotePort -HostName $SshHost -Username $User
    if ($runningTunnel) {
      Write-Host "[$(Get-Date -Format s)] Tunnel process detected but port still closed. Waiting..."
      Start-Sleep -Seconds 5
      continue
    }

    $secondsSinceRestart = ((Get-Date) - $lastRestartAttempt).TotalSeconds
    if ($secondsSinceRestart -lt $RestartCooldownSec) {
      Start-Sleep -Seconds 2
      continue
    }

    Write-Host "[$(Get-Date -Format s)] Tunnel down. Starting..."
    $lastRestartAttempt = Get-Date
    Start-Tunnel -HostName $SshHost -Username $User -LPort $LocalPort -RHost $RemoteHost -RPort $RemotePort
    Start-Sleep -Seconds 3
  }
  Start-Sleep -Seconds 5
}
