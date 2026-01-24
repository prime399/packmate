// Scoop script generator for Windows
// Requirements: 5.1, 5.4, 5.8

import { escapeShellString, getSelectedPackages } from './shared';

/**
 * Generate Scoop installation script
 * Requirements: 5.1, 5.4, 5.8
 */
export function generateScoopScript(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'scoop');
  
  if (packages.length === 0) {
    return '# No packages selected for Scoop';
  }

  const date = new Date().toISOString().split('T')[0];
  const pkgCount = packages.length;
  const installCalls = packages
    .map(({ app, pkg }) => `Install-ScoopPackage -Name "${escapeShellString(app.name)}" -PackageName "${pkg}"`)
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
    '    Package Manager: Scoop',
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
    '',
  ].join('\n');

  const mainScript = [
    'function Install-ScoopPackage {',
    '    param([string]$Name, [string]$PackageName)',
    '    $script:Current++',
    '    try {',
    '        scoop install $PackageName 2>&1 | Out-Null',
    '        Write-Timing -Message $Name -Seconds 0',
    '        $script:Succeeded += $Name',
    '    } catch {',
    '        Write-Err $Name',
    '        $script:Failed += $Name',
    '    }',
    '}',
    '',
    'if (-not (Get-Command scoop -ErrorAction SilentlyContinue)) {',
    '    Write-Err "Scoop not found."',
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
 * Generate simple one-liner command for Scoop
 */
export function generateScoopCommand(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'scoop');
  if (packages.length === 0) {
    return '# No packages selected';
  }
  const packageNames = packages.map(p => p.pkg).join(' ');
  return `scoop install ${packageNames}`;
}
