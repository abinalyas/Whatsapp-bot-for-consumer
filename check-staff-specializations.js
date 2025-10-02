/**
 * Check Staff Specializations
 * See what staff specializations are available in the database
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkStaffSpecializations() {
  console.log('🔍 Check Staff Specializations');
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
    
    // Get all staff with their specializations
    const staffResult = await sql`
      SELECT id, name, role, specializations, working_hours, is_active
      FROM staff 
      WHERE tenant_id = ${tenantId}
      ORDER BY name
    `;
    
    console.log('📊 Staff Specializations:');
    console.log('=========================\n');
    
    staffResult.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name}`);
      console.log(`   Role: ${staff.role}`);
      console.log(`   Specializations: ${JSON.stringify(staff.specializations)}`);
      console.log(`   Active: ${staff.is_active}`);
      console.log(`   Working Hours: ${JSON.stringify(staff.working_hours)}`);
      console.log('');
    });
    
    // Get unique specializations across all staff
    const allSpecializations = new Set();
    staffResult.forEach(staff => {
      if (Array.isArray(staff.specializations)) {
        staff.specializations.forEach(spec => allSpecializations.add(spec));
      }
    });
    
    console.log('🎯 Unique Specializations:');
    console.log('==========================');
    Array.from(allSpecializations).forEach((spec, index) => {
      console.log(`${index + 1}. ${spec}`);
    });
    
    // Check services and their structure
    console.log('\n📋 Services:');
    console.log('============');
    
    const servicesResult = await sql`
      SELECT name, price, description, is_active
      FROM services 
      WHERE is_active = true
      ORDER BY name
    `;
    
    servicesResult.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} - ₹${service.price}`);
      console.log(`   Description: ${service.description || 'No description'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking staff specializations:', error);
  }
}

checkStaffSpecializations();
