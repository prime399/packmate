#!/usr/bin/env node
/**
 * Test DNF packages from the app catalog (Fedora)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function extractPackages() {
  const dataPath = path.join(__dirname, '../../src/lib/data.ts');
  const content = fs.readFileSync(dataPath, 'utf-8');
  
  const packages = [];
  const pattern = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?dnf:\s*'([^']+)'/g;
  
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
    packageManager: 'dnf',
    packageName: pkg.packageName,
    status: 'unknown',
    error: '',
    timestamp: new Date().toISOString(),
  };
  
  try {
    execSync(`dnf info "${pkg.packageName}"`, { stdio: 'pipe' });
    result.status = 'available';
    console.log(`✓ ${pkg.appName} (${pkg.packageName})`);
  } catch (err) {
    result.status = 'not_found';
    result.error = 'Package not found in DNF repositories';
    console.log(`✗ ${pkg.appName} (${pkg.packageName})`);
  }
  
  return result;
}

// Update cache first
try {
  console.log('Updating DNF cache...');
  execSync('dnf makecache', { stdio: 'inherit' });
} catch (err) {
  console.log('Warning: Could not update DNF cache');
}

// Main
const packages = extractPackages();
console.log(`\nTesting ${packages.length} DNF packages...\n`);

const results = packages.map(testPackage);

// Summary
const available = results.filter(r => r.status === 'available').length;
console.log(`\nSummary: ${available}/${results.length} packages available`);

// Save results
fs.writeFileSync('dnf-results.json', JSON.stringify(results, null, 2));
console.log('Results saved to dnf-results.json');
