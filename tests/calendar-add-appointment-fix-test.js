import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testCalendarAddAppointmentFix() {
  console.log('📅 Testing Calendar Add Appointment Fix...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging to catch errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Browser Error:', msg.text());
        // Check if it's the loadTodaysAppointments error we fixed
        if (msg.text().includes('loadTodaysAppointments is not defined')) {
          console.error('🚨 CRITICAL: The loadTodaysAppointments error is still present!');
        }
      } else if (msg.text().includes('🚀') || msg.text().includes('📅') || msg.text().includes('Appointment created')) {
        console.log('📱 Browser Log:', msg.text());
      }
    });

    console.log('🌐 Loading salon dashboard...');
    await page.goto(`${BASE_URL}/salon-dashboard`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Page loaded successfully');
    
    // Navigate to Calendar section
    console.log('📅 Navigating to Calendar section...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const calendarBtn = buttons.find(btn => btn.textContent?.trim() === 'Calendar');
      if (calendarBtn) calendarBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for "Add Appointment" button in calendar
    console.log('🔍 Looking for Add Appointment button in calendar...');
    const addButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => 
        btn.textContent?.trim().toLowerCase().includes('add') &&
        btn.textContent?.trim().toLowerCase().includes('appointment')
      );
      return addBtn ? {
        found: true,
        text: addBtn.textContent?.trim(),
        classes: addBtn.className
      } : { found: false };
    });
    
    if (addButton.found) {
      console.log(`✅ Found Add Appointment button: "${addButton.text}"`);
      
      // Click the Add Appointment button
      console.log('🖱️ Clicking Add Appointment button...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(btn => 
          btn.textContent?.trim().toLowerCase().includes('add') &&
          btn.textContent?.trim().toLowerCase().includes('appointment')
        );
        if (addBtn) addBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if appointment modal opened
      const modalOpened = await page.$('.fixed.inset-0');
      if (modalOpened) {
        console.log('✅ Appointment modal opened successfully');
        
        // Fill in appointment details
        console.log('📝 Filling appointment details...');
        
        // Customer name
        await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          const nameInput = inputs.find(input => 
            input.placeholder?.toLowerCase().includes('customer') ||
            input.placeholder?.toLowerCase().includes('name')
          );
          if (nameInput) {
            nameInput.focus();
            nameInput.value = '';
            nameInput.value = 'Test Customer Calendar';
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            nameInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Phone number
        await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          const phoneInput = inputs.find(input => 
            input.type === 'tel' ||
            input.placeholder?.toLowerCase().includes('phone')
          );
          if (phoneInput) {
            phoneInput.focus();
            phoneInput.value = '';
            phoneInput.value = '9876543210';
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
            phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Service selection
        await page.evaluate(() => {
          const selects = Array.from(document.querySelectorAll('select'));
          if (selects.length > 0) {
            const serviceSelect = selects[0]; // Usually the first select is for service
            serviceSelect.focus();
            const options = Array.from(serviceSelect.options);
            const serviceOption = options.find(opt => 
              opt.text !== 'Select Service' && opt.text !== '' && opt.value !== ''
            );
            if (serviceOption) {
              serviceSelect.value = serviceOption.value;
              serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Staff selection
        await page.evaluate(() => {
          const selects = Array.from(document.querySelectorAll('select'));
          if (selects.length > 1) {
            const staffSelect = selects[1]; // Usually the second select is for staff
            staffSelect.focus();
            const options = Array.from(staffSelect.options);
            const staffOption = options.find(opt => 
              opt.text !== 'Select Staff' && opt.text !== '' && opt.value !== ''
            );
            if (staffOption) {
              staffSelect.value = staffOption.value;
              staffSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to submit the appointment
        console.log('💾 Attempting to submit appointment...');
        const submitResult = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const submitBtn = buttons.find(btn => 
            btn.textContent?.trim().toLowerCase().includes('book') ||
            btn.textContent?.trim().toLowerCase().includes('save') ||
            btn.textContent?.trim().toLowerCase().includes('create')
          );
          if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
            return { success: true, text: submitBtn.textContent?.trim() };
          }
          return { success: false, disabled: submitBtn?.disabled };
        });
        
        if (submitResult.success) {
          console.log(`✅ Clicked submit button: "${submitResult.text}"`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check for success or error messages
          const resultCheck = await page.evaluate(() => {
            const hasSuccessMessage = document.body.textContent.includes('Appointment created successfully') ||
                                     document.body.textContent.includes('successfully') ||
                                     document.body.textContent.includes('created');
            const hasErrorMessage = document.body.textContent.includes('Failed to create appointment') ||
                                   document.body.textContent.includes('Error creating appointment');
            const modalClosed = !document.querySelector('.fixed.inset-0');
            
            return {
              hasSuccessMessage,
              hasErrorMessage,
              modalClosed,
              bodyText: document.body.textContent.substring(0, 300)
            };
          });
          
          console.log('📊 Appointment Creation Result:');
          console.log(`   Success Message: ${resultCheck.hasSuccessMessage ? '✅' : '❌'}`);
          console.log(`   Error Message: ${resultCheck.hasErrorMessage ? '❌' : '✅'}`);
          console.log(`   Modal Closed: ${resultCheck.modalClosed ? '✅' : '❌'}`);
          
          if (resultCheck.hasSuccessMessage && resultCheck.modalClosed) {
            console.log('✅ Appointment created successfully from calendar!');
          } else if (resultCheck.hasErrorMessage) {
            console.log('❌ Appointment creation failed');
          }
          
        } else {
          console.log(`❌ Submit button not found or disabled: ${submitResult.disabled ? 'disabled' : 'not found'}`);
        }
        
      } else {
        console.log('❌ Appointment modal did not open');
      }
      
    } else {
      console.log('❌ No Add Appointment button found in calendar section');
    }
    
    console.log('\n🎉 Calendar Add Appointment Fix Test Completed!');
    console.log('✅ If no loadTodaysAppointments error appeared, the fix is working!');
    
    // Take screenshot
    await page.screenshot({ path: 'calendar-add-appointment-fix-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: calendar-add-appointment-fix-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCalendarAddAppointmentFix().catch(console.error);
