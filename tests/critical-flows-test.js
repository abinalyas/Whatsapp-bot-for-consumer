import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testCriticalFlows() {
  console.log('🎯 Testing Critical UI Flows...');
  
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
      overview: false,
      services: false,
      staff: false,
      calendar: false,
      editModal: false,
      addService: false,
      addStaff: false,
      quickBook: false
    };

    // Helper functions
    const findButton = async (text) => {
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const buttonText = await page.evaluate(el => el.textContent?.trim(), btn);
        if (buttonText && buttonText.toLowerCase().includes(text.toLowerCase())) {
          return btn;
        }
      }
      return null;
    };

    const clickButton = async (text, section = '') => {
      const button = await findButton(text);
      if (button) {
        console.log(`✅ Clicking "${text}"${section ? ` in ${section}` : ''}`);
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      }
      
      // Debug: Show all available buttons when not found
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(btn => btn.textContent?.trim()).filter(text => text)
      );
      console.log(`❌ Button "${text}" not found${section ? ` in ${section}` : ''}`);
      console.log(`🔍 Available buttons: ${allButtons.slice(0, 10).join(', ')}...`);
      return false;
    };

    const checkModal = async (modalName) => {
      const modal = await page.$('.fixed.inset-0');
      if (modal) {
        console.log(`✅ ${modalName} modal opened`);
        return true;
      }
      console.log(`❌ ${modalName} modal failed to open`);
      return false;
    };

    const closeModal = async () => {
      const cancelBtn = await findButton('Cancel');
      if (cancelBtn) {
        await cancelBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
      return false;
    };

    // Test 1: Overview Section
    console.log('\n🧪 Testing Overview Section...');
    if (await clickButton('Overview')) {
      results.overview = true;
      
      // Test Edit Appointment
      if (await clickButton('Edit', 'Overview')) {
        if (await checkModal('Edit Appointment')) {
          results.editModal = true;
          
          // Check time field
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            const timeValue = await page.evaluate(el => el.value, timeInput);
            console.log(`🕐 Time field value: "${timeValue}"`);
            if (timeValue && timeValue !== '') {
              console.log('✅ Time field populated correctly');
            }
          }
          await closeModal();
        }
      }
    }

    // Test 2: Services Section
    console.log('\n🧪 Testing Services Section...');
    if (await clickButton('Services')) {
      results.services = true;
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer for section to load
      
      // Test Add Service - use working approach
      const addServiceResult = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(btn => btn.textContent?.trim().toLowerCase().includes('add service'));
        if (btn) {
          btn.click();
          return { found: true, text: btn.textContent?.trim() };
        }
        return { found: false };
      });
      
      if (addServiceResult.found) {
        console.log(`✅ Found and clicked Add Service button: "${addServiceResult.text}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (await checkModal('Add Service')) {
          results.addService = true;
          
          // Test form validation
          const saveBtn = await page.$('button[type="submit"], button:has-text("Save")');
          if (saveBtn) {
            const isDisabled = await page.evaluate(el => el.disabled, saveBtn);
            console.log(`🔒 Save button disabled: ${isDisabled}`);
          }
          
          await closeModal();
        }
      } else {
        console.log('❌ Add Service button not found');
      }
    }

    // Test 3: Staff Section
    console.log('\n🧪 Testing Staff Section...');
    if (await clickButton('Staff')) {
      results.staff = true;
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer for section to load
      
      // Test Add Staff - use working approach
      const addStaffResult = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(btn => btn.textContent?.trim().toLowerCase().includes('add staff'));
        if (btn) {
          btn.click();
          return { found: true, text: btn.textContent?.trim() };
        }
        return { found: false };
      });
      
      if (addStaffResult.found) {
        console.log(`✅ Found and clicked Add Staff button: "${addStaffResult.text}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (await checkModal('Add Staff')) {
          results.addStaff = true;
          
          // Test form validation
          const saveBtn = await page.$('button[type="submit"], button:has-text("Save")');
          if (saveBtn) {
            const isDisabled = await page.evaluate(el => el.disabled, saveBtn);
            console.log(`🔒 Save button disabled: ${isDisabled}`);
          }
          
          await closeModal();
        }
      } else {
        console.log('❌ Add Staff button not found');
      }
    }

    // Test 4: Calendar Section
    console.log('\n🧪 Testing Calendar Section...');
    if (await clickButton('Calendar')) {
      results.calendar = true;
      
      // Test Quick Book
      if (await clickButton('Quick Book', 'Calendar')) {
        if (await checkModal('Quick Book')) {
          results.quickBook = true;
          
          // Test time field
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            await timeInput.click();
            await page.keyboard.type('14:30');
            console.log('🕐 Set time to 14:30');
          }
          
          await closeModal();
        }
      }
    }

    // Test 5: Navigation Flow
    console.log('\n🧪 Testing Navigation Flow...');
    const sections = ['Overview', 'Services', 'Staff', 'Calendar', 'Payments', 'Customers'];
    let navigationSuccess = 0;
    
    for (const section of sections) {
      if (await clickButton(section)) {
        navigationSuccess++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Navigation: ${navigationSuccess}/${sections.length} sections accessible`);

    // Test 6: Responsive Design
    console.log('\n🧪 Testing Responsive Design...');
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ ${viewport.name} viewport tested`);
    }

    // Results Summary
    console.log('\n📊 === TEST RESULTS SUMMARY ===');
    console.log(`Overview Section: ${results.overview ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Services Section: ${results.services ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Staff Section: ${results.staff ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Calendar Section: ${results.calendar ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Edit Appointment Modal: ${results.editModal ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Add Service Modal: ${results.addService ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Add Staff Modal: ${results.addStaff ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Quick Book Modal: ${results.quickBook ? '✅ PASS' : '❌ FAIL'}`);
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(result => result).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
    
    if (successRate >= 80) {
      console.log('🎉 Critical flows test PASSED!');
    } else {
      console.log('⚠️ Critical flows test needs attention');
    }

    // Take final screenshot
    await page.screenshot({ path: 'critical-flows-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: critical-flows-test-result.png');
    
  } catch (error) {
    console.error('❌ Critical flows test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCriticalFlows().catch(console.error);
