/**
 * Database Schema Validation Test Suite
 * Tests database schema consistency and validates that all required columns exist
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

/**
 * Log test result
 */
function logTestResult(testName, passed, details = '') {
  testResults.details.push({
    test: testName,
    status: passed ? 'PASS' : 'FAIL',
    details
  });
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - FAILED: ${details}`);
  }
}

/**
 * Test 1: Check if staff table has working_days column
 */
async function testStaffWorkingDaysColumn() {
  console.log('\n🗄️ Testing Staff Table - working_days Column');
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'staff' AND column_name = 'working_days'
    `);
    
    const columnExists = result.rows.length > 0;
    const columnDetails = columnExists ? result.rows[0] : null;
    
    logTestResult(
      'Staff working_days Column Exists',
      columnExists,
      columnExists ? 
        `Column found: ${columnDetails.data_type}, nullable: ${columnDetails.is_nullable}` : 
        'Column not found in staff table'
    );
    
    if (columnExists) {
      // Test if column accepts JSONB data
      logTestResult(
        'Staff working_days Data Type',
        columnDetails.data_type === 'jsonb',
        `Expected: jsonb, Got: ${columnDetails.data_type}`
      );
    }
  } catch (error) {
    logTestResult('Staff working_days Column', false, `Database error: ${error.message}`);
  }
}

/**
 * Test 2: Check if offerings table has all required columns
 */
async function testOfferingsTableColumns() {
  console.log('\n🗄️ Testing Offerings Table - Required Columns');
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'offerings'
      ORDER BY column_name
    `);
    
    const existingColumns = result.rows.map(row => row.column_name);
    const requiredColumns = [
      'id', 'tenant_id', 'name', 'description', 'offering_type', 'category', 'subcategory',
      'pricing_type', 'base_price', 'currency', 'pricing_config', 'is_schedulable',
      'duration_minutes', 'availability_config', 'has_variants', 'variants',
      'custom_fields', 'is_active', 'display_order', 'tags', 'images', 'metadata',
      'created_at', 'updated_at'
    ];
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    const extraColumns = existingColumns.filter(col => !requiredColumns.includes(col));
    
    logTestResult(
      'Offerings Table - Required Columns',
      missingColumns.length === 0,
      missingColumns.length === 0 ? 
        'All required columns present' : 
        `Missing columns: ${missingColumns.join(', ')}`
    );
    
    if (extraColumns.length > 0) {
      console.log(`ℹ️  Extra columns found: ${extraColumns.join(', ')}`);
    }
    
    // Test specific column types
    const imagesColumn = result.rows.find(row => row.column_name === 'images');
    if (imagesColumn) {
      logTestResult(
        'Offerings images Column Type',
        imagesColumn.data_type === 'jsonb',
        `Expected: jsonb, Got: ${imagesColumn.data_type}`
      );
    }
    
  } catch (error) {
    logTestResult('Offerings Table Columns', false, `Database error: ${error.message}`);
  }
}

/**
 * Test 3: Check if staff table has all required columns
 */
async function testStaffTableColumns() {
  console.log('\n🗄️ Testing Staff Table - Required Columns');
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'staff'
      ORDER BY column_name
    `);
    
    const existingColumns = result.rows.map(row => row.column_name);
    const requiredColumns = [
      'id', 'tenant_id', 'name', 'email', 'phone', 'role', 'specializations',
      'working_hours', 'working_days', 'hourly_rate', 'commission_rate',
      'is_active', 'hire_date', 'notes', 'avatar_url', 'created_at', 'updated_at'
    ];
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    const extraColumns = existingColumns.filter(col => !requiredColumns.includes(col));
    
    logTestResult(
      'Staff Table - Required Columns',
      missingColumns.length === 0,
      missingColumns.length === 0 ? 
        'All required columns present' : 
        `Missing columns: ${missingColumns.join(', ')}`
    );
    
    if (extraColumns.length > 0) {
      console.log(`ℹ️  Extra columns found: ${extraColumns.join(', ')}`);
    }
    
    // Test specific column types
    const specializationsColumn = result.rows.find(row => row.column_name === 'specializations');
    if (specializationsColumn) {
      logTestResult(
        'Staff specializations Column Type',
        specializationsColumn.data_type === 'jsonb',
        `Expected: jsonb, Got: ${specializationsColumn.data_type}`
      );
    }
    
    const workingHoursColumn = result.rows.find(row => row.column_name === 'working_hours');
    if (workingHoursColumn) {
      logTestResult(
        'Staff working_hours Column Type',
        workingHoursColumn.data_type === 'jsonb',
        `Expected: jsonb, Got: ${workingHoursColumn.data_type}`
      );
    }
    
  } catch (error) {
    logTestResult('Staff Table Columns', false, `Database error: ${error.message}`);
  }
}

/**
 * Test 4: Check if transactions table has all required columns
 */
async function testTransactionsTableColumns() {
  console.log('\n🗄️ Testing Transactions Table - Required Columns');
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY column_name
    `);
    
    const existingColumns = result.rows.map(row => row.column_name);
    const requiredColumns = [
      'id', 'tenant_id', 'transaction_number', 'transaction_type', 'customer_name',
      'customer_phone', 'customer_email', 'offering_id', 'staff_id', 'scheduled_at',
      'duration_minutes', 'amount', 'currency', 'notes', 'payment_status',
      'payment_method', 'payment_reference', 'current_state_id', 'workflow_state',
      'custom_fields', 'internal_notes', 'tags', 'priority', 'source',
      'conversation_id', 'metadata', 'created_at', 'updated_at'
    ];
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    const extraColumns = existingColumns.filter(col => !requiredColumns.includes(col));
    
    logTestResult(
      'Transactions Table - Required Columns',
      missingColumns.length === 0,
      missingColumns.length === 0 ? 
        'All required columns present' : 
        `Missing columns: ${missingColumns.join(', ')}`
    );
    
    if (extraColumns.length > 0) {
      console.log(`ℹ️  Extra columns found: ${extraColumns.join(', ')}`);
    }
    
  } catch (error) {
    logTestResult('Transactions Table Columns', false, `Database error: ${error.message}`);
  }
}

/**
 * Test 5: Check table relationships and foreign keys
 */
async function testTableRelationships() {
  console.log('\n🔗 Testing Table Relationships');
  
  try {
    const result = await pool.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    const relationships = result.rows;
    const expectedRelationships = [
      { table: 'offerings', column: 'tenant_id', foreign_table: 'tenants', foreign_column: 'id' },
      { table: 'staff', column: 'tenant_id', foreign_table: 'tenants', foreign_column: 'id' },
      { table: 'transactions', column: 'tenant_id', foreign_table: 'tenants', foreign_column: 'id' },
      { table: 'transactions', column: 'offering_id', foreign_table: 'offerings', foreign_column: 'id' },
      { table: 'transactions', column: 'staff_id', foreign_table: 'staff', foreign_column: 'id' }
    ];
    
    let allRelationshipsPresent = true;
    const missingRelationships = [];
    
    for (const expected of expectedRelationships) {
      const exists = relationships.some(rel => 
        rel.table_name === expected.table &&
        rel.column_name === expected.column &&
        rel.foreign_table_name === expected.foreign_table &&
        rel.foreign_column_name === expected.foreign_column
      );
      
      if (!exists) {
        allRelationshipsPresent = false;
        missingRelationships.push(`${expected.table}.${expected.column} -> ${expected.foreign_table}.${expected.foreign_column}`);
      }
    }
    
    logTestResult(
      'Table Relationships',
      allRelationshipsPresent,
      allRelationshipsPresent ? 
        'All expected relationships present' : 
        `Missing relationships: ${missingRelationships.join(', ')}`
    );
    
  } catch (error) {
    logTestResult('Table Relationships', false, `Database error: ${error.message}`);
  }
}

/**
 * Test 6: Check for required indexes
 */
async function testRequiredIndexes() {
  console.log('\n📊 Testing Required Indexes');
  
  try {
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    const existingIndexes = result.rows;
    const expectedIndexes = [
      'idx_offerings_tenant',
      'idx_offerings_type',
      'idx_offerings_category',
      'idx_offerings_active',
      'idx_offerings_schedulable',
      'idx_transactions_tenant',
      'idx_transactions_type',
      'idx_transactions_customer_phone',
      'idx_transactions_offering',
      'idx_transactions_scheduled',
      'idx_transactions_state',
      'idx_transactions_payment_status'
    ];
    
    const existingIndexNames = existingIndexes.map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !existingIndexNames.includes(idx));
    
    logTestResult(
      'Required Indexes',
      missingIndexes.length === 0,
      missingIndexes.length === 0 ? 
        'All required indexes present' : 
        `Missing indexes: ${missingIndexes.join(', ')}`
    );
    
  } catch (error) {
    logTestResult('Required Indexes', false, `Database error: ${error.message}`);
  }
}

/**
 * Test 7: Check for NOT NULL constraints on critical fields
 */
async function testNotNullConstraints() {
  console.log('\n🚫 Testing NOT NULL Constraints');
  
  try {
    const result = await pool.query(`
      SELECT 
        table_name,
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('offerings', 'staff', 'transactions')
        AND is_nullable = 'NO'
      ORDER BY table_name, column_name
    `);
    
    const notNullColumns = result.rows;
    const expectedNotNullColumns = [
      { table: 'offerings', column: 'id' },
      { table: 'offerings', column: 'tenant_id' },
      { table: 'offerings', column: 'name' },
      { table: 'offerings', column: 'offering_type' },
      { table: 'offerings', column: 'pricing_type' },
      { table: 'offerings', column: 'base_price' },
      { table: 'offerings', column: 'currency' },
      { table: 'offerings', column: 'is_active' },
      { table: 'offerings', column: 'display_order' },
      { table: 'offerings', column: 'created_at' },
      { table: 'offerings', column: 'updated_at' },
      { table: 'staff', column: 'id' },
      { table: 'staff', column: 'tenant_id' },
      { table: 'staff', column: 'name' },
      { table: 'staff', column: 'role' },
      { table: 'staff', column: 'is_active' },
      { table: 'staff', column: 'created_at' },
      { table: 'staff', column: 'updated_at' },
      { table: 'transactions', column: 'id' },
      { table: 'transactions', column: 'tenant_id' },
      { table: 'transactions', column: 'transaction_type' },
      { table: 'transactions', column: 'customer_name' },
      { table: 'transactions', column: 'customer_phone' },
      { table: 'transactions', column: 'amount' },
      { table: 'transactions', column: 'currency' },
      { table: 'transactions', column: 'created_at' },
      { table: 'transactions', column: 'updated_at' }
    ];
    
    let allConstraintsPresent = true;
    const missingConstraints = [];
    
    for (const expected of expectedNotNullColumns) {
      const exists = notNullColumns.some(col => 
        col.table_name === expected.table && col.column_name === expected.column
      );
      
      if (!exists) {
        allConstraintsPresent = false;
        missingConstraints.push(`${expected.table}.${expected.column}`);
      }
    }
    
    logTestResult(
      'NOT NULL Constraints',
      allConstraintsPresent,
      allConstraintsPresent ? 
        'All expected NOT NULL constraints present' : 
        `Missing NOT NULL constraints: ${missingConstraints.join(', ')}`
    );
    
  } catch (error) {
    logTestResult('NOT NULL Constraints', false, `Database error: ${error.message}`);
  }
}

/**
 * Test 8: Check data types for critical fields
 */
async function testDataTypes() {
  console.log('\n🔢 Testing Data Types');
  
  try {
    const result = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('offerings', 'staff', 'transactions')
        AND column_name IN ('id', 'tenant_id', 'base_price', 'amount', 'currency', 'duration_minutes', 'hourly_rate', 'commission_rate')
      ORDER BY table_name, column_name
    `);
    
    const columnTypes = result.rows;
    const expectedTypes = {
      'id': 'uuid',
      'tenant_id': 'uuid',
      'base_price': 'numeric',
      'amount': 'numeric',
      'currency': 'character varying',
      'duration_minutes': 'integer',
      'hourly_rate': 'numeric',
      'commission_rate': 'numeric'
    };
    
    let allTypesCorrect = true;
    const incorrectTypes = [];
    
    for (const column of columnTypes) {
      const expectedType = expectedTypes[column.column_name];
      if (expectedType && column.data_type !== expectedType) {
        allTypesCorrect = false;
        incorrectTypes.push(`${column.table_name}.${column.column_name}: expected ${expectedType}, got ${column.data_type}`);
      }
    }
    
    logTestResult(
      'Data Types',
      allTypesCorrect,
      allTypesCorrect ? 
        'All data types correct' : 
        `Incorrect types: ${incorrectTypes.join(', ')}`
    );
    
  } catch (error) {
    logTestResult('Data Types', false, `Database error: ${error.message}`);
  }
}

/**
 * Test 9: Check for default values
 */
async function testDefaultValues() {
  console.log('\n🔧 Testing Default Values');
  
  try {
    const result = await pool.query(`
      SELECT 
        table_name,
        column_name,
        column_default,
        data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('offerings', 'staff', 'transactions')
        AND column_default IS NOT NULL
      ORDER BY table_name, column_name
    `);
    
    const defaultColumns = result.rows;
    const expectedDefaults = [
      { table: 'offerings', column: 'offering_type', default: 'service' },
      { table: 'offerings', column: 'pricing_type', default: 'fixed' },
      { table: 'offerings', column: 'base_price', default: '0' },
      { table: 'offerings', column: 'currency', default: 'USD' },
      { table: 'offerings', column: 'is_active', default: 'true' },
      { table: 'offerings', column: 'display_order', default: '0' },
      { table: 'staff', column: 'is_active', default: 'true' },
      { table: 'transactions', column: 'currency', default: 'INR' }
    ];
    
    let allDefaultsCorrect = true;
    const incorrectDefaults = [];
    
    for (const expected of expectedDefaults) {
      const column = defaultColumns.find(col => 
        col.table_name === expected.table && col.column_name === expected.column
      );
      
      if (!column || !column.column_default.includes(expected.default)) {
        allDefaultsCorrect = false;
        incorrectDefaults.push(`${expected.table}.${expected.column}: expected ${expected.default}, got ${column?.column_default || 'none'}`);
      }
    }
    
    logTestResult(
      'Default Values',
      allDefaultsCorrect,
      allDefaultsCorrect ? 
        'All default values correct' : 
        `Incorrect defaults: ${incorrectDefaults.join(', ')}`
    );
    
  } catch (error) {
    logTestResult('Default Values', false, `Database error: ${error.message}`);
  }
}

/**
 * Test 10: Check for JSONB fields
 */
async function testJsonbFields() {
  console.log('\n📄 Testing JSONB Fields');
  
  try {
    const result = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('offerings', 'staff', 'transactions')
        AND data_type = 'jsonb'
      ORDER BY table_name, column_name
    `);
    
    const jsonbColumns = result.rows;
    const expectedJsonbColumns = [
      { table: 'offerings', column: 'pricing_config' },
      { table: 'offerings', column: 'availability_config' },
      { table: 'offerings', column: 'variants' },
      { table: 'offerings', column: 'custom_fields' },
      { table: 'offerings', column: 'images' },
      { table: 'offerings', column: 'metadata' },
      { table: 'staff', column: 'specializations' },
      { table: 'staff', column: 'working_hours' },
      { table: 'staff', column: 'working_days' },
      { table: 'transactions', column: 'custom_fields' },
      { table: 'transactions', column: 'metadata' }
    ];
    
    let allJsonbFieldsPresent = true;
    const missingJsonbFields = [];
    
    for (const expected of expectedJsonbColumns) {
      const exists = jsonbColumns.some(col => 
        col.table_name === expected.table && col.column_name === expected.column
      );
      
      if (!exists) {
        allJsonbFieldsPresent = false;
        missingJsonbFields.push(`${expected.table}.${expected.column}`);
      }
    }
    
    logTestResult(
      'JSONB Fields',
      allJsonbFieldsPresent,
      allJsonbFieldsPresent ? 
        'All expected JSONB fields present' : 
        `Missing JSONB fields: ${missingJsonbFields.join(', ')}`
    );
    
  } catch (error) {
    logTestResult('JSONB Fields', false, `Database error: ${error.message}`);
  }
}

/**
 * Run all database schema tests
 */
async function runAllSchemaTests() {
  console.log('🗄️ Starting Database Schema Validation Test Suite');
  console.log('================================================');
  
  try {
    await testStaffWorkingDaysColumn();
    await testOfferingsTableColumns();
    await testStaffTableColumns();
    await testTransactionsTableColumns();
    await testTableRelationships();
    await testRequiredIndexes();
    await testNotNullConstraints();
    await testDataTypes();
    await testDefaultValues();
    await testJsonbFields();
    
  } catch (error) {
    console.error('❌ Schema test suite error:', error);
    testResults.errors.push(error.message);
  }
  
  // Print summary
  console.log('\n📊 Schema Test Results Summary');
  console.log('==============================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`🔍 Total: ${testResults.passed + testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 Errors:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n📋 Detailed Results:');
  testResults.details.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${result.test}: ${result.details}`);
  });
  
  return testResults;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSchemaTests().then(() => {
    pool.end();
    process.exit(testResults.failed > 0 ? 1 : 0);
  });
}

export { runAllSchemaTests };
