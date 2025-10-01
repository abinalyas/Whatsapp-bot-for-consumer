import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testEditAppointmentFix() {
  console.log('🔧 Testing Edit Appointment Fix...');
  
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
        // Check if it's the specific error we fixed
        if (msg.text().includes('loadTodaysAppointments is not defined')) {
          console.error('🚨 CRITICAL: The loadTodaysAppointments error is still present!');
        }
      } else if (msg.text().includes('🚀') || msg.text().includes('📅')) {
        console.log('📱 Browser Log:', msg.text());
      }
    });

    console.log('🌐 Loading salon dashboard...');
    await page.goto(`${BASE_URL}/salon-dashboard`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Page loaded successfully');
    
    // Navigate to Overview section
    console.log('📝 Navigating to Overview section...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const overviewBtn = buttons.find(btn => btn.textContent?.trim() === 'Overview');
      if (overviewBtn) overviewBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to edit an appointment
    console.log('📝 Attempting to edit an appointment...');
    const editResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => 
        btn.textContent?.trim().toLowerCase().includes('edit') && 
        !btn.textContent?.trim().toLowerCase().includes('service') &&
        !btn.textContent?.trim().toLowerCase().includes('staff')
      );
      if (editBtn) {
        editBtn.click();
        return { success: true, text: editBtn.textContent?.trim() };
      }
      return { success: false };
    });
    
    if (editResult.success) {
      console.log(`✅ Found and clicked edit button: "${editResult.text}"`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if modal opened
      const modalOpened = await page.$('.fixed.inset-0');
      if (modalOpened) {
        console.log('✅ Edit appointment modal opened successfully');
        
        // Try to change the time
        console.log('🕐 Attempting to change appointment time...');
        await page.evaluate(() => {
          const timeInput = document.querySelector('input[type="time"]');
          if (timeInput) {
            timeInput.value = '16:30';
            timeInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to save the changes
        console.log('💾 Attempting to save changes...');
        const saveResult = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveBtn = buttons.find(btn => 
            btn.textContent?.trim().toLowerCase().includes('save changes')
          );
          if (saveBtn) {
            saveBtn.click();
            return { success: true };
          }
          return { success: false };
        });
        
        if (saveResult.success) {
          console.log('✅ Save Changes button clicked');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check for any error messages
          const errorMessages = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
          if (errorMessages.length > 0) {
            const errorTexts = await page.$$eval('.text-red-500, .text-red-600, [class*="error"]', 
              elements => elements.map(el => el.textContent?.trim()).filter(text => text)
            );
            console.error('❌ Error messages found:', errorTexts);
            
            // Check if it's the specific error we fixed
            const hasLoadTodaysError = errorTexts.some(text => 
              text.includes('loadTodaysAppointments is not defined')
            );
            
            if (hasLoadTodaysError) {
              console.error('🚨 CRITICAL: The loadTodaysAppointments error is still present!');
              return false;
            } else {
              console.log('⚠️ Other errors found, but not the loadTodaysAppointments error');
            }
          } else {
            console.log('✅ No error messages found - appointment edit successful!');
          }
          
          // Check if modal closed (indicating success)
          const modalStillOpen = await page.$('.fixed.inset-0');
          if (!modalStillOpen) {
            console.log('✅ Modal closed - appointment edit completed successfully');
          } else {
            console.log('⚠️ Modal still open - may need to close manually');
          }
          
        } else {
          console.log('❌ Save Changes button not found');
        }
        
      } else {
        console.log('❌ Edit appointment modal did not open');
      }
      
    } else {
      console.log('❌ No edit button found - may need to create an appointment first');
    }
    
    console.log('\n🎉 Edit Appointment Fix Test Completed!');
    console.log('✅ If no loadTodaysAppointments error appeared, the fix is working!');
    
    // Take screenshot
    await page.screenshot({ path: 'edit-appointment-fix-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: edit-appointment-fix-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testEditAppointmentFix().catch(console.error);
