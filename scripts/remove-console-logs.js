/**
 * Remove console.log statements from JavaScript files
 * Quick Win #3: Clean up production code
 */

const fs = require('fs');
const path = require('path');

/**
 * Remove all console.log, console.warn, console.error statements from a string
 * Preserves console.error for actual error handling
 * @param {string} content - File content
 * @returns {string} - Cleaned content
 */
function removeConsoleLogs(content) {
  let cleaned = content;

  // Remove console.log statements (including multiline)
  cleaned = cleaned.replace(/console\.log\([^;]*\);?/g, '');

  // Remove console.warn statements
  cleaned = cleaned.replace(/console\.warn\([^;]*\);?/g, '');

  // Keep console.error for now (they might be important for error handling)
  // cleaned = cleaned.replace(/console\.error\([^;]*\);?/g, '');

  // Clean up empty lines left behind (max 2 consecutive empty lines)
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

  return cleaned;
}

/**
 * Process a JavaScript file
 */
function processFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const originalSize = content.length;

    // Count console.log statements
    const logCount = (content.match(/console\.log\(/g) || []).length;
    const warnCount = (content.match(/console\.warn\(/g) || []).length;

    if (logCount === 0 && warnCount === 0) {
      console.log(`  ✓ No console statements found`);
      return { processed: false, saved: 0 };
    }

    const cleaned = removeConsoleLogs(content);
    const newSize = cleaned.length;
    const saved = originalSize - newSize;

    // Write back to file
    fs.writeFileSync(filePath, cleaned, 'utf-8');

    console.log(`  ✓ Removed ${logCount} console.log() and ${warnCount} console.warn()`);
    console.log(`  ✓ Saved ${saved} bytes (${((saved/originalSize) * 100).toFixed(1)}%)`);

    return { processed: true, saved, logCount, warnCount };
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error.message);
    return { processed: false, saved: 0, error: error.message };
  }
}

/**
 * Recursively find all JavaScript files in a directory
 */
function findJSFiles(dir, exclude = ['node_modules', 'archive', 'tests', 'debug']) {
  const files = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!exclude.includes(item)) {
        files.push(...findJSFiles(fullPath, exclude));
      }
    } else if (item.endsWith('.js') && !item.endsWith('.min.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
console.log('🧹 Starting console.log removal...\n');

const jsDir = path.join(__dirname, '../js');
const files = findJSFiles(jsDir);

console.log(`Found ${files.length} JavaScript files\n`);

let totalSaved = 0;
let totalLogs = 0;
let totalWarns = 0;
let filesProcessed = 0;

for (const file of files) {
  const result = processFile(file);
  if (result.processed) {
    totalSaved += result.saved;
    totalLogs += result.logCount || 0;
    totalWarns += result.warnCount || 0;
    filesProcessed++;
  }
  console.log('');
}

console.log('📊 Summary:');
console.log(`  Files processed: ${filesProcessed}/${files.length}`);
console.log(`  Total console.log() removed: ${totalLogs}`);
console.log(`  Total console.warn() removed: ${totalWarns}`);
console.log(`  Total bytes saved: ${totalSaved} (~${(totalSaved/1024).toFixed(2)} KB)`);
console.log('\n✨ Console cleanup complete!');
