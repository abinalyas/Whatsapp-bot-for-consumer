import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testCancelAppointmentUUIDFix() {
  console.log('🔧 Testing Cancel Appointment UUID Fix...');
  
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
        // Check if it's the UUID error we fixed
        if (msg.text().includes('invalid input syntax for type uuid') || 
            msg.text().includes('bella-salon')) {
          console.error('🚨 CRITICAL: The UUID error is still present!');
        }
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
          
          // Check for any error messages in the page
          const errorMessages = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.text-red-500, .text-red-600, [class*="error"]');
            return Array.from(errorElements).map(el => el.textContent?.trim()).filter(text => text);
          });
          
          if (errorMessages.length > 0) {
            console.error('❌ Error messages found:', errorMessages);
            
            // Check if it's the UUID error we fixed
            const hasUUIDError = errorMessages.some(msg => 
              msg.includes('invalid input syntax for type uuid') || 
              msg.includes('bella-salon')
            );
            
            if (hasUUIDError) {
              console.error('🚨 CRITICAL: The UUID error is still present!');
              return false;
            } else {
              console.log('⚠️ Other errors found, but not the UUID error');
            }
          } else {
            console.log('✅ No error messages found - UUID fix working!');
          }
          
          // Check for success message or alert
          const hasSuccessMessage = await page.evaluate(() => {
            return document.body.textContent.includes('Appointment cancelled successfully') ||
                   document.body.textContent.includes('successfully');
          });
          
          if (hasSuccessMessage) {
            console.log('✅ Success message detected - cancellation worked!');
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
    
    console.log('\n🎉 Cancel Appointment UUID Fix Test Completed!');
    console.log('✅ If no UUID error appeared, the fix is working!');
    
    // Take screenshot
    await page.screenshot({ path: 'cancel-appointment-uuid-fix-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: cancel-appointment-uuid-fix-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCancelAppointmentUUIDFix().catch(console.error);
