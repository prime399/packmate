#!/usr/bin/env node
/**
 * Test APT packages from the app catalog
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function extractPackages() {
  const dataPath = path.join(__dirname, '../../src/lib/data.ts');
  const content = fs.readFileSync(dataPath, 'utf-8');
  
  const packages = [];
  const appBlocks = content.match(/\{\s*id:\s*'[^']+',[\s\S]*?targets:\s*\{[\s\S]*?\},?\s*\}/g) || [];
  
  for (const block of appBlocks) {
    const idMatch = block.match(/id:\s*'([^']+)'/);
    const nameMatch = block.match(/name:\s*'([^']+)'/);
    const aptMatch = block.match(/apt:\s*'([^']+)'/);
    
    if (idMatch && nameMatch && aptMatch) {
      packages.push({
        appId: idMatch[1],
        appName: nameMatch[1],
        packageName: aptMatch[1],
      });
    }
  }
  
  return packages;
}

function testPackage(pkg) {
  const result = {
    appId: pkg.appId,
    appName: pkg.appName,
    packageManager: 'apt',
    packageName: pkg.packageName,
    status: 'unknown',
    error: '',
    timestamp: new Date().toISOString(),
  };
  
  try {
    execSync(`apt-cache show "${pkg.packageName}"`, { stdio: 'pipe' });
    result.status = 'available';
    console.log(`✓ ${pkg.appName} (${pkg.packageName})`);
  } catch (err) {
    result.status = 'not_found';
    result.error = 'Package not found in APT repositories';
    console.log(`✗ ${pkg.appName} (${pkg.packageName})`);
  }
  
  return result;
}

// Main
const packages = extractPackages();
console.log(`Testing ${packages.length} APT packages...\n`);

const results = packages.map(testPackage);

// Summary
const available = results.filter(r => r.status === 'available').length;
console.log(`\nSummary: ${available}/${results.length} packages available`);

// Save results
fs.writeFileSync('apt-results.json', JSON.stringify(results, null, 2));
console.log('Results saved to apt-results.json');
