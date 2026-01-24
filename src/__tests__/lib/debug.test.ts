import { describe, it, expect } from 'vitest';
import {
  generateInstallScript,
  generateSimpleCommand,
} from '@/lib/generateInstallScript';
import { getSelectedPackages } from '@/lib/scripts/shared';
import {
  apps,
  packageManagers,
} from '@/lib/data';

describe('Debug tests', () => {
  it('debug steam with winget', () => {
    const steamApp = apps.find(a => a.id === 'steam');
    console.log('steam app:', steamApp?.name);
    console.log('steam targets:', steamApp?.targets);
    console.log('steam winget target:', steamApp?.targets?.winget);

    const selectedIds = new Set(['steam']);
    const packages = getSelectedPackages(selectedIds, 'winget');
    console.log('packages:', packages);

    const command = generateSimpleCommand(selectedIds, 'winget');
    console.log('command:', command);

    // Check if Valve.Steam is in the command
    expect(command).toContain('Valve.Steam');
  });

  it('debug winget script header', () => {
    const selectedIds = new Set(['steam']);
    const script = generateInstallScript(selectedIds, 'winget');
    const header = script.split('\n').slice(0, 20).join('\n');
    console.log('header:', header);

    const pm = packageManagers.find(p => p.id === 'winget');
    console.log('pm name:', pm?.name);

    expect(header).toContain('Winget');
  });
});
