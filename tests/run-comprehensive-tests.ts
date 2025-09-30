#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Comprehensive Test Runner for Salon Dashboard
 * 
 * This script runs all test categories to ensure comprehensive coverage:
 * 1. Database constraint tests
 * 2. API integration tests  
 * 3. Form validation tests
 * 4. End-to-end workflow tests
 */

const TEST_CATEGORIES = [
  {
    name: 'Database Constraints',
    file: 'database-constraints.test.ts',
    description: 'Tests database schema constraints and data validation'
  },
  {
    name: 'API Integration',
    file: 'api-integration.test.ts', 
    description: 'Tests API endpoints and response validation'
  },
  {
    name: 'Form Validation',
    file: 'form-validation.test.ts',
    description: 'Tests form field mapping and client-side validation'
  },
  {
    name: 'E2E Workflows',
    file: 'e2e-workflows.test.ts',
    description: 'Tests complete user workflows and UI interactions'
  }
];

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logHeader(message: string) {
  log(`\n${'='.repeat(60)}`, COLORS.cyan);
  log(`  ${message}`, COLORS.bright + COLORS.cyan);
  log(`${'='.repeat(60)}`, COLORS.cyan);
}

function logSection(message: string) {
  log(`\n${'─'.repeat(40)}`, COLORS.blue);
  log(`  ${message}`, COLORS.bright + COLORS.blue);
  log(`${'─'.repeat(40)}`, COLORS.blue);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, COLORS.green);
}

function logError(message: string) {
  log(`❌ ${message}`, COLORS.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, COLORS.yellow);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, COLORS.blue);
}

async function checkPrerequisites(): Promise<boolean> {
  logHeader('Checking Prerequisites');
  
  let allGood = true;
  
  // Check if test files exist
  for (const category of TEST_CATEGORIES) {
    const testPath = join(__dirname, category.file);
    if (existsSync(testPath)) {
      logSuccess(`${category.name} test file exists`);
    } else {
      logError(`${category.name} test file missing: ${category.file}`);
      allGood = false;
    }
  }
  
  // Check if vitest is installed
  try {
    execSync('npx vitest --version', { stdio: 'pipe' });
    logSuccess('Vitest is available');
  } catch (error) {
    logError('Vitest not found. Install with: npm install -D vitest');
    allGood = false;
  }
  
  // Check if playwright is installed (for E2E tests)
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    logSuccess('Playwright is available');
  } catch (error) {
    logWarning('Playwright not found. E2E tests will be skipped.');
    logInfo('Install with: npm install -D @playwright/test && npx playwright install');
  }
  
  // Check environment variables
  const requiredEnvVars = ['DATABASE_URL'];
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`Environment variable ${envVar} is set`);
    } else {
      logError(`Environment variable ${envVar} is missing`);
      allGood = false;
    }
  }
  
  return allGood;
}

async function runTestCategory(category: typeof TEST_CATEGORIES[0]): Promise<boolean> {
  logSection(`Running ${category.name} Tests`);
  logInfo(category.description);
  
  try {
    const testPath = join(__dirname, category.file);
    const command = `npx vitest run ${testPath} --reporter=verbose`;
    
    log(`Running: ${command}`, COLORS.magenta);
    
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: join(__dirname, '..')
    });
    
    logSuccess(`${category.name} tests completed successfully`);
    return true;
    
  } catch (error: any) {
    logError(`${category.name} tests failed`);
    if (error.stdout) {
      log('STDOUT:', COLORS.yellow);
      console.log(error.stdout);
    }
    if (error.stderr) {
      log('STDERR:', COLORS.red);
      console.log(error.stderr);
    }
    return false;
  }
}

async function runAllTests(): Promise<void> {
  logHeader('🧪 Comprehensive Test Suite Runner');
  logInfo('Running all test categories to ensure comprehensive coverage');
  
  // Check prerequisites
  const prerequisitesOk = await checkPrerequisites();
  if (!prerequisitesOk) {
    logError('Prerequisites not met. Please fix the issues above and try again.');
    process.exit(1);
  }
  
  // Run each test category
  const results: { category: string; passed: boolean }[] = [];
  
  for (const category of TEST_CATEGORIES) {
    const passed = await runTestCategory(category);
    results.push({ category: category.name, passed });
  }
  
  // Summary
  logHeader('Test Results Summary');
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  log(`\nTotal Categories: ${totalTests}`, COLORS.bright);
  log(`Passed: ${passedTests}`, COLORS.green);
  log(`Failed: ${totalTests - passedTests}`, COLORS.red);
  
  // Detailed results
  logSection('Detailed Results');
  for (const result of results) {
    if (result.passed) {
      logSuccess(`${result.category}: PASSED`);
    } else {
      logError(`${result.category}: FAILED`);
    }
  }
  
  // Recommendations
  if (passedTests === totalTests) {
    logSuccess('\n🎉 All tests passed! Your salon dashboard is ready for production.');
  } else {
    logWarning('\n⚠️  Some tests failed. Please review the issues above.');
    logInfo('Common fixes:');
    logInfo('  - Check database connection and schema');
    logInfo('  - Verify API endpoints are running');
    logInfo('  - Ensure all required environment variables are set');
    logInfo('  - Check that test data is properly seeded');
  }
  
  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  logHeader('Comprehensive Test Runner Help');
  logInfo('Usage: npm run test:comprehensive [options]');
  logInfo('');
  logInfo('Options:');
  logInfo('  --help, -h     Show this help message');
  logInfo('  --category     Run specific test category');
  logInfo('  --verbose      Show detailed output');
  logInfo('');
  logInfo('Test Categories:');
  for (const category of TEST_CATEGORIES) {
    logInfo(`  - ${category.name}: ${category.description}`);
  }
  process.exit(0);
}

if (args.includes('--category')) {
  const categoryIndex = args.indexOf('--category');
  const categoryName = args[categoryIndex + 1];
  
  const category = TEST_CATEGORIES.find(c => 
    c.name.toLowerCase() === categoryName.toLowerCase()
  );
  
  if (category) {
    logHeader(`Running ${category.name} Tests Only`);
    const passed = await runTestCategory(category);
    process.exit(passed ? 0 : 1);
  } else {
    logError(`Unknown category: ${categoryName}`);
    logInfo('Available categories:');
    for (const cat of TEST_CATEGORIES) {
      logInfo(`  - ${cat.name}`);
    }
    process.exit(1);
  }
} else {
  // Run all tests
  runAllTests().catch(error => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}
