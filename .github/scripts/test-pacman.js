#!/usr/bin/env node
/**
 * Test Pacman packages from the app catalog (Arch Linux)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function extractPackages() {
  const dataPath = path.join(__dirname, '../../src/lib/data.ts');
  const content = fs.readFileSync(dataPath, 'utf-8');
  
  const packages = [];
  const pattern = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?pacman:\s*'([^']+)'/g;
  
  let match;
  while ((match = pattern.exec(content)) !== null) {
    packages.push({
      appId: match[1],
      appName: match[2],
      packageName: match[3],
    });
  }
  
  return packages;
}

function testPackage(pkg) {
  const result = {
    appId: pkg.appId,
    appName: pkg.appName,
    packageManager: 'pacman',
    packageName: pkg.packageName,
    status: 'unknown',
    error: '',
    timestamp: new Date().toISOString(),
  };
  
  try {
    execSync(`pacman -Si "${pkg.packageName}"`, { stdio: 'pipe' });
    result.status = 'available';
    console.log(`✓ ${pkg.appName} (${pkg.packageName})`);
  } catch (err) {
    // Check if it's an AUR package (ends with -bin, -git, etc.)
    if (pkg.packageName.match(/-bin$|-git$|-appimage$/)) {
      result.status = 'aur_only';
      result.error = 'Package only available in AUR';
      console.log(`⚠ ${pkg.appName} (${pkg.packageName}) - AUR only`);
    } else {
      result.status = 'not_found';
      result.error = 'Package not found in Pacman repositories';
      console.log(`✗ ${pkg.appName} (${pkg.packageName})`);
    }
  }
  
  return result;
}

// Update cache first
try {
  console.log('Updating Pacman cache...');
  execSync('pacman -Sy', { stdio: 'inherit' });
} catch (err) {
  console.log('Warning: Could not update Pacman cache');
}

// Main
const packages = extractPackages();
console.log(`\nTesting ${packages.length} Pacman packages...\n`);

const results = packages.map(testPackage);

// Summary
const available = results.filter(r => r.status === 'available').length;
const aurOnly = results.filter(r => r.status === 'aur_only').length;
console.log(`\nSummary: ${available}/${results.length} packages available (${aurOnly} AUR-only)`);

// Save results
fs.writeFileSync('pacman-results.json', JSON.stringify(results, null, 2));
console.log('Results saved to pacman-results.json');
