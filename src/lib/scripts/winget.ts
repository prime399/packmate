// Winget script generator for Windows
// Requirements: 5.1, 5.4, 5.8

import { escapeShellString, getSelectedPackages } from './shared';

/**
 * Generate Winget installation script
 * Requirements: 5.1, 5.4, 5.8
 */
export function generateWingetScript(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'winget');
  
  if (packages.length === 0) {
    return `# No packages selected for Winget
Write-Host "No packages selected" -ForegroundColor Yellow
exit 0
`;
  }

  const date = new Date().toISOString().split('T')[0];
  const pkgCount = packages.length;
  const installCalls = packages
    .map(({ app, pkg }) => `Install-WingetPackage -Name "${escapeShellString(app.name)}" -PackageId "${pkg}"`)
    .join('\n');

  // Build script using string concatenation to avoid template literal issues with PowerShell syntax
  const header = [
    '#Requires -Version 5.1',
    '<#',
    '.SYNOPSIS',
    '    Packmate - Cross-Platform App Installer',
    '.DESCRIPTION',
    '    PACKMATE - Cross-Platform App Installer',
    '    https://github.com/prime/packmate',
    '',
    '    Package Manager: Winget',
    `    Packages: ${pkgCount}`,
    `    Generated: ${date}`,
    '#>',
    '',
    '$ErrorActionPreference = "Stop"',
    '$ProgressPreference = "SilentlyContinue"',
    '',
  ].join('\n');

  const utils = [
    '# Colors & Utilities',
    'function Write-Info { param([string]$Message) Write-Host ":: " -ForegroundColor Blue -NoNewline; Write-Host $Message }',
    'function Write-Success { param([string]$Message) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $Message }',
    'function Write-Warn { param([string]$Message) Write-Host "[!] " -ForegroundColor Yellow -NoNewline; Write-Host $Message }',
    'function Write-Err { param([string]$Message) Write-Host "[X] " -ForegroundColor Red -NoNewline; Write-Host $Message }',
    'function Write-Skip { param([string]$Message) Write-Host "[o] $Message (already installed)" -ForegroundColor DarkGray }',
    'function Write-Timing { param([string]$Message, [int]$Seconds) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host "$Message ($Seconds s)" }',
    '',
    `$script:Total = ${pkgCount}`,
    '$script:Current = 0',
    '$script:Failed = @()',
    '$script:Succeeded = @()',
    '$script:Skipped = @()',
    '$script:StartTime = Get-Date',
    '',
    '# Progress display',
    'function Show-Progress {',
    '    param([int]$Current, [int]$Total, [string]$Name)',
    '    $percent = [math]::Floor($Current * 100 / $Total)',
    '    Write-Host "[$percent%] ($Current/$Total) Installing $Name..."',
    '}',
    '',
    '# Print summary',
    'function Print-Summary {',
    '    $endTime = Get-Date',
    '    $duration = ($endTime - $script:StartTime).TotalSeconds',
    '    $mins = [math]::Floor($duration / 60)',
    '    $secs = [math]::Floor($duration % 60)',
    '    Write-Host ""',
    '    Write-Host "Summary:"',
    '    $installed = $script:Succeeded.Count',
    '    $skippedCount = $script:Skipped.Count',
    '    $failedCount = $script:Failed.Count',
    '    if ($failedCount -eq 0) {',
    '        Write-Success "Done! $installed installed, $skippedCount already installed ($mins m $secs s)"',
    '    } else {',
    '        Write-Warn "$installed installed, $skippedCount skipped, $failedCount failed ($mins m $secs s)"',
    '        Write-Host "Failed:" -ForegroundColor Red',
    '        foreach ($pkg in $script:Failed) { Write-Host "  - $pkg" }',
    '    }',
    '}',
    '',
  ].join('\n');

  const mainScript = [
    '# Check if package is already installed',
    'function Test-WingetInstalled {',
    '    param([string]$PackageId)',
    '    try {',
    '        $result = winget list --id $PackageId --exact 2>$null',
    '        return $result -match $PackageId',
    '    } catch { return $false }',
    '}',
    '',
    'function Install-WingetPackage {',
    '    param([string]$Name, [string]$PackageId)',
    '    $script:Current++',
    '    if (Test-WingetInstalled -PackageId $PackageId) {',
    '        Write-Skip $Name',
    '        $script:Skipped += $Name',
    '        return',
    '    }',
    '    Show-Progress -Current $script:Current -Total $script:Total -Name $Name',
    '    $startTime = Get-Date',
    '    try {',
    '        winget install -e --id $PackageId --accept-source-agreements --accept-package-agreements --silent 2>&1 | Out-Null',
    '        $elapsed = [math]::Floor(((Get-Date) - $startTime).TotalSeconds)',
    '        Write-Timing -Message $Name -Seconds $elapsed',
    '        $script:Succeeded += $Name',
    '    } catch {',
    '        Write-Err $Name',
    '        $script:Failed += $Name',
    '    }',
    '}',
    '',
    '# Check if package manager is installed',
    'if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {',
    '    Write-Err "Winget not found."',
    '    Write-Info "Install from: https://aka.ms/getwinget"',
    '    exit 1',
    '}',
    '',
    'Write-Info "Winget found"',
    'Write-Host ""',
    'Write-Info "Installing $script:Total packages"',
    'Write-Host ""',
    '',
    installCalls,
    '',
    'Print-Summary',
  ].join('\n');

  return header + utils + mainScript;
}

/**
 * Generate simple one-liner command for Winget
 */
export function generateWingetCommand(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'winget');
  if (packages.length === 0) {
    return '# No packages selected';
  }
  const packageIds = packages.map(p => p.pkg).join(' ');
  return `winget install -e --id ${packageIds}`;
}
