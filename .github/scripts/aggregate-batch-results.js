#!/usr/bin/env node
/**
 * Aggregate batch verification results from all package manager tests
 */

const fs = require('fs');
const path = require('path');

// Find all result JSON files
function findResultFiles(dir) {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`Results directory not found: ${dir}`);
    return results;
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      results.push(...findResultFiles(fullPath));
    } else if (item.name.endsWith('-results.json')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Parse all result files
function parseResults(files) {
  const allResults = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(content);
      
      // Handle both array and single object formats
      if (Array.isArray(data)) {
        allResults.push(...data);
      } else {
        allResults.push(data);
      }
    } catch (err) {
      console.error(`Error parsing ${file}: ${err.message}`);
    }
  }
  
  return allResults;
}

// Generate statistics
function generateStats(results) {
  const stats = {
    total: results.length,
    available: 0,
    notFound: 0,
    error: 0,
    skipped: 0,
    aurOnly: 0,
    byPackageManager: {},
  };
  
  for (const result of results) {
    // Count by status
    switch (result.status) {
      case 'available':
        stats.available++;
        break;
      case 'not_found':
        stats.notFound++;
        break;
      case 'error':
        stats.error++;
        break;
      case 'skipped':
        stats.skipped++;
        break;
      case 'aur_only':
        stats.aurOnly++;
        break;
    }
    
    // Count by package manager
    const pm = result.packageManager;
    if (!stats.byPackageManager[pm]) {
      stats.byPackageManager[pm] = { 
        total: 0, 
        available: 0, 
        notFound: 0, 
        error: 0,
        aurOnly: 0 
      };
    }
    stats.byPackageManager[pm].total++;
    
    switch (result.status) {
      case 'available':
        stats.byPackageManager[pm].available++;
        break;
      case 'not_found':
        stats.byPackageManager[pm].notFound++;
        break;
      case 'error':
        stats.byPackageManager[pm].error++;
        break;
      case 'aur_only':
        stats.byPackageManager[pm].aurOnly++;
        break;
    }
  }
  
  return stats;
}

// Generate Markdown report
function generateMarkdownReport(results, stats) {
  const timestamp = new Date().toISOString();
  
  let md = `# 📦 Package Verification Report\n\n`;
  md += `**Generated:** ${timestamp}\n\n`;
  
  // Summary
  md += `## 📊 Summary\n\n`;
  md += `| Metric | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tests | ${stats.total} |\n`;
  md += `| ✅ Available | ${stats.available} |\n`;
  md += `| ❌ Not Found | ${stats.notFound} |\n`;
  md += `| ⚠️ Error | ${stats.error} |\n`;
  if (stats.aurOnly > 0) {
    md += `| 🔶 AUR Only | ${stats.aurOnly} |\n`;
  }
  if (stats.skipped > 0) {
    md += `| ⏭️ Skipped | ${stats.skipped} |\n`;
  }
  
  const testable = stats.total - stats.skipped;
  const successRate = testable > 0 ? ((stats.available / testable) * 100).toFixed(1) : 0;
  md += `| **Success Rate** | ${successRate}% |\n\n`;
  
  // By Package Manager
  md += `## 📋 Results by Package Manager\n\n`;
  md += `| Package Manager | Total | ✅ Available | ❌ Not Found | ⚠️ Error | Success Rate |\n`;
  md += `|-----------------|-------|-------------|-------------|---------|-------------|\n`;
  
  const pmOrder = ['winget', 'chocolatey', 'scoop', 'homebrew', 'macports', 'apt', 'dnf', 'pacman', 'zypper', 'flatpak', 'snap'];
  
  for (const pm of pmOrder) {
    const pmStats = stats.byPackageManager[pm];
    if (!pmStats) continue;
    
    const successRate = pmStats.total > 0 
      ? ((pmStats.available / pmStats.total) * 100).toFixed(1) 
      : 0;
    
    const aurNote = pmStats.aurOnly > 0 ? ` (+${pmStats.aurOnly} AUR)` : '';
    md += `| ${pm} | ${pmStats.total} | ${pmStats.available}${aurNote} | ${pmStats.notFound} | ${pmStats.error} | ${successRate}% |\n`;
  }
  md += '\n';
  
  // Failed packages
  const failed = results.filter(r => r.status === 'not_found' || r.status === 'error');
  if (failed.length > 0) {
    md += `## ❌ Failed Packages (${failed.length})\n\n`;
    md += `<details>\n<summary>Click to expand</summary>\n\n`;
    md += `| App | Package Manager | Package Name | Error |\n`;
    md += `|-----|-----------------|--------------|-------|\n`;
    
    // Sort by package manager then app name
    failed.sort((a, b) => {
      if (a.packageManager !== b.packageManager) {
        return a.packageManager.localeCompare(b.packageManager);
      }
      return a.appName.localeCompare(b.appName);
    });
    
    for (const result of failed) {
      const error = result.error ? result.error.substring(0, 40) : '';
      md += `| ${result.appName} | ${result.packageManager} | \`${result.packageName}\` | ${error} |\n`;
    }
    md += '\n</details>\n\n';
  }
  
  // AUR-only packages (for Arch)
  const aurOnly = results.filter(r => r.status === 'aur_only');
  if (aurOnly.length > 0) {
    md += `## 🔶 AUR-Only Packages (${aurOnly.length})\n\n`;
    md += `These packages are only available in the Arch User Repository (AUR):\n\n`;
    md += `<details>\n<summary>Click to expand</summary>\n\n`;
    
    for (const result of aurOnly) {
      md += `- ${result.appName}: \`${result.packageName}\`\n`;
    }
    md += '\n</details>\n\n';
  }
  
  return md;
}

// Main execution
// Results are downloaded to workspace root by download-artifact action
const workspaceRoot = process.env.GITHUB_WORKSPACE || path.join(__dirname, '../../..');
const resultsDir = path.join(workspaceRoot, 'results');
console.log(`Looking for results in: ${resultsDir}`);

const files = findResultFiles(resultsDir);
console.log(`Found ${files.length} result files`);

if (files.length === 0) {
  console.log('No result files found. Creating empty report.');
  fs.writeFileSync('verification-report.json', JSON.stringify({ results: [], stats: {} }, null, 2));
  fs.writeFileSync('verification-report.md', '# Package Verification Report\n\nNo results found.');
  process.exit(0);
}

const results = parseResults(files);
console.log(`Parsed ${results.length} results`);

const stats = generateStats(results);

// Create JSON report
const jsonReport = {
  timestamp: new Date().toISOString(),
  stats,
  results,
};

fs.writeFileSync('verification-report.json', JSON.stringify(jsonReport, null, 2));
console.log('Created verification-report.json');

// Create Markdown report
const mdReport = generateMarkdownReport(results, stats);
fs.writeFileSync('verification-report.md', mdReport);
console.log('Created verification-report.md');

// Print summary
console.log('\n=== Summary ===');
console.log(`Total: ${stats.total}`);
console.log(`Available: ${stats.available}`);
console.log(`Not Found: ${stats.notFound}`);
console.log(`Errors: ${stats.error}`);
if (stats.aurOnly > 0) console.log(`AUR Only: ${stats.aurOnly}`);
if (stats.skipped > 0) console.log(`Skipped: ${stats.skipped}`);

const testable = stats.total - stats.skipped;
const successRate = testable > 0 ? ((stats.available / testable) * 100).toFixed(1) : 0;
console.log(`Success Rate: ${successRate}%`);
