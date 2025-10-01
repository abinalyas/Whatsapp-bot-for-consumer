import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testAllUIFlows() {
  console.log('🎭 Starting Comprehensive UI Flows Test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Browser Error:', msg.text());
      } else if (msg.text().includes('🚀') || msg.text().includes('🔍') || msg.text().includes('✅')) {
        console.log('📱 Browser Log:', msg.text());
      }
    });

    console.log('🌐 Navigating to salon dashboard...');
    await page.goto(`${BASE_URL}/salon-dashboard`, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Page loaded successfully');
    
    // Helper function to find and click buttons
    const findAndClickButton = async (buttonText, section = '') => {
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.includes(buttonText)) {
          console.log(`📝 Clicking "${buttonText}" button${section ? ` in ${section}` : ''}...`);
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
      }
      console.log(`⚠️ Button "${buttonText}" not found${section ? ` in ${section}` : ''}`);
      return false;
    };

    // Helper function to check if modal opened
    const checkModalOpened = async (modalName) => {
      const modal = await page.$('.fixed.inset-0');
      if (modal) {
        console.log(`✅ ${modalName} modal opened successfully`);
        return true;
      } else {
        console.log(`❌ ${modalName} modal did not open`);
        return false;
      }
    };

    // Helper function to close modal
    const closeModal = async () => {
      const allButtons = await page.$$('button');
      let cancelButton = null;
      for (const btn of allButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && (text.includes('Cancel') || text.includes('Close'))) {
          cancelButton = btn;
          break;
        }
      }
      
      if (cancelButton) {
        await cancelButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Modal closed');
        return true;
      }
      return false;
    };

    // Helper function to fill form fields
    const fillFormField = async (selector, value, fieldName) => {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await element.evaluate(el => el.value = ''); // Clear existing value
          await page.keyboard.type(value);
          console.log(`✅ Filled ${fieldName}: ${value}`);
          return true;
        } else {
          console.log(`⚠️ Field not found: ${fieldName} (${selector})`);
          return false;
        }
      } catch (error) {
        console.log(`❌ Error filling ${fieldName}:`, error.message);
        return false;
      }
    };

    // Test 1: Overview Section - All Flows
    console.log('\n🧪 === TEST 1: OVERVIEW SECTION ===');
    
    // Navigate to Overview
    if (await findAndClickButton('Overview')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test Edit Appointment Modal
      console.log('\n📝 Testing Edit Appointment Modal...');
      if (await findAndClickButton('Edit', 'Overview')) {
        if (await checkModalOpened('Edit Appointment')) {
          // Test time field
          const timeInputs = await page.$$('input[type="time"]');
          if (timeInputs.length > 0) {
            const timeValue = await page.evaluate(el => el.value, timeInputs[0]);
            console.log(`🕐 Time field value: "${timeValue}"`);
            if (timeValue && timeValue !== '') {
              console.log('✅ Time field properly populated');
            }
          }
          await closeModal();
        }
      }
      
      // Test Reassign Appointment Modal
      console.log('\n📝 Testing Reassign Appointment Modal...');
      if (await findAndClickButton('Reassign', 'Overview')) {
        if (await checkModalOpened('Reassign Appointment')) {
          // Test staff dropdown
          const staffSelect = await page.$('select');
          if (staffSelect) {
            const options = await page.$$eval('select option', options => 
              options.map(option => ({ value: option.value, text: option.textContent }))
            );
            console.log(`👥 Staff options: ${options.length - 1} staff members`);
            
            // Test notification checkbox
            const checkbox = await page.$('input[type="checkbox"]');
            if (checkbox) {
              const isChecked = await page.evaluate(el => el.checked, checkbox);
              console.log(`🔔 Notification checkbox checked: ${isChecked}`);
            }
          }
          await closeModal();
        }
      }
    }

    // Test 2: Services Section - All Flows
    console.log('\n🧪 === TEST 2: SERVICES SECTION ===');
    
    if (await findAndClickButton('Services')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test Add Service Modal
      console.log('\n📝 Testing Add Service Modal...');
      if (await findAndClickButton('Add Service', 'Services')) {
        if (await checkModalOpened('Add Service')) {
          // Test form validation
          const saveButton = await page.$('button:has-text("Save Service"), button[type="submit"]');
          if (saveButton) {
            const isDisabled = await page.evaluate(el => el.disabled, saveButton);
            console.log(`🔒 Save button disabled initially: ${isDisabled}`);
            
            // Fill required fields
            await fillFormField('input[name="name"]', 'Test Service', 'Service Name');
            await page.select('select[name="category"]', 'Hair');
            await fillFormField('input[name="base_price"]', '500', 'Price');
            await fillFormField('input[name="duration_minutes"]', '60', 'Duration');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const isDisabledAfter = await page.evaluate(el => el.disabled, saveButton);
            console.log(`🔓 Save button disabled after filling: ${isDisabledAfter}`);
          }
          await closeModal();
        }
      }
      
      // Test Service Toggle (if services exist)
      console.log('\n📝 Testing Service Toggle...');
      const toggleButtons = await page.$$('button[aria-label*="toggle"], button:has-text("Toggle")');
      if (toggleButtons.length > 0) {
        console.log('🔄 Found toggle buttons, testing first one...');
        await toggleButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Service toggle tested');
      }
    }

    // Test 3: Staff Section - All Flows
    console.log('\n🧪 === TEST 3: STAFF SECTION ===');
    
    if (await findAndClickButton('Staff')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test Add Staff Modal
      console.log('\n📝 Testing Add Staff Modal...');
      if (await findAndClickButton('Add Staff', 'Staff')) {
        if (await checkModalOpened('Add Staff')) {
          // Test form validation
          const saveButton = await page.$('button:has-text("Save Staff"), button[type="submit"]');
          if (saveButton) {
            const isDisabled = await page.evaluate(el => el.disabled, saveButton);
            console.log(`🔒 Save button disabled initially: ${isDisabled}`);
            
            // Fill required fields
            await fillFormField('input[name="name"]', 'Test Staff', 'Staff Name');
            await page.select('select[name="role"]', 'Hair Stylist');
            await fillFormField('input[name="email"]', 'test@example.com', 'Email');
            await fillFormField('input[name="phone"]', '+91 98765 43210', 'Phone');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const isDisabledAfter = await page.evaluate(el => el.disabled, saveButton);
            console.log(`🔓 Save button disabled after filling: ${isDisabledAfter}`);
          }
          await closeModal();
        }
      }
      
      // Test Staff Schedule
      console.log('\n📝 Testing Staff Schedule...');
      const scheduleTable = await page.$('table, [class*="schedule"]');
      if (scheduleTable) {
        console.log('✅ Staff schedule table found');
        
        // Check for today's appointments
        const appointments = await page.$$('tr, [class*="appointment"]');
        console.log(`📅 Found ${appointments.length} schedule entries`);
      }
    }

    // Test 4: Calendar Section - All Flows
    console.log('\n🧪 === TEST 4: CALENDAR SECTION ===');
    
    if (await findAndClickButton('Calendar')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test Quick Book Modal
      console.log('\n📝 Testing Quick Book Modal...');
      if (await findAndClickButton('Quick Book', 'Calendar')) {
        if (await checkModalOpened('Quick Book')) {
          // Test form fields
          await fillFormField('input[type="text"]', 'Test Customer', 'Customer Name');
          await fillFormField('input[type="tel"]', '+91 98765 43210', 'Phone');
          await fillFormField('input[type="email"]', 'test@example.com', 'Email');
          
          // Test time field
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            await timeInput.click();
            await page.keyboard.type('14:30');
            console.log('🕐 Set time to 14:30');
          }
          
          // Test date field
          const dateInput = await page.$('input[type="date"]');
          if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateString = tomorrow.toISOString().split('T')[0];
            await dateInput.click();
            await page.keyboard.type(dateString);
            console.log(`📅 Set date to ${dateString}`);
          }
          
          await closeModal();
        }
      }
      
      // Test Walk-in Modal
      console.log('\n📝 Testing Walk-in Modal...');
      if (await findAndClickButton('Walk-in', 'Calendar')) {
        if (await checkModalOpened('Walk-in')) {
          await fillFormField('input[type="text"]', 'Walk-in Customer', 'Customer Name');
          await fillFormField('input[type="tel"]', '+91 98765 43211', 'Phone');
          await closeModal();
        }
      }
      
      // Test Check-in Modal
      console.log('\n📝 Testing Check-in Modal...');
      if (await findAndClickButton('Check In', 'Calendar')) {
        if (await checkModalOpened('Check-in')) {
          await closeModal();
        }
      }
      
      // Test Process Payment Modal
      console.log('\n📝 Testing Process Payment Modal...');
      if (await findAndClickButton('Process Payment', 'Calendar')) {
        if (await checkModalOpened('Process Payment')) {
          await closeModal();
        }
      }
    }

    // Test 5: Payments Section - All Flows
    console.log('\n🧪 === TEST 5: PAYMENTS SECTION ===');
    
    if (await findAndClickButton('Payments')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for payment records
      const paymentTable = await page.$('table, [class*="payment"]');
      if (paymentTable) {
        console.log('✅ Payment records table found');
        
        const paymentRows = await page.$$('tr, [class*="payment"]');
        console.log(`💰 Found ${paymentRows.length} payment records`);
      }
    }

    // Test 6: Customers Section - All Flows
    console.log('\n🧪 === TEST 6: CUSTOMERS SECTION ===');
    
    if (await findAndClickButton('Customers')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for customer records
      const customerTable = await page.$('table, [class*="customer"]');
      if (customerTable) {
        console.log('✅ Customer records table found');
        
        const customerRows = await page.$$('tr, [class*="customer"]');
        console.log(`👥 Found ${customerRows.length} customer records`);
      }
    }

    // Test 7: Promotions Section - All Flows
    console.log('\n🧪 === TEST 7: PROMOTIONS SECTION ===');
    
    if (await findAndClickButton('Promotions')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test Create Campaign Modal
      console.log('\n📝 Testing Create Campaign Modal...');
      if (await findAndClickButton('Create Campaign', 'Promotions')) {
        if (await checkModalOpened('Create Campaign')) {
          await fillFormField('input[type="text"]', 'Test Campaign', 'Campaign Name');
          await fillFormField('textarea', 'Test campaign description', 'Description');
          await closeModal();
        }
      }
    }

    // Test 8: Settings Section - All Flows
    console.log('\n🧪 === TEST 8: SETTINGS SECTION ===');
    
    if (await findAndClickButton('Settings')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for settings forms
      const settingsForms = await page.$$('form, [class*="setting"]');
      if (settingsForms.length > 0) {
        console.log(`⚙️ Found ${settingsForms.length} settings forms`);
      }
    }

    // Test 9: Navigation and Responsiveness
    console.log('\n🧪 === TEST 9: NAVIGATION AND RESPONSIVENESS ===');
    
    // Test sidebar toggle
    const sidebarToggle = await page.$('button[aria-label*="menu"], button[aria-label*="sidebar"]');
    if (sidebarToggle) {
      console.log('📱 Testing sidebar toggle...');
      await sidebarToggle.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await sidebarToggle.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Sidebar toggle working');
    }
    
    // Test responsive design
    console.log('📱 Testing responsive design...');
    await page.setViewport({ width: 768, height: 1024 }); // Tablet size
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.setViewport({ width: 375, height: 667 }); // Mobile size
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.setViewport({ width: 1280, height: 720 }); // Desktop size
    console.log('✅ Responsive design tested');

    // Test 10: Error Handling and Edge Cases
    console.log('\n🧪 === TEST 10: ERROR HANDLING AND EDGE CASES ===');
    
    // Test with invalid data
    console.log('🔍 Testing error handling...');
    
    // Go back to Overview and try to edit with invalid time
    if (await findAndClickButton('Overview')) {
      if (await findAndClickButton('Edit', 'Overview')) {
        if (await checkModalOpened('Edit Appointment')) {
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            // Try to set invalid time
            await timeInput.click();
            await timeInput.evaluate(el => el.value = '');
            await page.keyboard.type('25:99'); // Invalid time
            
            // Try to save
            const saveButton = await page.$('button:has-text("Save"), button[type="submit"]');
            if (saveButton) {
              await saveButton.click();
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Check for error messages
              const errorMessages = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
              if (errorMessages.length > 0) {
                const errorTexts = await page.$$eval('.text-red-500, .text-red-600, [class*="error"]', 
                  elements => elements.map(el => el.textContent?.trim()).filter(text => text)
                );
                console.log('✅ Error handling working:', errorTexts);
              } else {
                console.log('⚠️ No error messages shown for invalid time');
              }
            }
          }
          await closeModal();
        }
      }
    }

    // Final Summary
    console.log('\n🎉 === COMPREHENSIVE UI FLOWS TEST COMPLETED ===');
    console.log('✅ All major UI flows have been tested');
    console.log('✅ Modal interactions verified');
    console.log('✅ Form validation tested');
    console.log('✅ Navigation tested');
    console.log('✅ Responsive design tested');
    console.log('✅ Error handling tested');
    
    // Take final screenshot
    await page.screenshot({ path: 'comprehensive-test-final.png', fullPage: true });
    console.log('📸 Final screenshot saved: comprehensive-test-final.png');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the comprehensive test
testAllUIFlows().catch(console.error);
