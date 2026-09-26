# install.ps1: install skills from this repo into Claude Code, Codex or Hermes (Windows PowerShell).
#
# Usage:
#   .\scripts\install.ps1 -Agent claude                       every skill, into Claude Code
#   .\scripts\install.ps1 -Agent codex -Skills session-handoff,verify-dont-trust
#   .\scripts\install.ps1 -Agent all
#   .\scripts\install.ps1 -Agent claude -Dest C:\path\to\project\.claude\skills
#   .\scripts\install.ps1 -List
#
# Skills land in $env:CLAUDE_HOME\skills, $env:CODEX_HOME\skills or $env:HERMES_HOME\skills,
# falling back to ~\.claude, ~\.codex and ~\.hermes.
# If scripts are blocked: powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Agent claude

param(
  [ValidateSet('claude', 'codex', 'hermes', 'all')][string]$Agent,
  [string[]]$Skills,
  [string]$Dest,
  [switch]$List
)

$ErrorActionPreference = 'Stop'
$src = Join-Path (Split-Path -Parent $PSScriptRoot) 'skills'

if ($List) { Get-ChildItem $src -Directory | ForEach-Object Name; return }
if (-not $Agent) { Write-Host 'Pass -Agent claude|codex|hermes|all (or -List).'; exit 1 }

function Get-AgentDest([string]$a) {
  $home1 = [Environment]::GetFolderPath('UserProfile')
  switch ($a) {
    'claude' { $b = if ($env:CLAUDE_HOME) { $env:CLAUDE_HOME } else { Join-Path $home1 '.claude' } }
    'codex'  { $b = if ($env:CODEX_HOME)  { $env:CODEX_HOME }  else { Join-Path $home1 '.codex' } }
    'hermes' { $b = if ($env:HERMES_HOME) { $env:HERMES_HOME } else { Join-Path $home1 '.hermes' } }
  }
  Join-Path $b 'skills'
}

if (-not $Skills) { $Skills = Get-ChildItem $src -Directory | ForEach-Object Name }
foreach ($n in $Skills) {
  if (-not (Test-Path (Join-Path $src "$n\SKILL.md"))) { throw "No such skill: $n (see -List)" }
}

function Install-To([string]$target) {
  New-Item -ItemType Directory -Force $target | Out-Null
  foreach ($n in $Skills) {
    $to = Join-Path $target $n
    if (Test-Path $to) { Remove-Item $to -Recurse -Force }
    Copy-Item (Join-Path $src $n) $to -Recurse
  }
  Write-Host "Installed $($Skills.Count) skill(s) to $target"
}

if ($Agent -eq 'all') {
  if ($Dest) { throw '-Dest cannot be combined with -Agent all' }
  foreach ($a in 'claude', 'codex', 'hermes') { Install-To (Get-AgentDest $a) }
} else {
  Install-To $(if ($Dest) { $Dest } else { Get-AgentDest $Agent })
}
Write-Host 'Start a new session in your agent so it reloads its skill list.'
