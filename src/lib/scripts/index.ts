// Barrel export for all script generators
// Requirements: 4.1, 4.2, 5.1

// Shared utilities
export {
  escapeShellString,
  getSelectedPackages,
  generateAsciiHeader,
  generateSharedUtils,
  type PackageInfo,
} from './shared';

// Windows script generators
export { generateWingetScript, generateWingetCommand } from './winget';
export { generateChocolateyScript, generateChocolateyCommand } from './chocolatey';
export { generateScoopScript, generateScoopCommand } from './scoop';

// macOS script generators
export { generateHomebrewScript, generateHomebrewCommand } from './homebrew';
export { generateMacPortsScript, generateMacPortsCommand } from './macports';

// Linux script generators
export { generateAptScript, generateAptCommand } from './apt';
export { generateDnfScript, generateDnfCommand } from './dnf';
export { generatePacmanScript, generatePacmanCommand } from './pacman';
export { generateZypperScript, generateZypperCommand } from './zypper';
export { generateFlatpakScript, generateFlatpakCommand } from './flatpak';
export { generateSnapScript, generateSnapCommand } from './snap';
