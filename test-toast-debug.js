#!/usr/bin/env node

// Test script to check if toast buttons are visible on the deployed application
const https = require('https');
const http = require('http');

console.log('🔍 Testing deployed application for toast buttons...');

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testDeployedApp() {
  try {
    console.log('📡 Fetching deployed application...');
    
    // Try to get the main page
    const response = await makeRequest('https://whatsapp-bot-for-consumer.vercel.app/');
    
    console.log('📊 Response Status:', response.statusCode);
    console.log('📊 Content Length:', response.body.length);
    
    // Check if our debug elements are in the response
    const hasDebugBanner = response.body.includes('DEBUG: Toast testing buttons should be visible');
    const hasTestToast = response.body.includes('Test Toast');
    const hasTestDestructive = response.body.includes('Test Destructive');
    const hasRefreshButton = response.body.includes('Refresh');
    
    console.log('\n🔍 Debug Analysis:');
    console.log('  - Debug Banner Found:', hasDebugBanner);
    console.log('  - Test Toast Button Found:', hasTestToast);
    console.log('  - Test Destructive Button Found:', hasTestDestructive);
    console.log('  - Refresh Button Found:', hasRefreshButton);
    
    if (hasDebugBanner || hasTestToast || hasTestDestructive || hasRefreshButton) {
      console.log('\n✅ Changes are deployed! The debug elements are present in the response.');
    } else {
      console.log('\n❌ Changes are NOT deployed. The debug elements are missing from the response.');
      console.log('\n🔍 This suggests:');
      console.log('  1. The build process might not be running');
      console.log('  2. The changes might not be in the built files');
      console.log('  3. There might be a caching issue');
    }
    
    // Check for specific salon dashboard content
    const hasSalonDashboard = response.body.includes('salon-dashboard');
    const hasBellaSalon = response.body.includes('Bella Salon');
    
    console.log('\n🏢 Salon Dashboard Analysis:');
    console.log('  - Salon Dashboard Route Found:', hasSalonDashboard);
    console.log('  - Bella Salon Content Found:', hasBellaSalon);
    
    // Check if this is a SPA (Single Page Application)
    const isSPA = response.body.includes('id="root"') && response.body.length < 10000;
    console.log('\n📱 Application Type:');
    console.log('  - Is SPA:', isSPA);
    
    if (isSPA) {
      console.log('\n💡 This is a Single Page Application (SPA)');
      console.log('   - The content is loaded dynamically by JavaScript');
      console.log('   - Our changes might be in the JavaScript bundle');
      console.log('   - The HTML response won\'t show our React components');
    }
    
  } catch (error) {
    console.error('❌ Error testing deployed application:', error.message);
  }
}

// Run the test
testDeployedApp();
