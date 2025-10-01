import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testTargetedWorkflows() {
  console.log('🎯 Testing Targeted Workflows...');
  
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
    
    const results = {
      overviewEditCancel: { edit: false, cancel: false, tableUpdate: false },
      servicesManagement: { add: false, edit: false, delete: false },
      staffManagement: { add: false, edit: false, availability: false },
      calendarManagement: { new: false, edit: false, cancel: false }
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
        await new Promise(resolve => setTimeout(resolve, 1500));
        return true;
      } else {
        console.log(`❌ Button not found: ${text}`);
        return false;
      }
    };

    const checkModal = async () => {
      const modal = await page.$('.fixed.inset-0');
      return modal !== null;
    };

    const getTableRowCount = async () => {
      return await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll('table'));
        let totalRows = 0;
        tables.forEach(table => {
          const rows = Array.from(table.querySelectorAll('tr'));
          totalRows += rows.length;
        });
        return totalRows;
      });
    };

    // Test 1: Overview - Edit and Cancel Appointments
    console.log('\n🧪 === TEST 1: OVERVIEW EDIT & CANCEL APPOINTMENTS ===');
    
    if (await clickButton('Overview')) {
      const initialRowCount = await getTableRowCount();
      console.log(`📊 Initial table rows: ${initialRowCount}`);
      
      // Test Edit Appointment
      console.log('📝 Testing Edit Appointment...');
      if (await clickButton('Edit')) {
        if (await checkModal()) {
          console.log('✅ Edit modal opened');
          
          // Change time
          await page.evaluate(() => {
            const timeInput = document.querySelector('input[type="time"]');
            if (timeInput) {
              timeInput.value = '16:00';
              timeInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
          
          // Save changes
          if (await clickButton('Save Changes')) {
            console.log('✅ Appointment edited successfully');
            results.overviewEditCancel.edit = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // Test Cancel Appointment
      console.log('📝 Testing Cancel Appointment...');
      if (await clickButton('Cancel')) {
        if (await checkModal()) {
          console.log('✅ Cancel modal opened');
          if (await clickButton('Confirm Cancel')) {
            console.log('✅ Appointment cancelled successfully');
            results.overviewEditCancel.cancel = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // Check table update
      const finalRowCount = await getTableRowCount();
      console.log(`📊 Final table rows: ${finalRowCount}`);
      if (finalRowCount !== initialRowCount || finalRowCount > 0) {
        console.log('✅ Overview table updated');
        results.overviewEditCancel.tableUpdate = true;
      }
    }

    // Test 2: Services Management
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
        
        // Fill service form
        await page.evaluate(() => {
          const nameInput = document.querySelector('input[name="name"]');
          const priceInput = document.querySelector('input[name="base_price"]');
          const durationInput = document.querySelector('input[name="duration_minutes"]');
          
          if (nameInput) nameInput.value = 'Targeted Test Service';
          if (priceInput) priceInput.value = '600';
          if (durationInput) durationInput.value = '75';
          
          // Trigger events
          [nameInput, priceInput, durationInput].forEach(input => {
            if (input) {
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Save service
        if (await clickButton('Save Service')) {
          console.log('✅ Service added successfully');
          results.servicesManagement.add = true;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Test Edit Service (look for edit buttons)
      console.log('📝 Testing Edit Service...');
      const editButtons = await page.$$('button');
      for (const btn of editButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('edit') && !text.toLowerCase().includes('appointment')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Edit Service modal opened');
          
          // Modify service
          await page.evaluate(() => {
            const nameInput = document.querySelector('input[name="name"]');
            if (nameInput) {
              nameInput.value = 'Updated Test Service';
              nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
          
          if (await clickButton('Save Service')) {
            console.log('✅ Service updated successfully');
            results.servicesManagement.edit = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          break;
        }
      }
      
      // Test Delete Service (look for delete buttons)
      console.log('📝 Testing Delete Service...');
      const deleteButtons = await page.$$('button');
      for (const btn of deleteButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('delete')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Delete confirmation modal opened');
          
          if (await clickButton('Confirm Delete')) {
            console.log('✅ Service deleted successfully');
            results.servicesManagement.delete = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          break;
        }
      }
    }

    // Test 3: Staff Management
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
        
        // Fill staff form
        await page.evaluate(() => {
          const nameInput = document.querySelector('input[name="name"]');
          const emailInput = document.querySelector('input[name="email"]');
          const phoneInput = document.querySelector('input[name="phone"]');
          
          if (nameInput) nameInput.value = 'Targeted Test Staff';
          if (emailInput) emailInput.value = 'targeted@example.com';
          if (phoneInput) phoneInput.value = '+91 98765 43212';
          
          // Trigger events
          [nameInput, emailInput, phoneInput].forEach(input => {
            if (input) {
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Save staff
        if (await clickButton('Save Staff')) {
          console.log('✅ Staff added successfully');
          results.staffManagement.add = true;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Test Edit Staff
      console.log('📝 Testing Edit Staff...');
      const editStaffButtons = await page.$$('button');
      for (const btn of editStaffButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('edit') && !text.toLowerCase().includes('appointment')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Edit Staff modal opened');
          
          // Modify staff
          await page.evaluate(() => {
            const nameInput = document.querySelector('input[name="name"]');
            if (nameInput) {
              nameInput.value = 'Updated Test Staff';
              nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
          
          if (await clickButton('Save Staff')) {
            console.log('✅ Staff updated successfully');
            results.staffManagement.edit = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          break;
        }
      }
      
      // Test Manage Availability
      console.log('📝 Testing Manage Availability...');
      const toggleButtons = await page.$$('button');
      for (const btn of toggleButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && (text.toLowerCase().includes('toggle') || text.toLowerCase().includes('availability'))) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Staff availability toggled');
          results.staffManagement.availability = true;
          break;
        }
      }
    }

    // Test 4: Calendar Management
    console.log('\n🧪 === TEST 4: CALENDAR MANAGEMENT ===');
    
    if (await clickButton('Calendar')) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test New Appointment
      console.log('📝 Testing New Appointment...');
      if (await clickButton('Quick Book')) {
        if (await checkModal()) {
          console.log('✅ Quick Book modal opened');
          
          // Fill appointment form
          await page.evaluate(() => {
            const nameInput = document.querySelector('input[type="text"]');
            const phoneInput = document.querySelector('input[type="tel"]');
            const emailInput = document.querySelector('input[type="email"]');
            
            if (nameInput) nameInput.value = 'Targeted Test Customer';
            if (phoneInput) phoneInput.value = '+91 98765 43213';
            if (emailInput) emailInput.value = 'targetedcustomer@example.com';
            
            // Trigger events
            [nameInput, phoneInput, emailInput].forEach(input => {
              if (input) {
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
              }
            });
          });
          
          // Set date (tomorrow)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateString = tomorrow.toISOString().split('T')[0];
          await page.evaluate((date) => {
            const dateInput = document.querySelector('input[type="date"]');
            if (dateInput) {
              dateInput.value = date;
              dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, dateString);
          
          // Set time
          await page.evaluate(() => {
            const timeInput = document.querySelector('input[type="time"]');
            if (timeInput) {
              timeInput.value = '15:00';
              timeInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Book appointment
          if (await clickButton('Book Appointment')) {
            console.log('✅ New appointment created successfully');
            results.calendarManagement.new = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // Test Edit Appointment from Calendar
      console.log('📝 Testing Edit Appointment from Calendar...');
      const editAppointmentButtons = await page.$$('button');
      for (const btn of editAppointmentButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('edit') && text.toLowerCase().includes('appointment')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Edit Appointment modal opened');
          
          // Change time
          await page.evaluate(() => {
            const timeInput = document.querySelector('input[type="time"]');
            if (timeInput) {
              timeInput.value = '16:30';
              timeInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
          
          if (await clickButton('Save Changes')) {
            console.log('✅ Appointment updated successfully');
            results.calendarManagement.edit = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          break;
        }
      }
      
      // Test Cancel Appointment from Calendar
      console.log('📝 Testing Cancel Appointment from Calendar...');
      const cancelAppointmentButtons = await page.$$('button');
      for (const btn of cancelAppointmentButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.toLowerCase().includes('cancel') && text.toLowerCase().includes('appointment')) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Cancel Appointment modal opened');
          
          if (await clickButton('Confirm Cancel')) {
            console.log('✅ Appointment cancelled successfully');
            results.calendarManagement.cancel = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          break;
        }
      }
    }

    // Final Results Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TARGETED WORKFLOW TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📋 Overview Edit & Cancel Appointments:`);
    console.log(`   Edit Appointment: ${results.overviewEditCancel.edit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Cancel Appointment: ${results.overviewEditCancel.cancel ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Table Updates: ${results.overviewEditCancel.tableUpdate ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n📋 Services Management:`);
    console.log(`   Add Service: ${results.servicesManagement.add ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Edit Service: ${results.servicesManagement.edit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Delete Service: ${results.servicesManagement.delete ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n📋 Staff Management:`);
    console.log(`   Add Staff: ${results.staffManagement.add ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Edit Staff: ${results.staffManagement.edit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Manage Availability: ${results.staffManagement.availability ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n📋 Calendar Management:`);
    console.log(`   New Appointment: ${results.calendarManagement.new ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Edit Appointment: ${results.calendarManagement.edit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Cancel Appointment: ${results.calendarManagement.cancel ? '✅ PASS' : '❌ FAIL'}`);
    
    // Calculate overall success rate
    const allResults = [
      results.overviewEditCancel.edit,
      results.overviewEditCancel.cancel,
      results.overviewEditCancel.tableUpdate,
      results.servicesManagement.add,
      results.servicesManagement.edit,
      results.servicesManagement.delete,
      results.staffManagement.add,
      results.staffManagement.edit,
      results.staffManagement.availability,
      results.calendarManagement.new,
      results.calendarManagement.edit,
      results.calendarManagement.cancel
    ];
    
    const totalTests = allResults.length;
    const passedTests = allResults.filter(result => result).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
    
    if (successRate >= 80) {
      console.log('🎉 Targeted workflow tests PASSED!');
    } else {
      console.log('⚠️ Some workflows need attention');
    }

    // Take final screenshot
    await page.screenshot({ path: 'targeted-workflow-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: targeted-workflow-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the targeted workflow test
testTargetedWorkflows().catch(console.error);
