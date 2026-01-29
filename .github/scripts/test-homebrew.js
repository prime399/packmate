#!/usr/bin/env node
/**
 * Test Homebrew packages from the app catalog
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function extractPackages() {
  const dataPath = path.join(__dirname, '../../src/lib/data.ts');
  const content = fs.readFileSync(dataPath, 'utf-8');
  
  const packages = [];
  // More robust regex that handles multiline
  const appBlocks = content.match(/\{\s*id:\s*'[^']+',[\s\S]*?targets:\s*\{[\s\S]*?\},?\s*\}/g) || [];
  
  for (const block of appBlocks) {
    const idMatch = block.match(/id:\s*'([^']+)'/);
    const nameMatch = block.match(/name:\s*'([^']+)'/);
    const homebrewMatch = block.match(/homebrew:\s*'([^']+)'/);
    
    if (idMatch && nameMatch && homebrewMatch) {
      packages.push({
        appId: idMatch[1],
        appName: nameMatch[1],
        packageName: homebrewMatch[1],
      });
    }
  }
  
  return packages;
}

function testPackage(pkg) {
  const result = {
    appId: pkg.appId,
    appName: pkg.appName,
    packageManager: 'homebrew',
    packageName: pkg.packageName,
    status: 'unknown',
    error: '',
    timestamp: new Date().toISOString(),
  };
  
  try {
    // Check if it's a cask or formula
    const isCask = pkg.packageName.startsWith('--cask');
    const name = isCask ? pkg.packageName.replace('--cask ', '') : pkg.packageName;
    
    const cmd = isCask ? `brew info --cask "${name}"` : `brew info "${name}"`;
    execSync(cmd, { stdio: 'pipe' });
    result.status = 'available';
    console.log(`✓ ${pkg.appName} (${pkg.packageName})`);
  } catch (err) {
    result.status = 'not_found';
    result.error = 'Package not found in Homebrew';
    console.log(`✗ ${pkg.appName} (${pkg.packageName})`);
  }
  
  return result;
}

// Main
const packages = extractPackages();
console.log(`Testing ${packages.length} Homebrew packages...\n`);

const results = packages.map(testPackage);

// Summary
const available = results.filter(r => r.status === 'available').length;
console.log(`\nSummary: ${available}/${results.length} packages available`);

// Save results
fs.writeFileSync('homebrew-results.json', JSON.stringify(results, null, 2));
console.log('Results saved to homebrew-results.json');
