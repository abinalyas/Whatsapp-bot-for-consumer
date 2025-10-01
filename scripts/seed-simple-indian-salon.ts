import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

// Simplified Indian salon data
const services = [
  { name: "Hair Cut & Style", category: "Hair", base_price: 300, duration_minutes: 45 },
  { name: "Hair Coloring", category: "Hair", base_price: 1200, duration_minutes: 120 },
  { name: "Hair Spa", category: "Hair", base_price: 800, duration_minutes: 90 },
  { name: "Facial Cleanup", category: "Beauty", base_price: 400, duration_minutes: 60 },
  { name: "Gold Facial", category: "Beauty", base_price: 800, duration_minutes: 75 },
  { name: "Threading", category: "Beauty", base_price: 50, duration_minutes: 15 },
  { name: "Manicure", category: "Nails", base_price: 300, duration_minutes: 45 },
  { name: "Pedicure", category: "Nails", base_price: 400, duration_minutes: 60 },
  { name: "Bridal Makeup", category: "Makeup", base_price: 8000, duration_minutes: 240 },
  { name: "Party Makeup", category: "Makeup", base_price: 1500, duration_minutes: 90 }
];

const staff = [
  { name: "Priya Sharma", role: "Senior Hair Stylist", email: "priya@bellasalon.com", phone: "+91 98765 43210" },
  { name: "Rajesh Kumar", role: "Hair Stylist", email: "rajesh@bellasalon.com", phone: "+91 98765 43211" },
  { name: "Anita Patel", role: "Beauty Therapist", email: "anita@bellasalon.com", phone: "+91 98765 43212" },
  { name: "Sunita Singh", role: "Nail Artist", email: "sunita@bellasalon.com", phone: "+91 98765 43213" },
  { name: "Kavita Mehta", role: "Makeup Artist", email: "kavita@bellasalon.com", phone: "+91 98765 43214" }
];

const customers = [
  { name: "Shreya Gupta", phone: "+91 98765 12340", email: "shreya.gupta@gmail.com" },
  { name: "Pooja Sharma", phone: "+91 98765 12341", email: "pooja.sharma@gmail.com" },
  { name: "Anjali Singh", phone: "+91 98765 12342", email: "anjali.singh@gmail.com" },
  { name: "Kavya Reddy", phone: "+91 98765 12343", email: "kavya.reddy@gmail.com" },
  { name: "Ritu Agarwal", phone: "+91 98765 12344", email: "ritu.agarwal@gmail.com" }
];

async function seedSimpleData() {
  try {
    console.log('🇮🇳 Seeding Simple Indian Salon Data...');
    
    // Get tenant ID
    const tenantResult = await sql`
      SELECT id FROM tenants WHERE domain = 'bella-salon' OR business_name = 'Bella Salon'
    `;
    
    if (tenantResult.length === 0) {
      console.error('❌ Tenant not found.');
      return;
    }
    
    const tenantId = tenantResult[0].id;
    console.log(`✅ Found tenant: ${tenantId}`);
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await sql`DELETE FROM transactions WHERE tenant_id = ${tenantId}`;
    await sql`DELETE FROM offerings WHERE tenant_id = ${tenantId}`;
    await sql`DELETE FROM staff WHERE tenant_id = ${tenantId}`;
    
    // Insert services
    console.log('💇‍♀️ Inserting services...');
    const serviceIds = [];
    for (const service of services) {
      const result = await sql`
        INSERT INTO offerings (
          tenant_id, name, category, base_price, currency, duration_minutes, 
          is_active, display_order, offering_type
        ) VALUES (
          ${tenantId}, ${service.name}, ${service.category}, ${service.base_price}, 
          'INR', ${service.duration_minutes}, true, ${serviceIds.length + 1}, 'service'
        )
        RETURNING id
      `;
      serviceIds.push(result[0].id);
      console.log(`  ✅ Added: ${service.name}`);
    }
    
    // Insert staff
    console.log('👥 Inserting staff...');
    const staffIds = [];
    for (const staffMember of staff) {
      const result = await sql`
        INSERT INTO staff (
          tenant_id, name, email, phone, role, is_active
        ) VALUES (
          ${tenantId}, ${staffMember.name}, ${staffMember.email}, ${staffMember.phone}, 
          ${staffMember.role}, true
        )
        RETURNING id
      `;
      staffIds.push(result[0].id);
      console.log(`  ✅ Added: ${staffMember.name}`);
    }
    
    // Generate appointments for next 7 days
    console.log('📅 Generating appointments...');
    const appointments = [];
    const today = new Date();
    
    for (let day = 0; day < 7; day++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + day);
      
      // Skip Sundays
      if (appointmentDate.getDay() === 0) continue;
      
      // 2-5 appointments per day
      const appointmentsPerDay = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < appointmentsPerDay; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const service = services[Math.floor(Math.random() * services.length)];
        const staffMember = staff[Math.floor(Math.random() * staff.length)];
        
        const serviceId = serviceIds[services.indexOf(service)];
        const staffId = staffIds[staff.indexOf(staffMember)];
        
        // Time slots 9 AM to 6 PM
        const hour = Math.floor(Math.random() * 9) + 9;
        const minute = Math.random() < 0.5 ? 0 : 30;
        
        const scheduledAt = new Date(appointmentDate);
        scheduledAt.setHours(hour, minute, 0, 0);
        
        const paymentStatuses = ['confirmed', 'confirmed', 'pending', 'completed'];
        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        
        appointments.push({
          tenant_id: tenantId,
          transaction_type: 'booking',
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          offering_id: serviceId,
          staff_id: staffId,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: service.duration_minutes,
          amount: service.base_price,
          currency: 'INR',
          payment_status: paymentStatus,
          payment_method: paymentStatus === 'completed' ? 'cash' : null,
          notes: `Appointment for ${service.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // Insert appointments
    console.log(`📝 Inserting ${appointments.length} appointments...`);
    for (const appointment of appointments) {
      await sql`
        INSERT INTO transactions (
          tenant_id, transaction_type, customer_name, customer_phone, customer_email,
          offering_id, staff_id, scheduled_at, duration_minutes, amount, currency,
          payment_status, payment_method, notes, created_at, updated_at
        ) VALUES (
          ${appointment.tenant_id}, ${appointment.transaction_type}, ${appointment.customer_name}, 
          ${appointment.customer_phone}, ${appointment.customer_email}, ${appointment.offering_id}, 
          ${appointment.staff_id}, ${appointment.scheduled_at}, ${appointment.duration_minutes}, 
          ${appointment.amount}, ${appointment.currency}, ${appointment.payment_status}, 
          ${appointment.payment_method}, ${appointment.notes}, ${appointment.created_at}, ${appointment.updated_at}
        )
      `;
    }
    
    console.log('🎉 Simple Indian Salon Data Seeding Complete!');
    console.log(`✅ Added ${services.length} services`);
    console.log(`✅ Added ${staff.length} staff members`);
    console.log(`✅ Added ${appointments.length} appointments`);
    
    // Show today's appointments
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_at);
      const today = new Date();
      return aptDate.toDateString() === today.toDateString();
    });
    
    console.log(`📊 Today's appointments: ${todayAppointments.length}`);
    console.log(`💰 Total revenue: ₹${appointments.reduce((sum, apt) => sum + apt.amount, 0).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedSimpleData();
