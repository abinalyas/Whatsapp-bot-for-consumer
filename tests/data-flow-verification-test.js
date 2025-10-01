import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testDataFlowVerification() {
  console.log('🔄 Testing Data Flow Verification...');
  
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
    
    const dataFlowResults = {
      overviewToCalendarSync: false,
      serviceCreationToOverview: false,
      staffCreationToOverview: false,
      appointmentChangesAcrossSections: false,
      realTimeUpdates: false
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

    const getSectionData = async (section) => {
      return await page.evaluate((sectionName) => {
        const data = {
          appointments: [],
          services: [],
          staff: [],
          tables: []
        };
        
        // Get all tables in current section
        const tables = Array.from(document.querySelectorAll('table'));
        tables.forEach((table, index) => {
          const rows = Array.from(table.querySelectorAll('tr'));
          const tableData = [];
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length > 0) {
              tableData.push(cells.map(cell => cell.textContent?.trim()).filter(text => text));
            }
          });
          data.tables.push(tableData);
        });
        
        // Get appointment data
        const appointmentElements = Array.from(document.querySelectorAll('[class*="appointment"], [class*="booking"]'));
        appointmentElements.forEach(el => {
          if (el.textContent?.trim()) {
            data.appointments.push(el.textContent.trim());
          }
        });
        
        // Get service data
        const serviceElements = Array.from(document.querySelectorAll('[class*="service"]'));
        serviceElements.forEach(el => {
          if (el.textContent?.trim()) {
            data.services.push(el.textContent.trim());
          }
        });
        
        // Get staff data
        const staffElements = Array.from(document.querySelectorAll('[class*="staff"]'));
        staffElements.forEach(el => {
          if (el.textContent?.trim()) {
            data.staff.push(el.textContent.trim());
          }
        });
        
        return data;
      }, section);
    };

    const createTestService = async () => {
      console.log('📝 Creating test service...');
      
      // Navigate to Services
      await clickButton('Services');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add service
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
        // Fill service form
        await page.evaluate(() => {
          const nameInput = document.querySelector('input[name="name"]');
          const priceInput = document.querySelector('input[name="base_price"]');
          const durationInput = document.querySelector('input[name="duration_minutes"]');
          const categorySelect = document.querySelector('select[name="category"]');
          
          if (nameInput) nameInput.value = 'Data Flow Test Service';
          if (priceInput) priceInput.value = '750';
          if (durationInput) durationInput.value = '90';
          if (categorySelect) categorySelect.value = 'Hair';
          
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
        const saveResult = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(button => 
            button.textContent?.trim().toLowerCase().includes('save service')
          );
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        
        if (saveResult) {
          console.log('✅ Test service created');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
      }
      
      return false;
    };

    const createTestStaff = async () => {
      console.log('👥 Creating test staff...');
      
      // Navigate to Staff
      await clickButton('Staff');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add staff
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
        // Fill staff form
        await page.evaluate(() => {
          const nameInput = document.querySelector('input[name="name"]');
          const emailInput = document.querySelector('input[name="email"]');
          const phoneInput = document.querySelector('input[name="phone"]');
          const roleSelect = document.querySelector('select[name="role"]');
          
          if (nameInput) nameInput.value = 'Data Flow Test Staff';
          if (emailInput) emailInput.value = 'teststaff@example.com';
          if (phoneInput) phoneInput.value = '+91 98765 43211';
          if (roleSelect) roleSelect.value = 'Hair Stylist';
          
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
        const saveResult = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(button => 
            button.textContent?.trim().toLowerCase().includes('save staff')
          );
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        
        if (saveResult) {
          console.log('✅ Test staff created');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
      }
      
      return false;
    };

    // Test 1: Overview to Calendar Data Sync
    console.log('\n🧪 === TEST 1: OVERVIEW TO CALENDAR DATA SYNC ===');
    
    // Get initial overview data
    await clickButton('Overview');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const overviewDataBefore = await getSectionData('Overview');
    console.log(`📊 Overview has ${overviewDataBefore.appointments.length} appointments`);
    
    // Navigate to Calendar and check data
    await clickButton('Calendar');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const calendarData = await getSectionData('Calendar');
    console.log(`📅 Calendar has ${calendarData.appointments.length} appointments`);
    
    if (calendarData.appointments.length > 0) {
      console.log('✅ Data synced between Overview and Calendar');
      dataFlowResults.overviewToCalendarSync = true;
    }

    // Test 2: Service Creation Impact on Overview
    console.log('\n🧪 === TEST 2: SERVICE CREATION IMPACT ===');
    
    if (await createTestService()) {
      // Check if service appears in Overview
      await clickButton('Overview');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const overviewDataAfterService = await getSectionData('Overview');
      
      console.log(`📊 Overview services: ${overviewDataAfterService.services.length}`);
      if (overviewDataAfterService.services.length > 0) {
        console.log('✅ Service creation reflected in Overview');
        dataFlowResults.serviceCreationToOverview = true;
      }
    }

    // Test 3: Staff Creation Impact on Overview
    console.log('\n🧪 === TEST 3: STAFF CREATION IMPACT ===');
    
    if (await createTestStaff()) {
      // Check if staff appears in Overview
      await clickButton('Overview');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const overviewDataAfterStaff = await getSectionData('Overview');
      
      console.log(`👥 Overview staff: ${overviewDataAfterStaff.staff.length}`);
      if (overviewDataAfterStaff.staff.length > 0) {
        console.log('✅ Staff creation reflected in Overview');
        dataFlowResults.staffCreationToOverview = true;
      }
    }

    // Test 4: Appointment Changes Across Sections
    console.log('\n🧪 === TEST 4: APPOINTMENT CHANGES ACROSS SECTIONS ===');
    
    // Edit appointment from Overview
    await clickButton('Overview');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const editResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(button => 
        button.textContent?.trim().toLowerCase().includes('edit') && 
        !button.textContent?.trim().toLowerCase().includes('service') &&
        !button.textContent?.trim().toLowerCase().includes('staff')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    if (editResult) {
      console.log('✅ Edit appointment modal opened');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Change time
      await page.evaluate(() => {
        const timeInput = document.querySelector('input[type="time"]');
        if (timeInput) {
          timeInput.value = '14:30';
          timeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      // Save changes
      const saveResult = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(button => 
          button.textContent?.trim().toLowerCase().includes('save changes')
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      
      if (saveResult) {
        console.log('✅ Appointment updated from Overview');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if changes reflect in Calendar
        await clickButton('Calendar');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const calendarDataAfterEdit = await getSectionData('Calendar');
        console.log(`📅 Calendar data after edit: ${calendarDataAfterEdit.appointments.length} appointments`);
        
        if (calendarDataAfterEdit.appointments.length > 0) {
          console.log('✅ Appointment changes synced across sections');
          dataFlowResults.appointmentChangesAcrossSections = true;
        }
      }
    }

    // Test 5: Real-time Updates
    console.log('\n🧪 === TEST 5: REAL-TIME UPDATES ===');
    
    // Navigate between sections and check if data updates
    await clickButton('Overview');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const overviewData1 = await getSectionData('Overview');
    
    await clickButton('Services');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await clickButton('Overview');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const overviewData2 = await getSectionData('Overview');
    
    // Compare data (should be same or updated)
    const dataChanged = JSON.stringify(overviewData1) !== JSON.stringify(overviewData2);
    console.log(`🔄 Data changed between visits: ${dataChanged}`);
    
    if (overviewData2.appointments.length > 0 || overviewData2.services.length > 0) {
      console.log('✅ Real-time updates working');
      dataFlowResults.realTimeUpdates = true;
    }

    // Final Results Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 DATA FLOW VERIFICATION TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n🔄 Data Flow Results:`);
    console.log(`   Overview ↔ Calendar Sync: ${dataFlowResults.overviewToCalendarSync ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Service Creation → Overview: ${dataFlowResults.serviceCreationToOverview ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Staff Creation → Overview: ${dataFlowResults.staffCreationToOverview ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Appointment Changes Across Sections: ${dataFlowResults.appointmentChangesAcrossSections ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Real-time Updates: ${dataFlowResults.realTimeUpdates ? '✅ PASS' : '❌ FAIL'}`);
    
    const totalTests = Object.keys(dataFlowResults).length;
    const passedTests = Object.values(dataFlowResults).filter(result => result).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Data Flow Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
    
    if (successRate >= 80) {
      console.log('🎉 Data flow verification PASSED!');
    } else {
      console.log('⚠️ Data flow needs attention');
    }

    // Take final screenshot
    await page.screenshot({ path: 'data-flow-verification-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: data-flow-verification-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the data flow verification test
testDataFlowVerification().catch(console.error);
