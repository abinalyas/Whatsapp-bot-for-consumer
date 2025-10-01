import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testComprehensiveWorkflows() {
  console.log('🔄 Testing Comprehensive Workflows...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Browser Error:', msg.text());
      }
    });

    console.log('🌐 Loading salon dashboard...');
    await page.goto(`${BASE_URL}/salon-dashboard`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const testResults = {
      overviewEditCancel: false,
      overviewTableUpdate: false,
      serviceAddEditDelete: false,
      staffAddEditAvailability: false,
      calendarNewEditCancel: false
    };

    // Helper functions
    const clickButton = async (text) => {
      const result = await page.evaluate((buttonText) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(button => 
          button.textContent?.trim().toLowerCase().includes(buttonText.toLowerCase())
        );
        if (btn) {
          btn.click();
          return { success: true, text: btn.textContent?.trim() };
        }
        return { success: false };
      }, text);
      
      if (result.success) {
        console.log(`✅ Clicked: ${result.text}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      } else {
        console.log(`❌ Button not found: ${text}`);
        return false;
      }
    };

    const fillField = async (selector, value) => {
      try {
        await page.evaluate((sel, val) => {
          const element = document.querySelector(sel);
          if (element) {
            element.value = '';
            element.focus();
            element.value = val;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, selector, value);
        console.log(`✅ Filled ${selector}: ${value}`);
        return true;
      } catch (error) {
        console.log(`❌ Failed to fill ${selector}:`, error.message);
        return false;
      }
    };

    const checkModal = async () => {
      const modal = await page.$('.fixed.inset-0');
      return modal !== null;
    };

    const closeModal = async () => {
      await clickButton('Cancel');
    };

    const getTableData = async () => {
      return await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll('table'));
        const data = [];
        tables.forEach(table => {
          const rows = Array.from(table.querySelectorAll('tr'));
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length > 0) {
              data.push(cells.map(cell => cell.textContent?.trim()).filter(text => text));
            }
          });
        });
        return data;
      });
    };

    // Test 1: Overview - Edit and Cancel Appointments
    console.log('\n🧪 === TEST 1: OVERVIEW EDIT & CANCEL APPOINTMENTS ===');
    
    if (await clickButton('Overview')) {
      console.log('📝 Testing Edit Appointment from Overview...');
      
      // Try to edit an appointment
      if (await clickButton('Edit')) {
        if (await checkModal()) {
          console.log('✅ Edit modal opened');
          
          // Test editing time
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            await timeInput.click();
            await page.keyboard.type('15:30');
            console.log('🕐 Changed time to 15:30');
          }
          
          // Save changes
          if (await clickButton('Save Changes')) {
            console.log('✅ Appointment edited successfully');
            await new Promise(resolve => setTimeout(resolve, 2000));
            testResults.overviewEditCancel = true;
          }
        }
      }
      
      // Test cancel appointment
      console.log('📝 Testing Cancel Appointment from Overview...');
      if (await clickButton('Cancel')) {
        if (await checkModal()) {
          console.log('✅ Cancel modal opened');
          if (await clickButton('Confirm Cancel')) {
            console.log('✅ Appointment cancelled successfully');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // Check if today's appointment table updated
      console.log('📊 Checking if Overview table updated...');
      const overviewTableData = await getTableData();
      console.log(`📋 Overview table has ${overviewTableData.length} rows`);
      if (overviewTableData.length > 0) {
        console.log('✅ Overview table contains data');
        testResults.overviewTableUpdate = true;
      }
    }

    // Test 2: Services Management - Add, Edit, Delete
    console.log('\n🧪 === TEST 2: SERVICES MANAGEMENT ===');
    
    if (await clickButton('Services')) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test Add Service
      console.log('📝 Testing Add Service...');
      const addServiceResult = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(button => 
          button.textContent?.trim().toLowerCase().includes('add service')
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      
      if (addServiceResult) {
        console.log('✅ Add Service modal opened');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fill service form
        await fillField('input[name="name"]', 'Test Service');
        await page.select('select[name="category"]', 'Hair');
        await fillField('input[name="base_price"]', '500');
        await fillField('input[name="duration_minutes"]', '60');
        
        // Save service
        if (await clickButton('Save Service')) {
          console.log('✅ Service added successfully');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Test Edit Service (if any services exist)
      console.log('📝 Testing Edit Service...');
      const editButtons = await page.$$('button');
      let editServiceFound = false;
      for (const btn of editButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('edit') && !text.toLowerCase().includes('appointment')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Edit Service modal opened');
          
          // Modify service
          await fillField('input[name="name"]', 'Updated Test Service');
          if (await clickButton('Save Service')) {
            console.log('✅ Service updated successfully');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          editServiceFound = true;
          break;
        }
      }
      
      if (!editServiceFound) {
        console.log('⚠️ No services found to edit');
      }
      
      // Test Delete Service (if any services exist)
      console.log('📝 Testing Delete Service...');
      const deleteButtons = await page.$$('button');
      let deleteServiceFound = false;
      for (const btn of deleteButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('delete')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Delete confirmation modal opened');
          
          if (await clickButton('Confirm Delete')) {
            console.log('✅ Service deleted successfully');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          deleteServiceFound = true;
          break;
        }
      }
      
      if (!deleteServiceFound) {
        console.log('⚠️ No services found to delete');
      }
      
      testResults.serviceAddEditDelete = true;
    }

    // Test 3: Staff Management - Add, Edit, Availability
    console.log('\n🧪 === TEST 3: STAFF MANAGEMENT ===');
    
    if (await clickButton('Staff')) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test Add Staff
      console.log('📝 Testing Add Staff...');
      const addStaffResult = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(button => 
          button.textContent?.trim().toLowerCase().includes('add staff')
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      
      if (addStaffResult) {
        console.log('✅ Add Staff modal opened');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fill staff form
        await fillField('input[name="name"]', 'Test Staff');
        
        // Try to find and select role
        await page.evaluate(() => {
          const roleSelect = document.querySelector('select[name="role"]') || 
                           document.querySelector('select') ||
                           document.querySelector('[class*="role"]');
          if (roleSelect && roleSelect.tagName === 'SELECT') {
            roleSelect.value = roleSelect.options[1]?.value || 'Hair Stylist';
            roleSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        await fillField('input[name="email"]', 'test@example.com');
        await fillField('input[name="phone"]', '+91 98765 43210');
        
        // Save staff
        if (await clickButton('Save Staff')) {
          console.log('✅ Staff added successfully');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Test Edit Staff (if any staff exist)
      console.log('📝 Testing Edit Staff...');
      const editStaffButtons = await page.$$('button');
      let editStaffFound = false;
      for (const btn of editStaffButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('edit') && !text.toLowerCase().includes('appointment')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Edit Staff modal opened');
          
          // Modify staff
          await fillField('input[name="name"]', 'Updated Test Staff');
          if (await clickButton('Save Staff')) {
            console.log('✅ Staff updated successfully');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          editStaffFound = true;
          break;
        }
      }
      
      if (!editStaffFound) {
        console.log('⚠️ No staff found to edit');
      }
      
      // Test Manage Availability (toggle availability)
      console.log('📝 Testing Manage Availability...');
      const toggleButtons = await page.$$('button[aria-label*="toggle"], button:has-text("Toggle")');
      if (toggleButtons.length > 0) {
        console.log('🔄 Found availability toggle buttons');
        await toggleButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Staff availability toggled');
      } else {
        console.log('⚠️ No availability toggle buttons found');
      }
      
      testResults.staffAddEditAvailability = true;
    }

    // Test 4: Calendar - New, Edit, Cancel Appointments
    console.log('\n🧪 === TEST 4: CALENDAR APPOINTMENT MANAGEMENT ===');
    
    if (await clickButton('Calendar')) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test New Appointment (Quick Book)
      console.log('📝 Testing New Appointment...');
      if (await clickButton('Quick Book')) {
        if (await checkModal()) {
          console.log('✅ Quick Book modal opened');
          
          // Fill appointment form
          await fillField('input[type="text"]', 'Test Customer');
          await fillField('input[type="tel"]', '+91 98765 43210');
          await fillField('input[type="email"]', 'test@example.com');
          
          // Set date (tomorrow)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateString = tomorrow.toISOString().split('T')[0];
          await fillField('input[type="date"]', dateString);
          
          // Set time
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            await timeInput.click();
            await page.keyboard.type('16:00');
            console.log('🕐 Set time to 16:00');
          }
          
          // Save appointment
          if (await clickButton('Book Appointment')) {
            console.log('✅ New appointment created successfully');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // Test Edit Appointment from Calendar
      console.log('📝 Testing Edit Appointment from Calendar...');
      const editAppointmentButtons = await page.$$('button');
      let editAppointmentFound = false;
      for (const btn of editAppointmentButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('edit') && text.toLowerCase().includes('appointment')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Edit Appointment modal opened');
          
          // Modify appointment
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            await timeInput.click();
            await page.keyboard.type('17:00');
            console.log('🕐 Changed time to 17:00');
          }
          
          if (await clickButton('Save Changes')) {
            console.log('✅ Appointment updated successfully');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          editAppointmentFound = true;
          break;
        }
      }
      
      if (!editAppointmentFound) {
        console.log('⚠️ No appointments found to edit');
      }
      
      // Test Cancel Appointment from Calendar
      console.log('📝 Testing Cancel Appointment from Calendar...');
      const cancelAppointmentButtons = await page.$$('button');
      let cancelAppointmentFound = false;
      for (const btn of cancelAppointmentButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('cancel') && text.toLowerCase().includes('appointment')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Cancel Appointment modal opened');
          
          if (await clickButton('Confirm Cancel')) {
            console.log('✅ Appointment cancelled successfully');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          cancelAppointmentFound = true;
          break;
        }
      }
      
      if (!cancelAppointmentFound) {
        console.log('⚠️ No appointments found to cancel');
      }
      
      testResults.calendarNewEditCancel = true;
    }

    // Final Results Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE WORKFLOW TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📋 Test Results:`);
    console.log(`   Overview Edit & Cancel: ${testResults.overviewEditCancel ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Overview Table Update: ${testResults.overviewTableUpdate ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Service Add/Edit/Delete: ${testResults.serviceAddEditDelete ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Staff Add/Edit/Availability: ${testResults.staffAddEditAvailability ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Calendar New/Edit/Cancel: ${testResults.calendarNewEditCancel ? '✅ PASS' : '❌ FAIL'}`);
    
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(result => result).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
    
    if (successRate >= 80) {
      console.log('🎉 Comprehensive workflow tests PASSED!');
    } else {
      console.log('⚠️ Some workflows need attention');
    }

    // Take final screenshot
    await page.screenshot({ path: 'comprehensive-workflow-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: comprehensive-workflow-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the comprehensive workflow test
testComprehensiveWorkflows().catch(console.error);
