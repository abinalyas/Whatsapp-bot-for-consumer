/**
 * Script to update existing database data for Indian localization
 * - Updates currency from USD to INR
 * - Updates phone numbers to Indian format
 * - Adds sample Indian appointments
 * - Updates service prices to Indian market rates
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { services, bookings, conversations } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import ws from "ws";

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Indian service data with realistic prices
const indianServices = [
  {
    name: "Hair Cut & Style",
    description: "Professional hair cutting and styling service",
    price: 500, // ₹500
    durationMinutes: 60,
    category: "Hair Care",
    isActive: true,
  },
  {
    name: "Hair Color",
    description: "Full hair coloring service with premium products",
    price: 1500, // ₹1500
    durationMinutes: 120,
    category: "Hair Care",
    isActive: true,
  },
  {
    name: "Manicure",
    description: "Complete manicure with nail art",
    price: 300, // ₹300
    durationMinutes: 45,
    category: "Nail Care",
    isActive: true,
  },
  {
    name: "Pedicure",
    description: "Relaxing pedicure with foot massage",
    price: 400, // ₹400
    durationMinutes: 60,
    category: "Nail Care",
    isActive: true,
  },
  {
    name: "Facial Treatment",
    description: "Deep cleansing facial treatment",
    price: 800, // ₹800
    durationMinutes: 90,
    category: "Skin Care",
    isActive: true,
  },
  {
    name: "Beard Trim",
    description: "Professional beard trimming and shaping",
    price: 300, // ₹300
    durationMinutes: 30,
    category: "Men's Grooming",
    isActive: true,
  },
  {
    name: "Bridal Makeup",
    description: "Complete bridal makeup package",
    price: 5000, // ₹5000
    durationMinutes: 180,
    category: "Bridal",
    isActive: true,
  }
];

// Indian customer data with phone numbers
const indianCustomers = [
  {
    name: "Priya Sharma",
    phone: "919876543210",
    email: "priya.sharma@email.com"
  },
  {
    name: "Rajesh Kumar",
    phone: "918765432109",
    email: "rajesh.kumar@email.com"
  },
  {
    name: "Sunita Patel",
    phone: "917654321098",
    email: "sunita.patel@email.com"
  },
  {
    name: "Amit Singh",
    phone: "916543210987",
    email: "amit.singh@email.com"
  },
  {
    name: "Kavita Reddy",
    phone: "915432109876",
    email: "kavita.reddy@email.com"
  },
  {
    name: "Deepika Sharma",
    phone: "914321098765",
    email: "deepika.sharma@email.com"
  },
  {
    name: "Arjun Gupta",
    phone: "913210987654",
    email: "arjun.gupta@email.com"
  },
  {
    name: "Sneha Joshi",
    phone: "912109876543",
    email: "sneha.joshi@email.com"
  }
];

// Sample appointments with Indian data
const sampleAppointments = [
  {
    customerName: "Priya Sharma",
    phoneNumber: "919876543210",
    serviceId: "c61d941e-1853-41cc-8450-98a35a622b91", // Will be updated with actual service ID
    amount: 1500,
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    appointmentTime: "11:30 AM",
    status: "confirmed",
    paymentMethod: "UPI",
    notes: "Regular customer, prefers Emma as stylist"
  },
  {
    customerName: "Rajesh Kumar",
    phoneNumber: "918765432109",
    serviceId: "c61d941e-1853-41cc-8450-98a35a622b91", // Will be updated with actual service ID
    amount: 300,
    appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    appointmentTime: "2:00 PM",
    status: "confirmed",
    paymentMethod: "Cash",
    notes: "First time customer"
  },
  {
    customerName: "Sunita Patel",
    phoneNumber: "917654321098",
    serviceId: "c61d941e-1853-41cc-8450-98a35a622b91", // Will be updated with actual service ID
    amount: 300,
    appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    appointmentTime: "10:00 AM",
    status: "pending",
    paymentMethod: "Paytm",
    notes: "Prefers morning appointments"
  },
  {
    customerName: "Amit Singh",
    phoneNumber: "916543210987",
    serviceId: "c61d941e-1853-41cc-8450-98a35a622b91", // Will be updated with actual service ID
    amount: 500,
    appointmentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    appointmentTime: "3:30 PM",
    status: "confirmed",
    paymentMethod: "PhonePe",
    notes: "VIP customer"
  },
  {
    customerName: "Kavita Reddy",
    phoneNumber: "915432109876",
    serviceId: "c61d941e-1853-41cc-8450-98a35a622b91", // Will be updated with actual service ID
    amount: 800,
    appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    appointmentTime: "11:00 AM",
    status: "confirmed",
    paymentMethod: "UPI",
    notes: "Monthly facial treatment"
  }
];

async function updateIndianData() {
  try {
    console.log('🇮🇳 Starting Indian data update...');

    // 1. Update existing services with Indian prices
    console.log('📝 Updating service prices to Indian market rates...');
    
    // Update existing services with Indian prices
    await db.update(services)
      .set({
        price: sql`CASE 
          WHEN name = 'Haircut' THEN 500
          WHEN name = 'Hair Color' THEN 1500
          WHEN name = 'Manicure' THEN 300
          WHEN name = 'Pedicure' THEN 400
          WHEN name = 'Facial Treatment' THEN 800
          ELSE price
        END`
      });

    // Add new Indian services if they don't exist
    for (const service of indianServices) {
      const existingService = await db.select().from(services).where(eq(services.name, service.name)).limit(1);
      
      if (existingService.length === 0) {
        await db.insert(services).values({
          tenantId: 'default-tenant', // You may need to adjust this based on your tenant setup
          ...service
        });
        console.log(`✅ Added new service: ${service.name} - ₹${service.price}`);
      } else {
        await db.update(services)
          .set({
            price: service.price,
            description: service.description
          })
          .where(eq(services.name, service.name));
        console.log(`✅ Updated service: ${service.name} - ₹${service.price}`);
      }
    }

    // 2. Update existing bookings with Indian phone numbers and currency
    console.log('📱 Updating existing bookings with Indian phone numbers...');
    
    // Get existing bookings and update them
    const existingBookings = await db.select().from(bookings);
    
    for (let i = 0; i < existingBookings.length && i < indianCustomers.length; i++) {
      const booking = existingBookings[i];
      const customer = indianCustomers[i];
      
      await db.update(bookings)
        .set({
          phoneNumber: customer.phone,
          customerName: customer.name,
          amount: booking.amount * 10, // Convert from USD to INR (approximate)
          paymentMethod: ['UPI', 'Paytm', 'PhonePe', 'Cash', 'Credit Card'][Math.floor(Math.random() * 5)]
        })
        .where(eq(bookings.id, booking.id));
      
      console.log(`✅ Updated booking for ${customer.name} - ${customer.phone}`);
    }

    // 3. Add sample Indian appointments
    console.log('📅 Adding sample Indian appointments...');
    
    // Get service IDs for appointments
    const serviceList = await db.select().from(services);
    const hairCutService = serviceList.find(s => s.name.includes('Hair') || s.name.includes('Haircut'));
    const serviceId = hairCutService?.id || serviceList[0]?.id;

    for (const appointment of sampleAppointments) {
      // Create conversation first
      const [conversation] = await db.insert(conversations).values({
        tenantId: 'default-tenant',
        phoneNumber: appointment.phoneNumber,
        customerName: appointment.customerName,
        currentState: 'completed',
        selectedService: serviceId,
        selectedDate: appointment.appointmentDate.toISOString().split('T')[0],
        selectedTime: appointment.appointmentTime,
      }).returning();

      // Create booking
      await db.insert(bookings).values({
        tenantId: 'default-tenant',
        conversationId: conversation.id,
        serviceId: serviceId,
        phoneNumber: appointment.phoneNumber,
        customerName: appointment.customerName,
        amount: appointment.amount,
        status: appointment.status,
        paymentMethod: appointment.paymentMethod,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        notes: appointment.notes
      });

      console.log(`✅ Added appointment for ${appointment.customerName} - ${appointment.appointmentTime}`);
    }

    // 4. Update conversations with Indian phone numbers
    console.log('💬 Updating conversations with Indian phone numbers...');
    
    const existingConversations = await db.select().from(conversations);
    
    for (let i = 0; i < existingConversations.length && i < indianCustomers.length; i++) {
      const conversation = existingConversations[i];
      const customer = indianCustomers[i];
      
      await db.update(conversations)
        .set({
          phoneNumber: customer.phone,
          customerName: customer.name
        })
        .where(eq(conversations.id, conversation.id));
      
      console.log(`✅ Updated conversation for ${customer.name} - ${customer.phone}`);
    }

    console.log('🎉 Indian data update completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Updated ${serviceList.length} services with Indian pricing`);
    console.log(`   - Updated ${existingBookings.length} bookings with Indian data`);
    console.log(`   - Added ${sampleAppointments.length} sample Indian appointments`);
    console.log(`   - Updated ${existingConversations.length} conversations with Indian phone numbers`);

  } catch (error) {
    console.error('❌ Error updating Indian data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the update
updateIndianData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

export { updateIndianData };
