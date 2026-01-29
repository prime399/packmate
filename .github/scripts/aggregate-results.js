#!/usr/bin/env node
/**
 * Aggregate verification results from all platform tests
 * Creates a comprehensive report in JSON and Markdown formats
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
    } else if (item.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Parse all result files
function parseResults(files) {
  const results = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(content);
      results.push(data);
    } catch (err) {
      console.error(`Error parsing ${file}: ${err.message}`);
    }
  }
  
  return results;
}

// Generate statistics
function generateStats(results) {
  const stats = {
    total: results.length,
    available: 0,
    notFound: 0,
    error: 0,
    skipped: 0,
    byPackageManager: {},
    byCategory: {},
    byStatus: {},
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
    }
    
    // Count by package manager
    const pm = result.packageManager;
    if (!stats.byPackageManager[pm]) {
      stats.byPackageManager[pm] = { total: 0, available: 0, notFound: 0, error: 0 };
    }
    stats.byPackageManager[pm].total++;
    if (result.status === 'available') {
      stats.byPackageManager[pm].available++;
    } else if (result.status === 'not_found') {
      stats.byPackageManager[pm].notFound++;
    } else if (result.status === 'error') {
      stats.byPackageManager[pm].error++;
    }
  }
  
  return stats;
}

// Generate Markdown report
function generateMarkdownReport(results, stats) {
  const timestamp = new Date().toISOString();
  
  let md = `# Package Verification Report\n\n`;
  md += `**Generated:** ${timestamp}\n\n`;
  
  // Summary
  md += `## Summary\n\n`;
  md += `| Metric | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tests | ${stats.total} |\n`;
  md += `| ✅ Available | ${stats.available} |\n`;
  md += `| ❌ Not Found | ${stats.notFound} |\n`;
  md += `| ⚠️ Error | ${stats.error} |\n`;
  md += `| ⏭️ Skipped | ${stats.skipped} |\n`;
  md += `| **Success Rate** | ${stats.total > 0 ? ((stats.available / (stats.total - stats.skipped)) * 100).toFixed(1) : 0}% |\n\n`;
  
  // By Package Manager
  md += `## Results by Package Manager\n\n`;
  md += `| Package Manager | Total | Available | Not Found | Error | Success Rate |\n`;
  md += `|-----------------|-------|-----------|-----------|-------|-------------|\n`;
  
  for (const [pm, pmStats] of Object.entries(stats.byPackageManager)) {
    const successRate = pmStats.total > 0 
      ? ((pmStats.available / pmStats.total) * 100).toFixed(1) 
      : 0;
    md += `| ${pm} | ${pmStats.total} | ${pmStats.available} | ${pmStats.notFound} | ${pmStats.error} | ${successRate}% |\n`;
  }
  md += '\n';
  
  // Failed packages
  const failed = results.filter(r => r.status === 'not_found' || r.status === 'error');
  if (failed.length > 0) {
    md += `## Failed Packages\n\n`;
    md += `| App | Package Manager | Package Name | Status | Error |\n`;
    md += `|-----|-----------------|--------------|--------|-------|\n`;
    
    for (const result of failed) {
      const error = result.error ? result.error.substring(0, 50) : '';
      md += `| ${result.appName} | ${result.packageManager} | \`${result.packageName}\` | ${result.status} | ${error} |\n`;
    }
    md += '\n';
  }
  
  return md;
}

// Main execution
const resultsDir = path.join(process.cwd(), 'results');
console.log(`Looking for results in: ${resultsDir}`);

const files = findResultFiles(resultsDir);
console.log(`Found ${files.length} result files`);

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
console.log(`Skipped: ${stats.skipped}`);
