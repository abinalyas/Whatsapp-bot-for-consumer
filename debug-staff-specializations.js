/**
 * Debug Staff Specializations
 * Check if staff specializations are properly set up for smart matching
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function debugStaffSpecializations() {
  console.log('🔍 Debug Staff Specializations');
  console.log('==============================\n');
  
  try {
    // Get Bella Salon tenant ID
    const tenantResult = await sql`
      SELECT id FROM tenants WHERE domain = 'bella-salon'
    `;
    
    if (tenantResult.length === 0) {
      console.log('❌ Bella Salon tenant not found');
      return;
    }
    
    const tenantId = tenantResult[0].id;
    console.log(`✅ Found Bella Salon tenant: ${tenantId}\n`);
    
    // Check staff specializations
    console.log('📊 Staff Specializations:');
    const staffResult = await sql`
      SELECT id, name, role, specializations, is_active
      FROM staff 
      WHERE tenant_id = ${tenantId}
      ORDER BY name
    `;
    
    staffResult.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name} (${staff.role})`);
      console.log(`   Active: ${staff.is_active}`);
      console.log(`   Specializations: ${JSON.stringify(staff.specializations)}`);
      console.log('');
    });
    
    // Test staff matching for "Hair Cut & Style"
    console.log('🧪 Testing staff matching for "Hair Cut & Style":');
    const matchingStaff = await sql`
      SELECT id, name, role
      FROM staff 
      WHERE tenant_id = ${tenantId} 
      AND is_active = true
      AND specializations @> ${JSON.stringify(['Hair Cut & Style'])}::jsonb
    `;
    
    console.log(`Found ${matchingStaff.length} staff members who can perform "Hair Cut & Style":`);
    matchingStaff.forEach(staff => {
      console.log(`- ${staff.name} (${staff.role})`);
    });
    
    if (matchingStaff.length === 0) {
      console.log('❌ No staff found for "Hair Cut & Style"');
      console.log('This explains why time selection is failing!');
      
      // Check what specializations exist
      console.log('\n📋 All specializations in database:');
      const allSpecs = new Set();
      staffResult.forEach(staff => {
        if (Array.isArray(staff.specializations)) {
          staff.specializations.forEach(spec => allSpecs.add(spec));
        }
      });
      
      console.log('Available specializations:');
      Array.from(allSpecs).forEach((spec, index) => {
        console.log(`${index + 1}. ${spec}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error debugging staff specializations:', error);
  }
}

debugStaffSpecializations();
