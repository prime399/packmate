#!/usr/bin/env node
/**
 * Generate test matrices for package verification workflow
 * Reads the app catalog and creates platform-specific test matrices
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let categoryFilter = '';
let packageManagerFilter = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--category' && args[i + 1]) {
    categoryFilter = args[i + 1];
    i++;
  } else if (args[i] === '--package-manager' && args[i + 1]) {
    packageManagerFilter = args[i + 1];
    i++;
  }
}

// Package manager to OS mapping
const packageManagerOS = {
  winget: 'windows',
  chocolatey: 'windows',
  scoop: 'windows',
  homebrew: 'macos',
  macports: 'macos',
  apt: 'linux',
  dnf: 'linux',
  pacman: 'linux',
  zypper: 'linux',
  flatpak: 'linux',
  snap: 'linux',
};

// Read the data.ts file and extract apps
function extractAppsFromData() {
  const dataPath = path.join(__dirname, '../../src/lib/data.ts');
  const content = fs.readFileSync(dataPath, 'utf-8');
  
  // Extract the apps array using regex
  const appsMatch = content.match(/export const apps: AppData\[\] = \[([\s\S]*?)\];/);
  if (!appsMatch) {
    console.error('Could not find apps array in data.ts');
    process.exit(1);
  }
  
  const apps = [];
  const appRegex = /\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,[\s\S]*?category:\s*['"]([^'"]+)['"]\s*,[\s\S]*?targets:\s*\{([^}]+)\}/g;
  
  let match;
  while ((match = appRegex.exec(content)) !== null) {
    const [, id, name, category, targetsStr] = match;
    
    // Parse targets
    const targets = {};
    const targetRegex = /(\w+):\s*['"]([^'"]+)['"]/g;
    let targetMatch;
    while ((targetMatch = targetRegex.exec(targetsStr)) !== null) {
      targets[targetMatch[1]] = targetMatch[2];
    }
    
    apps.push({ id, name, category, targets });
  }
  
  return apps;
}

// Generate matrices for each platform
function generateMatrices(apps) {
  const windowsMatrix = [];
  const macosMatrix = [];
  const linuxMatrix = [];
  
  for (const app of apps) {
    // Apply category filter
    if (categoryFilter && app.category !== categoryFilter) {
      continue;
    }
    
    for (const [pm, packageName] of Object.entries(app.targets)) {
      // Apply package manager filter
      if (packageManagerFilter && pm !== packageManagerFilter) {
        continue;
      }
      
      const os = packageManagerOS[pm];
      if (!os) continue;
      
      const entry = {
        appId: app.id,
        appName: app.name,
        category: app.category,
        packageManager: pm,
        packageName: packageName,
      };
      
      switch (os) {
        case 'windows':
          windowsMatrix.push(entry);
          break;
        case 'macos':
          macosMatrix.push(entry);
          break;
        case 'linux':
          linuxMatrix.push(entry);
          break;
      }
    }
  }
  
  return { windowsMatrix, macosMatrix, linuxMatrix };
}

// Main execution
const apps = extractAppsFromData();
console.log(`Found ${apps.length} apps in catalog`);

const { windowsMatrix, macosMatrix, linuxMatrix } = generateMatrices(apps);

console.log(`Windows tests: ${windowsMatrix.length}`);
console.log(`macOS tests: ${macosMatrix.length}`);
console.log(`Linux tests: ${linuxMatrix.length}`);

// Output for GitHub Actions
const core = require('@actions/core') || {
  setOutput: (name, value) => {
    // Fallback for local testing - write to GITHUB_OUTPUT file
    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      fs.appendFileSync(outputFile, `${name}=${value}\n`);
    } else {
      console.log(`::set-output name=${name}::${value}`);
    }
  }
};

// Write outputs
const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) {
  fs.appendFileSync(outputFile, `windows=${JSON.stringify(windowsMatrix)}\n`);
  fs.appendFileSync(outputFile, `macos=${JSON.stringify(macosMatrix)}\n`);
  fs.appendFileSync(outputFile, `linux=${JSON.stringify(linuxMatrix)}\n`);
} else {
  // For local testing
  console.log('\n--- Windows Matrix ---');
  console.log(JSON.stringify(windowsMatrix, null, 2));
  console.log('\n--- macOS Matrix ---');
  console.log(JSON.stringify(macosMatrix, null, 2));
  console.log('\n--- Linux Matrix ---');
  console.log(JSON.stringify(linuxMatrix, null, 2));
}
