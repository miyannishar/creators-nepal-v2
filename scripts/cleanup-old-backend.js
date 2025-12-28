#!/usr/bin/env node

/**
 * Cleanup Script for Patron Backend Migration
 * 
 * This script removes the old Rust backend and related files after
 * successfully migrating to Supabase.
 * 
 * ⚠️  WARNING: This is destructive! Only run after verifying the new
 *    Supabase setup works correctly.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Files and directories to remove
const itemsToRemove = [
  'backend',
  'clients/ts-sdk',
  'clients/ts-sdk-tests',
  'Cargo.toml',
  'Cargo.lock',
  'docker-compose.yml',
];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function removeRecursive(itemPath) {
  if (fs.existsSync(itemPath)) {
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Remove directory recursively
      fs.rmSync(itemPath, { recursive: true, force: true });
      log(`  ✓ Removed directory: ${itemPath}`, 'green');
    } else {
      // Remove file
      fs.unlinkSync(itemPath);
      log(`  ✓ Removed file: ${itemPath}`, 'green');
    }
    return true;
  } else {
    log(`  ⊘ Not found (already removed?): ${itemPath}`, 'yellow');
    return false;
  }
}

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Patron Backend Cleanup Script                           ║', 'cyan');
  log('║  Remove old Rust backend after Supabase migration        ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  log('⚠️  WARNING: This will permanently delete the following:', 'red');
  log('');
  itemsToRemove.forEach(item => {
    log(`  • ${item}`, 'yellow');
  });
  log('');
  
  log('This action cannot be undone!', 'red');
  log('');
  log('Before proceeding, make sure:', 'blue');
  log('  ✓ Your Supabase project is set up correctly', 'blue');
  log('  ✓ Database migrations have been applied', 'blue');
  log('  ✓ The frontend works with Supabase', 'blue');
  log('  ✓ You have tested authentication', 'blue');
  log('  ✓ You have backed up any important data', 'blue');
  log('');

  const answer = await promptUser('Are you sure you want to continue? (yes/no): ');

  if (answer !== 'yes') {
    log('\n❌ Cleanup cancelled. No files were removed.', 'yellow');
    rl.close();
    return;
  }

  log('\n🗑️  Starting cleanup...', 'cyan');
  log('');

  let removedCount = 0;
  let skippedCount = 0;

  for (const item of itemsToRemove) {
    const itemPath = path.join(process.cwd(), item);
    const removed = removeRecursive(itemPath);
    if (removed) {
      removedCount++;
    } else {
      skippedCount++;
    }
  }

  log('');
  log('═══════════════════════════════════════════════════════════', 'cyan');
  log(`✓ Cleanup complete!`, 'green');
  log(`  Removed: ${removedCount} items`, 'green');
  log(`  Skipped: ${skippedCount} items`, 'yellow');
  log('═══════════════════════════════════════════════════════════', 'cyan');
  log('');
  log('Next steps:', 'blue');
  log('  1. Verify your app still works: cd clients/react-server && npm run dev', 'blue');
  log('  2. Commit the changes: git add -A && git commit -m "Remove old backend"', 'blue');
  log('  3. Update README.md with new setup instructions', 'blue');
  log('');

  rl.close();
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});

