/**
 * Update Staff Specializations
 * Add appropriate specializations based on roles and services
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function updateStaffSpecializations() {
  console.log('🔄 Update Staff Specializations');
  console.log('===============================\n');
  
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
    
    // Define staff specializations based on roles
    const staffSpecializations = {
      'Beauty Therapist': ['Facial', 'Facial Cleanup', 'Facial Treatment', 'Gold Facial', 'Massage'],
      'Makeup Artist': ['Bridal Makeup', 'Party Makeup'],
      'Senior Hair Stylist': ['Hair Coloring', 'Hair Cut & Style', 'Hair Spa', 'Haircut', 'Haircut & Style'],
      'Hair Stylist': ['Hair Cut & Style', 'Haircut', 'Haircut & Style'],
      'Nail Artist': ['Manicure', 'Pedicure', 'Nail Polish']
    };
    
    // Update each staff member with appropriate specializations
    const staffResult = await sql`
      SELECT id, name, role
      FROM staff 
      WHERE tenant_id = ${tenantId}
      ORDER BY name
    `;
    
    console.log('📊 Updating Staff Specializations:');
    console.log('===================================\n');
    
    for (const staff of staffResult) {
      const specializations = staffSpecializations[staff.role] || [];
      
      if (specializations.length > 0) {
        await sql`
          UPDATE staff 
          SET specializations = ${JSON.stringify(specializations)}::jsonb
          WHERE id = ${staff.id}
        `;
        
        console.log(`✅ ${staff.name} (${staff.role})`);
        console.log(`   Specializations: ${specializations.join(', ')}`);
        console.log('');
      } else {
        console.log(`⚠️  ${staff.name} (${staff.role}) - No specializations defined`);
        console.log('');
      }
    }
    
    console.log('🎯 Verification - Updated Staff:');
    console.log('================================');
    
    // Verify the updates
    const updatedStaffResult = await sql`
      SELECT id, name, role, specializations
      FROM staff 
      WHERE tenant_id = ${tenantId}
      ORDER BY name
    `;
    
    updatedStaffResult.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name} (${staff.role})`);
      console.log(`   Specializations: ${JSON.stringify(staff.specializations)}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error updating staff specializations:', error);
  }
}

updateStaffSpecializations();
