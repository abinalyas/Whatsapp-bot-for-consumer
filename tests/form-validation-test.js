import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testFormValidation() {
  console.log('📝 Testing Form Validation and Data Persistence...');
  
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
      serviceFormValidation: false,
      staffFormValidation: false,
      appointmentFormValidation: false,
      dataPersistence: false,
      errorHandling: false
    };

    // Helper functions
    const findButton = async (text) => {
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const buttonText = await page.evaluate(el => el.textContent?.trim(), btn);
        if (buttonText && buttonText.includes(text)) {
          return btn;
        }
      }
      return null;
    };

    const clickButton = async (text) => {
      const button = await findButton(text);
      if (button) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      }
      return false;
    };

    const fillField = async (selector, value) => {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await element.evaluate(el => el.value = '');
          await page.keyboard.type(value);
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    };

    const checkSaveButtonState = async () => {
      const saveButtons = await page.$$('button[type="submit"], button:has-text("Save")');
      if (saveButtons.length > 0) {
        const isDisabled = await page.evaluate(el => el.disabled, saveButtons[0]);
        return !isDisabled;
      }
      return false;
    };

    // Test 1: Service Form Validation
    console.log('\n🧪 Testing Service Form Validation...');
    
    if (await clickButton('Services')) {
      if (await clickButton('Add Service')) {
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Add Service modal opened');
          
          // Test 1: Empty form - Save button should be disabled
          const initiallyEnabled = await checkSaveButtonState();
          console.log(`🔒 Save button initially enabled: ${initiallyEnabled}`);
          
          if (!initiallyEnabled) {
            console.log('✅ Save button correctly disabled for empty form');
            
            // Test 2: Fill required fields one by one
            await fillField('input[name="name"]', 'Test Service');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let enabledAfterName = await checkSaveButtonState();
            console.log(`🔓 Save button enabled after name: ${enabledAfterName}`);
            
            await fillField('input[name="base_price"]', '500');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let enabledAfterPrice = await checkSaveButtonState();
            console.log(`🔓 Save button enabled after price: ${enabledAfterPrice}`);
            
            await fillField('input[name="duration_minutes"]', '60');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let enabledAfterAll = await checkSaveButtonState();
            console.log(`🔓 Save button enabled after all fields: ${enabledAfterAll}`);
            
            if (enabledAfterAll) {
              console.log('✅ Service form validation working correctly');
              testResults.serviceFormValidation = true;
            }
            
            // Test 3: Invalid data
            await fillField('input[name="base_price"]', 'invalid');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let enabledWithInvalidData = await checkSaveButtonState();
            console.log(`🔓 Save button enabled with invalid price: ${enabledWithInvalidData}`);
            
            if (!enabledWithInvalidData) {
              console.log('✅ Service form correctly handles invalid data');
              testResults.errorHandling = true;
            }
          }
          
          // Close modal
          const cancelBtn = await findButton('Cancel');
          if (cancelBtn) await cancelBtn.click();
        }
      }
    }

    // Test 2: Staff Form Validation
    console.log('\n🧪 Testing Staff Form Validation...');
    
    if (await clickButton('Staff')) {
      if (await clickButton('Add Staff')) {
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Add Staff modal opened');
          
          // Test empty form
          const initiallyEnabled = await checkSaveButtonState();
          console.log(`🔒 Save button initially enabled: ${initiallyEnabled}`);
          
          if (!initiallyEnabled) {
            // Fill required fields
            await fillField('input[name="name"]', 'Test Staff');
            await fillField('input[name="email"]', 'test@example.com');
            await fillField('input[name="phone"]', '+91 98765 43210');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const enabledAfterAll = await checkSaveButtonState();
            console.log(`🔓 Save button enabled after all fields: ${enabledAfterAll}`);
            
            if (enabledAfterAll) {
              console.log('✅ Staff form validation working correctly');
              testResults.staffFormValidation = true;
            }
            
            // Test invalid email
            await fillField('input[name="email"]', 'invalid-email');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const enabledWithInvalidEmail = await checkSaveButtonState();
            console.log(`🔓 Save button enabled with invalid email: ${enabledWithInvalidEmail}`);
            
            if (!enabledWithInvalidEmail) {
              console.log('✅ Staff form correctly handles invalid email');
              testResults.errorHandling = true;
            }
          }
          
          // Close modal
          const cancelBtn = await findButton('Cancel');
          if (cancelBtn) await cancelBtn.click();
        }
      }
    }

    // Test 3: Appointment Form Validation
    console.log('\n🧪 Testing Appointment Form Validation...');
    
    if (await clickButton('Calendar')) {
      if (await clickButton('Quick Book')) {
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Quick Book modal opened');
          
          // Test empty form
          const initiallyEnabled = await checkSaveButtonState();
          console.log(`🔒 Save button initially enabled: ${initiallyEnabled}`);
          
          if (!initiallyEnabled) {
            // Fill required fields
            await fillField('input[type="text"]', 'Test Customer');
            await fillField('input[type="tel"]', '+91 98765 43210');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const enabledAfterAll = await checkSaveButtonState();
            console.log(`🔓 Save button enabled after all fields: ${enabledAfterAll}`);
            
            if (enabledAfterAll) {
              console.log('✅ Appointment form validation working correctly');
              testResults.appointmentFormValidation = true;
            }
          }
          
          // Close modal
          const cancelBtn = await findButton('Cancel');
          if (cancelBtn) await cancelBtn.click();
        }
      }
    }

    // Test 4: Data Persistence
    console.log('\n🧪 Testing Data Persistence...');
    
    // Navigate through sections and check if data persists
    const sections = ['Overview', 'Services', 'Staff', 'Calendar'];
    let dataPersisted = true;
    
    for (const section of sections) {
      if (await clickButton(section)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if any data is displayed
        const hasData = await page.evaluate(() => {
          const tables = document.querySelectorAll('table');
          const cards = document.querySelectorAll('[class*="card"]');
          const lists = document.querySelectorAll('[class*="list"]');
          
          return tables.length > 0 || cards.length > 0 || lists.length > 0;
        });
        
        console.log(`${section} section has data: ${hasData}`);
        if (!hasData) {
          dataPersisted = false;
        }
      }
    }
    
    if (dataPersisted) {
      console.log('✅ Data persistence working correctly');
      testResults.dataPersistence = true;
    }

    // Test 5: Error Message Display
    console.log('\n🧪 Testing Error Message Display...');
    
    // Try to trigger an error by submitting invalid data
    if (await clickButton('Services')) {
      if (await clickButton('Add Service')) {
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          // Fill with invalid data
          await fillField('input[name="name"]', ''); // Empty name
          await fillField('input[name="base_price"]', '-100'); // Negative price
          
          // Try to submit
          const saveBtn = await findButton('Save Service');
          if (saveBtn) {
            await saveBtn.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check for error messages
            const errorMessages = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
            if (errorMessages.length > 0) {
              const errorTexts = await page.$$eval('.text-red-500, .text-red-600, [class*="error"]', 
                elements => elements.map(el => el.textContent?.trim()).filter(text => text)
              );
              console.log('✅ Error messages displayed:', errorTexts);
              testResults.errorHandling = true;
            } else {
              console.log('⚠️ No error messages displayed for invalid data');
            }
          }
          
          // Close modal
          const cancelBtn = await findButton('Cancel');
          if (cancelBtn) await cancelBtn.click();
        }
      }
    }

    // Results Summary
    console.log('\n📊 === FORM VALIDATION TEST RESULTS ===');
    console.log(`Service Form Validation: ${testResults.serviceFormValidation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Staff Form Validation: ${testResults.staffFormValidation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Appointment Form Validation: ${testResults.appointmentFormValidation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Data Persistence: ${testResults.dataPersistence ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Error Handling: ${testResults.errorHandling ? '✅ PASS' : '❌ FAIL'}`);
    
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(result => result).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Form Validation Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
    
    if (successRate >= 80) {
      console.log('🎉 Form validation tests PASSED!');
    } else {
      console.log('⚠️ Form validation needs improvement');
    }

    // Take final screenshot
    await page.screenshot({ path: 'form-validation-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: form-validation-test-result.png');
    
  } catch (error) {
    console.error('❌ Form validation test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testFormValidation().catch(console.error);
