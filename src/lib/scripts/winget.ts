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
    return '# No packages selected for Winget';
  }

  const date = new Date().toISOString().split('T')[0];
  const pkgCount = packages.length;
  const installCalls = packages
    .map(({ app, pkg }) => `Install-WingetPackage -Name "${escapeShellString(app.name)}" -PackageId "${pkg}"`)
    .join('\n');

  const header = [
    '#Requires -Version 5.1',
    '<#',
    '.SYNOPSIS',
    '    Packmate - Cross-Platform App Installer',
    '.DESCRIPTION',
    '    PACKMATE - Cross-Platform App Installer',
    '    https://github.com/packmate',
    '',
    '    Package Manager: Winget',
    '    Packages: ' + pkgCount,
    '    Generated: ' + date,
    '#>',
    '',
  ].join('\n');

  const utils = [
    '# Colors & Utilities',
    'function Write-Info { param([string]$Message) Write-Host ":: " -ForegroundColor Blue -NoNewline; Write-Host $Message }',
    'function Write-Err { param([string]$Message) Write-Host "[X] " -ForegroundColor Red -NoNewline; Write-Host $Message }',
    'function Write-Skip { param([string]$Message) Write-Host "[o] $Message (already installed)" -ForegroundColor DarkGray }',
    'function Write-Timing { param([string]$Message, [int]$Seconds) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host "$Message ($Seconds s)" }',
    '',
    '$script:Total = ' + pkgCount,
    '$script:Current = 0',
    '$script:Failed = @()',
    '$script:Succeeded = @()',
    '$script:Skipped = @()',
    '$script:StartTime = Get-Date',
    '',
  ].join('\n');

  const mainScript = [
    'function Install-WingetPackage {',
    '    param([string]$Name, [string]$PackageId)',
    '    $script:Current++',
    '    try {',
    '        winget install -e --id $PackageId --accept-source-agreements --accept-package-agreements --silent 2>&1 | Out-Null',
    '        Write-Timing -Message $Name -Seconds 0',
    '        $script:Succeeded += $Name',
    '    } catch {',
    '        Write-Err $Name',
    '        $script:Failed += $Name',
    '    }',
    '}',
    '',
    'if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {',
    '    Write-Err "Winget not found."',
    '    exit 1',
    '}',
    '',
    'Write-Info "Installing $script:Total packages"',
    '',
    installCalls,
    '',
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
