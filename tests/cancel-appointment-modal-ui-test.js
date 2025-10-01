import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testCancelAppointmentModalUI() {
  console.log('🎨 Testing Cancel Appointment Modal UI Flow...');
  
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
      } else if (msg.text().includes('🚀') || msg.text().includes('🗑️') || msg.text().includes('Appointment cancelled')) {
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
    
    // Look for cancel button in overview
    console.log('🔍 Looking for cancel button in overview...');
    const cancelButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(btn => 
        btn.textContent?.trim().toLowerCase().includes('cancel') && 
        !btn.textContent?.trim().toLowerCase().includes('appointment') &&
        !btn.textContent?.trim().toLowerCase().includes('modal')
      );
      return cancelBtn ? {
        found: true,
        text: cancelBtn.textContent?.trim(),
        classes: cancelBtn.className
      } : { found: false };
    });
    
    if (cancelButton.found) {
      console.log(`✅ Found cancel button: "${cancelButton.text}"`);
      console.log(`   Classes: ${cancelButton.classes}`);
      
      // Click the cancel button
      console.log('🖱️ Clicking cancel button...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cancelBtn = buttons.find(btn => 
          btn.textContent?.trim().toLowerCase().includes('cancel') && 
          !btn.textContent?.trim().toLowerCase().includes('appointment') &&
          !btn.textContent?.trim().toLowerCase().includes('modal')
        );
        if (cancelBtn) cancelBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if custom modal opened
      console.log('🔍 Checking if custom modal opened...');
      const modalCheck = await page.evaluate(() => {
        // Look for the custom modal (not browser alert)
        const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
        const modalContent = document.querySelector('.bg-white.rounded-lg.p-6');
        const alertTriangle = document.querySelector('[class*="AlertTriangle"], svg');
        const cancelAppointmentBtn = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.trim().toLowerCase().includes('cancel appointment') &&
          btn.classList.contains('bg-red-600')
        );
        const keepAppointmentBtn = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.trim().toLowerCase().includes('keep appointment')
        );
        
        return {
          modalFound: !!modal,
          modalContentFound: !!modalContent,
          alertTriangleFound: !!alertTriangle,
          cancelAppointmentBtnFound: !!cancelAppointmentBtn,
          keepAppointmentBtnFound: !!keepAppointmentBtn,
          modalText: modalContent ? modalContent.textContent?.trim().substring(0, 200) : null
        };
      });
      
      console.log('📊 Modal Check Results:');
      console.log(`   Modal Found: ${modalCheck.modalFound ? '✅' : '❌'}`);
      console.log(`   Modal Content Found: ${modalCheck.modalContentFound ? '✅' : '❌'}`);
      console.log(`   Alert Triangle Found: ${modalCheck.alertTriangleFound ? '✅' : '❌'}`);
      console.log(`   Cancel Appointment Button Found: ${modalCheck.cancelAppointmentBtnFound ? '✅' : '❌'}`);
      console.log(`   Keep Appointment Button Found: ${modalCheck.keepAppointmentBtnFound ? '✅' : '❌'}`);
      
      if (modalCheck.modalText) {
        console.log(`   Modal Text Preview: ${modalCheck.modalText}...`);
      }
      
      if (modalCheck.modalFound && modalCheck.cancelAppointmentBtnFound && modalCheck.keepAppointmentBtnFound) {
        console.log('✅ Custom modal UI is working correctly!');
        
        // Test "Keep Appointment" button
        console.log('🖱️ Testing "Keep Appointment" button...');
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const keepBtn = buttons.find(btn => 
            btn.textContent?.trim().toLowerCase().includes('keep appointment')
          );
          if (keepBtn) keepBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if modal closed
        const modalClosed = await page.evaluate(() => {
          const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
          return !modal;
        });
        
        if (modalClosed) {
          console.log('✅ Modal closed successfully when clicking "Keep Appointment"');
        } else {
          console.log('❌ Modal did not close when clicking "Keep Appointment"');
        }
        
        // Test the actual cancellation flow
        console.log('\n🗑️ Testing actual cancellation flow...');
        
        // Click cancel button again
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const cancelBtn = buttons.find(btn => 
            btn.textContent?.trim().toLowerCase().includes('cancel') && 
            !btn.textContent?.trim().toLowerCase().includes('appointment') &&
            !btn.textContent?.trim().toLowerCase().includes('modal')
          );
          if (cancelBtn) cancelBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Click "Cancel Appointment" to confirm
        console.log('🗑️ Clicking "Cancel Appointment" to confirm...');
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const confirmBtn = buttons.find(btn => 
            btn.textContent?.trim().toLowerCase().includes('cancel appointment') &&
            btn.classList.contains('bg-red-600')
          );
          if (confirmBtn) confirmBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for success message or error
        const resultCheck = await page.evaluate(() => {
          const hasSuccessMessage = document.body.textContent.includes('Appointment cancelled successfully');
          const hasErrorMessage = document.body.textContent.includes('Failed to cancel appointment') ||
                                 document.body.textContent.includes('Error cancelling appointment');
          const hasAlert = document.body.textContent.includes('Appointment cancelled successfully!');
          
          return {
            hasSuccessMessage,
            hasErrorMessage,
            hasAlert,
            bodyText: document.body.textContent.substring(0, 500)
          };
        });
        
        console.log('📊 Cancellation Result:');
        console.log(`   Success Message: ${resultCheck.hasSuccessMessage ? '✅' : '❌'}`);
        console.log(`   Error Message: ${resultCheck.hasErrorMessage ? '❌' : '✅'}`);
        console.log(`   Alert Popup: ${resultCheck.hasAlert ? '✅' : '❌'}`);
        
        if (resultCheck.hasSuccessMessage || resultCheck.hasAlert) {
          console.log('✅ Cancellation completed successfully!');
        } else if (resultCheck.hasErrorMessage) {
          console.log('❌ Cancellation failed with error');
        }
        
      } else {
        console.log('❌ Custom modal UI is not working - still showing browser default behavior');
      }
      
    } else {
      console.log('❌ No cancel button found in overview section');
    }
    
    console.log('\n🎉 Cancel Appointment Modal UI Test Completed!');
    
    // Take screenshot
    await page.screenshot({ path: 'cancel-appointment-modal-ui-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: cancel-appointment-modal-ui-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCancelAppointmentModalUI().catch(console.error);
