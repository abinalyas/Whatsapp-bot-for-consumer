/**
 * Test WhatsApp Booking Integration
 * Tests the end-to-end WhatsApp booking flow
 */

const fetch = require('node-fetch');

const TEST_CONFIG = {
  baseUrl: 'https://whatsapp-bot-for-consumer.vercel.app',
  tenantId: 'bella-salon', // or use actual tenant ID from database
  testPhoneNumber: '9876543210',
  webhookUrl: '/api/webhook/whatsapp/test/bella-salon'
};

async function testWhatsAppBooking() {
  console.log('🧪 Testing WhatsApp Booking Integration...\n');

  try {
    // Test 1: Initial booking request
    console.log('📱 Test 1: Sending initial booking request...');
    const bookingRequest = await sendTestMessage('book appointment');
    console.log('✅ Response:', bookingRequest.message);
    console.log('');

    // Test 2: Service selection
    console.log('💇‍♀️ Test 2: Selecting hair service...');
    const serviceSelection = await sendTestMessage('hair cut and color');
    console.log('✅ Response:', serviceSelection.message);
    console.log('');

    // Test 3: Date selection
    console.log('📅 Test 3: Selecting date...');
    const dateSelection = await sendTestMessage('1');
    console.log('✅ Response:', dateSelection.message);
    console.log('');

    // Test 4: Time selection
    console.log('⏰ Test 4: Selecting time...');
    const timeSelection = await sendTestMessage('1');
    console.log('✅ Response:', timeSelection.message);
    console.log('');

    // Test 5: Staff selection
    console.log('👩‍💼 Test 5: Selecting staff...');
    const staffSelection = await sendTestMessage('1');
    console.log('✅ Response:', staffSelection.message);
    console.log('');

    // Test 6: Confirmation
    console.log('✅ Test 6: Confirming appointment...');
    const confirmation = await sendTestMessage('yes');
    console.log('✅ Response:', confirmation.message);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    
    if (confirmation.appointmentId) {
      console.log(`📋 Appointment ID: ${confirmation.appointmentId}`);
      console.log('✅ Appointment should now appear in salon dashboard!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function sendTestMessage(message) {
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.webhookUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: TEST_CONFIG.testPhoneNumber,
        message: message,
        phoneNumberId: 'test-phone-id'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`API Error: ${result.message || 'Unknown error'}`);
    }

    return {
      success: true,
      message: result.results?.[0]?.response?.content || 'No response content',
      appointmentId: result.results?.[0]?.appointmentId
    };

  } catch (error) {
    throw new Error(`Failed to send test message: ${error.message}`);
  }
}

// Test webhook health
async function testWebhookHealth() {
  console.log('🏥 Testing webhook health...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/whatsapp/status`);
    const result = await response.json();
    
    if (result.status === 'healthy') {
      console.log('✅ Webhook is healthy');
      return true;
    } else {
      console.log('❌ Webhook is not healthy:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook health check failed:', error.message);
    return false;
  }
}

// Main test execution
async function main() {
  console.log('🚀 WhatsApp Booking Integration Test Suite');
  console.log('==========================================\n');

  // Check webhook health first
  const isHealthy = await testWebhookHealth();
  if (!isHealthy) {
    console.log('❌ Webhook is not healthy. Aborting tests.');
    return;
  }

  console.log('');

  // Run booking flow tests
  await testWhatsAppBooking();
}

// Run tests if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testWhatsAppBooking,
  testWebhookHealth,
  sendTestMessage
};
