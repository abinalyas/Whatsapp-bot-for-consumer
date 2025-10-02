/**
 * Check Salon Appointments
 * Check what appointments are returned by the salon dashboard API
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
};

async function checkSalonAppointments() {
  console.log('🔍 Check Salon Appointments');
  console.log('==========================\n');
  
  try {
    // Check salon appointments
    console.log('📊 Salon Dashboard Appointments:');
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/salon/appointments`, {
      headers: {
        'x-tenant-id': 'bella-salon'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Found ${data.data.length} appointments in salon dashboard`);
      
      // Show recent appointments
      const recentAppointments = data.data.slice(0, 5);
      recentAppointments.forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.customer_name || 'Unknown'} - ${apt.service_name || 'Unknown Service'} - ${apt.amount || 'N/A'} - ${apt.appointment_date || 'No Date'}`);
      });
      
      // Check if any are from WhatsApp Bot
      const whatsappBookings = data.data.filter(apt => 
        apt.notes && apt.notes.includes('WhatsApp booking')
      );
      
      console.log(`\n📱 WhatsApp Bot bookings in salon dashboard: ${whatsappBookings.length}`);
      whatsappBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.customer_name} - ${booking.service_name} - ${booking.amount} - ${booking.appointment_date}`);
      });
    }
    
    // Check regular bookings API
    console.log('\n📊 Regular Bookings API:');
    const bookingsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings`);
    
    if (bookingsResponse.ok) {
      const bookings = await bookingsResponse.json();
      console.log(`Found ${bookings.length} bookings in regular API`);
      
      // Show recent bookings
      const recentBookings = bookings.slice(0, 5);
      recentBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.customerName || 'Unknown'} - ${booking.amount || 'N/A'} - ${booking.appointmentDate || 'No Date'} - ${booking.notes || 'No Notes'}`);
      });
      
      // Check if any are from WhatsApp Bot
      const whatsappBookings = bookings.filter(booking => 
        booking.notes && booking.notes.includes('WhatsApp booking')
      );
      
      console.log(`\n📱 WhatsApp Bot bookings in regular API: ${whatsappBookings.length}`);
      whatsappBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.customerName} - ${booking.amount} - ${booking.appointmentDate} - ${booking.notes}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking salon appointments:', error);
  }
}

async function main() {
  console.log('🚀 Check Salon Appointments');
  console.log('==========================\n');
  
  await checkSalonAppointments();
  
  console.log('\n🎯 Analysis:');
  console.log('- Check if WhatsApp Bot bookings appear in salon dashboard');
  console.log('- Identify why they might not be showing up');
  console.log('- Fix the integration if needed');
}

main().catch(console.error);
