// Test service toggle functionality specifically
import fetch from 'node-fetch';

async function testServiceToggle() {
  try {
    console.log('🧪 Testing Service Toggle Functionality...\n');
    
    const baseUrl = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': 'bella-salon'
    };
    
    // Step 1: Create a test service
    console.log('1. Creating test service...');
    const createResponse = await fetch(`${baseUrl}/api/salon/services`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Toggle Service',
        base_price: 100,
        category: 'test',
        duration_minutes: 30,
        currency: 'INR',
        description: 'Test service for toggle functionality',
        is_active: true
      })
    });
    
    const createResult = await createResponse.json();
    console.log('   Status:', createResponse.status);
    console.log('   Service ID:', createResult.data?.id);
    
    if (createResponse.status !== 200) {
      console.error('❌ Service creation failed');
      return;
    }
    
    const serviceId = createResult.data.id;
    
    // Step 2: Toggle service to inactive (this was the failing case)
    console.log('\n2. Toggling service to inactive...');
    const toggleResponse = await fetch(`${baseUrl}/api/salon/services/${serviceId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        is_active: false
      })
    });
    
    const toggleResult = await toggleResponse.json();
    console.log('   Status:', toggleResponse.status);
    console.log('   Success:', toggleResult.success);
    console.log('   Is Active:', toggleResult.data?.is_active);
    
    if (toggleResponse.status === 200 && toggleResult.data?.is_active === false) {
      console.log('✅ Service toggle to inactive: SUCCESS');
    } else {
      console.log('❌ Service toggle to inactive: FAILED');
      console.log('   Error:', toggleResult.error);
    }
    
    // Step 3: Toggle service back to active
    console.log('\n3. Toggling service back to active...');
    const toggleBackResponse = await fetch(`${baseUrl}/api/salon/services/${serviceId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        is_active: true
      })
    });
    
    const toggleBackResult = await toggleBackResponse.json();
    console.log('   Status:', toggleBackResponse.status);
    console.log('   Success:', toggleBackResult.success);
    console.log('   Is Active:', toggleBackResult.data?.is_active);
    
    if (toggleBackResponse.status === 200 && toggleBackResult.data?.is_active === true) {
      console.log('✅ Service toggle to active: SUCCESS');
    } else {
      console.log('❌ Service toggle to active: FAILED');
      console.log('   Error:', toggleBackResult.error);
    }
    
    // Step 4: Clean up - delete the test service
    console.log('\n4. Cleaning up test service...');
    const deleteResponse = await fetch(`${baseUrl}/api/salon/services/${serviceId}`, {
      method: 'DELETE',
      headers
    });
    
    console.log('   Delete Status:', deleteResponse.status);
    
    console.log('\n🎉 Service toggle test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testServiceToggle();
