// Main script generation entry point
// Requirements: 4.1, 4.2, 5.1

import type { PackageManagerId } from './data';

// Import all script generators
import { generateWingetScript, generateWingetCommand } from './scripts/winget';
import { generateChocolateyScript, generateChocolateyCommand } from './scripts/chocolatey';
import { generateScoopScript, generateScoopCommand } from './scripts/scoop';
import { generateHomebrewScript, generateHomebrewCommand } from './scripts/homebrew';
import { generateMacPortsScript, generateMacPortsCommand } from './scripts/macports';
import { generateAptScript, generateAptCommand } from './scripts/apt';
import { generateDnfScript, generateDnfCommand } from './scripts/dnf';
import { generatePacmanScript, generatePacmanCommand } from './scripts/pacman';
import { generateZypperScript, generateZypperCommand } from './scripts/zypper';
import { generateFlatpakScript, generateFlatpakCommand } from './scripts/flatpak';
import { generateSnapScript, generateSnapCommand } from './scripts/snap';

/**
 * Script generator function type
 */
type ScriptGenerator = (selectedAppIds: Set<string>) => string;

/**
 * Map of package manager IDs to their script generators
 */
const scriptGenerators: Record<PackageManagerId, ScriptGenerator> = {
  // Windows
  winget: generateWingetScript,
  chocolatey: generateChocolateyScript,
  scoop: generateScoopScript,
  // macOS
  homebrew: generateHomebrewScript,
  macports: generateMacPortsScript,
  // Linux
  apt: generateAptScript,
  dnf: generateDnfScript,
  pacman: generatePacmanScript,
  zypper: generateZypperScript,
  flatpak: generateFlatpakScript,
  snap: generateSnapScript,
};

/**
 * Map of package manager IDs to their command generators
 */
const commandGenerators: Record<PackageManagerId, ScriptGenerator> = {
  // Windows
  winget: generateWingetCommand,
  chocolatey: generateChocolateyCommand,
  scoop: generateScoopCommand,
  // macOS
  homebrew: generateHomebrewCommand,
  macports: generateMacPortsCommand,
  // Linux
  apt: generateAptCommand,
  dnf: generateDnfCommand,
  pacman: generatePacmanCommand,
  zypper: generateZypperCommand,
  flatpak: generateFlatpakCommand,
  snap: generateSnapCommand,
};

/**
 * Generate a full installation script for the selected apps and package manager
 * 
 * Requirement 5.1: Generate downloadable shell scripts for each package manager type
 * 
 * @param selectedAppIds - Set of selected app IDs
 * @param packageManagerId - The package manager to generate the script for
 * @returns The generated installation script
 */
export function generateInstallScript(
  selectedAppIds: Set<string>,
  packageManagerId: PackageManagerId
): string {
  // Handle empty selection case
  if (selectedAppIds.size === 0) {
    return '# No packages selected';
  }

  const generator = scriptGenerators[packageManagerId];
  if (!generator) {
    return `# Unknown package manager: ${packageManagerId}`;
  }

  return generator(selectedAppIds);
}

/**
 * Generate a simple one-liner command for the selected apps and package manager
 * 
 * Requirement 4.1: Generate a simple one-liner command using the selected package manager's install prefix
 * Requirement 4.2: Only include apps that have targets for the selected package manager
 * 
 * @param selectedAppIds - Set of selected app IDs
 * @param packageManagerId - The package manager to generate the command for
 * @returns The generated one-liner command
 */
export function generateSimpleCommand(
  selectedAppIds: Set<string>,
  packageManagerId: PackageManagerId
): string {
  // Handle empty selection case
  if (selectedAppIds.size === 0) {
    return '# No packages selected';
  }

  const generator = commandGenerators[packageManagerId];
  if (!generator) {
    return `# Unknown package manager: ${packageManagerId}`;
  }

  return generator(selectedAppIds);
}
