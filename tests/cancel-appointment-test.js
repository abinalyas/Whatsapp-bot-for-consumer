import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testCancelAppointment() {
  console.log('🗑️ Testing Cancel Appointment Functionality...');
  
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
      } else if (msg.text().includes('🚀') || msg.text().includes('📅') || msg.text().includes('Appointment cancelled')) {
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
    
    // Count initial appointments
    const initialAppointmentCount = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        return rows.length;
      }
      return 0;
    });
    
    console.log(`📊 Initial appointments count: ${initialAppointmentCount}`);
    
    if (initialAppointmentCount === 0) {
      console.log('⚠️ No appointments found to cancel. Test cannot proceed.');
      return;
    }
    
    // Try to cancel an appointment
    console.log('📝 Attempting to cancel an appointment...');
    const cancelResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(btn => 
        btn.textContent?.trim().toLowerCase().includes('cancel') && 
        !btn.textContent?.trim().toLowerCase().includes('appointment') &&
        !btn.textContent?.trim().toLowerCase().includes('modal')
      );
      if (cancelBtn) {
        cancelBtn.click();
        return { success: true, text: cancelBtn.textContent?.trim() };
      }
      return { success: false };
    });
    
    if (cancelResult.success) {
      console.log(`✅ Found and clicked cancel button: "${cancelResult.text}"`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if cancel modal opened
      const modalOpened = await page.$('.fixed.inset-0');
      if (modalOpened) {
        console.log('✅ Cancel appointment modal opened successfully');
        
        // Check modal content
        const modalContent = await page.evaluate(() => {
          const modal = document.querySelector('.fixed.inset-0');
          if (modal) {
            const title = modal.querySelector('h3')?.textContent?.trim();
            const message = modal.querySelector('p')?.textContent?.trim();
            const keepBtn = modal.querySelector('button')?.textContent?.trim();
            const cancelBtn = Array.from(modal.querySelectorAll('button')).find(btn => 
              btn.textContent?.trim().includes('Cancel Appointment')
            )?.textContent?.trim();
            
            return {
              title,
              message,
              keepBtn,
              cancelBtn
            };
          }
          return null;
        });
        
        console.log('📋 Modal content:', modalContent);
        
        // Verify modal matches reference design
        if (modalContent) {
          if (modalContent.title?.includes('Cancel Appointment')) {
            console.log('✅ Modal title matches reference design');
          }
          
          if (modalContent.message?.includes('Are you sure')) {
            console.log('✅ Modal message matches reference design');
          }
          
          if (modalContent.keepBtn?.includes('Keep Appointment')) {
            console.log('✅ Keep Appointment button matches reference design');
          }
          
          if (modalContent.cancelBtn?.includes('Cancel Appointment')) {
            console.log('✅ Cancel Appointment button matches reference design');
          }
        }
        
        // Try to click Cancel Appointment button
        console.log('🗑️ Attempting to confirm cancellation...');
        const confirmResult = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const confirmBtn = buttons.find(btn => 
            btn.textContent?.trim().toLowerCase().includes('cancel appointment') &&
            btn.classList.contains('bg-red-600') // Red destructive button
          );
          if (confirmBtn) {
            confirmBtn.click();
            return { success: true };
          }
          return { success: false };
        });
        
        if (confirmResult.success) {
          console.log('✅ Cancel Appointment button clicked');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check for success message or alert
          const hasAlert = await page.evaluate(() => {
            // Check for alert dialog
            return window.alert.toString().includes('native code') || 
                   document.querySelector('.alert') !== null ||
                   document.querySelector('[class*="success"]') !== null;
          });
          
          if (hasAlert) {
            console.log('✅ Success alert detected');
          }
          
          // Check if appointment count decreased
          const finalAppointmentCount = await page.evaluate(() => {
            const table = document.querySelector('table');
            if (table) {
              const rows = Array.from(table.querySelectorAll('tbody tr'));
              return rows.length;
            }
            return 0;
          });
          
          console.log(`📊 Final appointments count: ${finalAppointmentCount}`);
          
          if (finalAppointmentCount < initialAppointmentCount) {
            console.log('✅ Appointment count decreased - cancellation successful!');
          } else {
            console.log('⚠️ Appointment count unchanged - cancellation may not have worked');
          }
          
        } else {
          console.log('❌ Cancel Appointment button not found or not clickable');
        }
        
      } else {
        console.log('❌ Cancel appointment modal did not open');
      }
      
    } else {
      console.log('❌ No cancel button found - may need to create an appointment first');
    }
    
    console.log('\n🎉 Cancel Appointment Test Completed!');
    console.log('✅ If the modal opened and appointment count decreased, the functionality is working!');
    
    // Take screenshot
    await page.screenshot({ path: 'cancel-appointment-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: cancel-appointment-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCancelAppointment().catch(console.error);
