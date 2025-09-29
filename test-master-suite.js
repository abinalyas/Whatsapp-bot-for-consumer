/**
 * Master Test Suite Runner
 * Runs all test suites: Basic, Comprehensive API, Database Schema, and Integration Workflows
 */

import { runAllTests as runComprehensiveApiTests } from './test-comprehensive-api.js';
import { runAllSchemaTests } from './test-database-schema.js';
import { runAllIntegrationTests } from './test-integration-workflows.js';

// Test results aggregation
let masterResults = {
  suites: {
    comprehensiveApi: { passed: 0, failed: 0, total: 0, details: [] },
    databaseSchema: { passed: 0, failed: 0, total: 0, details: [] },
    integrationWorkflows: { passed: 0, failed: 0, total: 0, details: [] }
  },
  overall: { passed: 0, failed: 0, total: 0, successRate: 0 }
};

/**
 * Run all test suites
 */
async function runMasterTestSuite() {
  console.log('🎯 Starting Master Test Suite');
  console.log('============================');
  console.log('This comprehensive test suite includes:');
  console.log('  🔧 Comprehensive API Tests (20 tests)');
  console.log('  🗄️ Database Schema Validation (10 tests)');
  console.log('  🚀 Integration Workflow Tests (5 workflows)');
  console.log('=============================================\n');
  
  const startTime = Date.now();
  
  try {
    // Run Comprehensive API Tests
    console.log('🔧 Running Comprehensive API Tests...');
    const apiResults = await runComprehensiveApiTests();
    masterResults.suites.comprehensiveApi = {
      passed: apiResults.passed,
      failed: apiResults.failed,
      total: apiResults.passed + apiResults.failed,
      details: apiResults.details
    };
    
    console.log('\n🗄️ Running Database Schema Validation Tests...');
    const schemaResults = await runAllSchemaTests();
    masterResults.suites.databaseSchema = {
      passed: schemaResults.passed,
      failed: schemaResults.failed,
      total: schemaResults.passed + schemaResults.failed,
      details: schemaResults.details
    };
    
    console.log('\n🚀 Running Integration Workflow Tests...');
    const integrationResults = await runAllIntegrationTests();
    masterResults.suites.integrationWorkflows = {
      passed: integrationResults.passed,
      failed: integrationResults.failed,
      total: integrationResults.passed + integrationResults.failed,
      details: integrationResults.details
    };
    
  } catch (error) {
    console.error('❌ Master test suite error:', error);
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Calculate overall results
  masterResults.overall.passed = masterResults.suites.comprehensiveApi.passed + 
                                 masterResults.suites.databaseSchema.passed + 
                                 masterResults.suites.integrationWorkflows.passed;
  
  masterResults.overall.failed = masterResults.suites.comprehensiveApi.failed + 
                                 masterResults.suites.databaseSchema.failed + 
                                 masterResults.suites.integrationWorkflows.failed;
  
  masterResults.overall.total = masterResults.overall.passed + masterResults.overall.failed;
  masterResults.overall.successRate = masterResults.overall.total > 0 ? 
    (masterResults.overall.passed / masterResults.overall.total) * 100 : 0;
  
  // Print master summary
  console.log('\n🎯 MASTER TEST SUITE RESULTS');
  console.log('============================');
  console.log(`⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
  console.log(`📊 Overall Results: ${masterResults.overall.passed}/${masterResults.overall.total} passed (${masterResults.overall.successRate.toFixed(1)}%)`);
  console.log('');
  
  // Print suite summaries
  console.log('📋 Test Suite Breakdown:');
  console.log('------------------------');
  
  const apiRate = masterResults.suites.comprehensiveApi.total > 0 ? 
    (masterResults.suites.comprehensiveApi.passed / masterResults.suites.comprehensiveApi.total) * 100 : 0;
  console.log(`🔧 Comprehensive API Tests:     ${masterResults.suites.comprehensiveApi.passed}/${masterResults.suites.comprehensiveApi.total} (${apiRate.toFixed(1)}%)`);
  
  const schemaRate = masterResults.suites.databaseSchema.total > 0 ? 
    (masterResults.suites.databaseSchema.passed / masterResults.suites.databaseSchema.total) * 100 : 0;
  console.log(`🗄️ Database Schema Validation:  ${masterResults.suites.databaseSchema.passed}/${masterResults.suites.databaseSchema.total} (${schemaRate.toFixed(1)}%)`);
  
  const integrationRate = masterResults.suites.integrationWorkflows.total > 0 ? 
    (masterResults.suites.integrationWorkflows.passed / masterResults.suites.integrationWorkflows.total) * 100 : 0;
  console.log(`🚀 Integration Workflow Tests:  ${masterResults.suites.integrationWorkflows.passed}/${masterResults.suites.integrationWorkflows.total} (${integrationRate.toFixed(1)}%)`);
  
  // Print failed tests summary
  const allFailedTests = [
    ...masterResults.suites.comprehensiveApi.details.filter(t => t.status === 'FAIL'),
    ...masterResults.suites.databaseSchema.details.filter(t => t.status === 'FAIL'),
    ...masterResults.suites.integrationWorkflows.details.filter(t => t.status === 'FAIL')
  ];
  
  if (allFailedTests.length > 0) {
    console.log('\n❌ Failed Tests Summary:');
    console.log('------------------------');
    allFailedTests.forEach(test => {
      console.log(`  ❌ ${test.test}: ${test.details}`);
    });
  }
  
  // Print recommendations
  console.log('\n💡 Recommendations:');
  console.log('-------------------');
  
  if (masterResults.overall.successRate >= 90) {
    console.log('🎉 Excellent! Your application has high test coverage and reliability.');
    console.log('   Consider adding more edge case tests for even better coverage.');
  } else if (masterResults.overall.successRate >= 75) {
    console.log('👍 Good test coverage! Focus on fixing the failed tests.');
    console.log('   Pay special attention to database schema and API validation issues.');
  } else if (masterResults.overall.successRate >= 50) {
    console.log('⚠️  Moderate test coverage. Several critical issues need attention.');
    console.log('   Prioritize fixing database schema and API endpoint issues.');
  } else {
    console.log('🚨 Low test coverage. Critical issues need immediate attention.');
    console.log('   Focus on basic functionality and database schema fixes first.');
  }
  
  // Print next steps
  console.log('\n🔄 Next Steps:');
  console.log('---------------');
  
  if (allFailedTests.length > 0) {
    console.log('1. Fix the failed tests listed above');
    console.log('2. Run individual test suites to debug specific issues');
    console.log('3. Add more test cases for edge scenarios');
    console.log('4. Implement continuous integration with these test suites');
  } else {
    console.log('1. All tests passed! 🎉');
    console.log('2. Consider adding more edge case tests');
    console.log('3. Implement continuous integration with these test suites');
    console.log('4. Add performance and load testing');
  }
  
  console.log('\n📚 Available Test Commands:');
  console.log('---------------------------');
  console.log('npm run test:comprehensive  # Run comprehensive API tests');
  console.log('npm run test:schema        # Run database schema tests');
  console.log('npm run test:integration   # Run integration workflow tests');
  console.log('npm run test:all           # Run this master test suite');
  
  return masterResults;
}

// Run master test suite if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMasterTestSuite().then(results => {
    const exitCode = results.overall.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  });
}

export { runMasterTestSuite };
