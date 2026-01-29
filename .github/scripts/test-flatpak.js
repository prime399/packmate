#!/usr/bin/env node
/**
 * Test Flatpak packages from the app catalog
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function extractPackages() {
  const dataPath = path.join(__dirname, '../../src/lib/data.ts');
  const content = fs.readFileSync(dataPath, 'utf-8');
  
  const packages = [];
  const pattern = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?flatpak:\s*'([^']+)'/g;
  
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
    packageManager: 'flatpak',
    packageName: pkg.packageName,
    status: 'unknown',
    error: '',
    timestamp: new Date().toISOString(),
  };
  
  try {
    const output = execSync(`flatpak search "${pkg.packageName}"`, { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    if (output.includes(pkg.packageName)) {
      result.status = 'available';
      console.log(`✓ ${pkg.appName} (${pkg.packageName})`);
    } else {
      result.status = 'not_found';
      result.error = 'Package not found on Flathub';
      console.log(`✗ ${pkg.appName} (${pkg.packageName})`);
    }
  } catch (err) {
    result.status = 'not_found';
    result.error = 'Package not found on Flathub';
    console.log(`✗ ${pkg.appName} (${pkg.packageName})`);
  }
  
  return result;
}

// Main
const packages = extractPackages();
console.log(`Testing ${packages.length} Flatpak packages...\n`);

const results = packages.map(testPackage);

// Summary
const available = results.filter(r => r.status === 'available').length;
console.log(`\nSummary: ${available}/${results.length} packages available`);

// Save results
fs.writeFileSync('flatpak-results.json', JSON.stringify(results, null, 2));
console.log('Results saved to flatpak-results.json');
