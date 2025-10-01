import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testEditModalTimePrepopulation() {
  console.log('🕐 Testing Edit Modal Time Prepopulation...');
  
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
      } else if (msg.text().includes('🚀') || msg.text().includes('🔍') || msg.text().includes('🕐') || msg.text().includes('✅')) {
        console.log('📱 Browser Log:', msg.text());
      }
    });

    console.log('🌐 Navigating to salon dashboard...');
    await page.goto(`${BASE_URL}/salon-dashboard`, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Page loaded successfully');
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'test-screenshot-before.png' });
    console.log('📸 Screenshot saved: test-screenshot-before.png');
    
    // Look for any edit buttons on the page
    const editButtons = await page.$$('button');
    console.log(`🔍 Found ${editButtons.length} buttons on the page`);
    
    // Get all button text to understand what's available
    const buttonTexts = await page.$$eval('button', buttons => 
      buttons.map(btn => btn.textContent?.trim()).filter(text => text && text.length > 0)
    );
    console.log('📝 Available buttons:', buttonTexts.slice(0, 10)); // Show first 10
    
    // Look for "Edit" buttons specifically
    const editButtonTexts = buttonTexts.filter(text => text.includes('Edit'));
    console.log('✏️ Edit buttons found:', editButtonTexts);
    
    if (editButtonTexts.length > 0) {
      // Try to click the first Edit button
      const editButtons = await page.$$('button');
      let editButton = null;
      for (const btn of editButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && text.includes('Edit')) {
          editButton = btn;
          break;
        }
      }
      
      if (editButton) {
        console.log('📝 Clicking first Edit button...');
        await editButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take screenshot after clicking
        await page.screenshot({ path: 'test-screenshot-after-edit.png' });
        console.log('📸 Screenshot saved: test-screenshot-after-edit.png');
        
        // Check if modal opened
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Modal opened successfully');
          
          // Look for time input fields
          const timeInputs = await page.$$('input[type="time"]');
          console.log(`🕐 Found ${timeInputs.length} time input fields`);
          
          for (let i = 0; i < timeInputs.length; i++) {
            const timeInput = timeInputs[i];
            const timeValue = await page.evaluate(el => el.value, timeInput);
            console.log(`🕐 Time input ${i + 1} value: "${timeValue}"`);
            
            if (timeValue && timeValue !== '') {
              console.log(`✅ Time input ${i + 1} is properly populated`);
              
              // Test if we can modify the time
              await timeInput.click();
              await timeInput.evaluate(el => el.select());
              await page.keyboard.type('14:30');
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const newTimeValue = await page.evaluate(el => el.value, timeInput);
              console.log(`🕐 Time input ${i + 1} after modification: "${newTimeValue}"`);
              
              if (newTimeValue === '14:30') {
                console.log(`✅ Time input ${i + 1} modification works correctly`);
              } else {
                console.log(`❌ Time input ${i + 1} modification failed`);
              }
            } else {
              console.log(`⚠️ Time input ${i + 1} is empty - this might be the issue`);
            }
          }
          
          // Look for Save button and test if it works
          const allButtons = await page.$$('button');
          let saveButton = null;
          for (const btn of allButtons) {
            const text = await page.evaluate(el => el.textContent?.trim(), btn);
            if (text && text.includes('Save')) {
              saveButton = btn;
              break;
            }
          }
          
          if (saveButton) {
            console.log('💾 Found Save button');
            
            // Try to click Save to see if it works
            console.log('💾 Attempting to save...');
            await saveButton.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check for any error messages
            const errorMessages = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
            if (errorMessages.length > 0) {
              const errorTexts = await page.$$eval('.text-red-500, .text-red-600, [class*="error"]', 
                elements => elements.map(el => el.textContent?.trim()).filter(text => text)
              );
              console.log('❌ Error messages found:', errorTexts);
            } else {
              console.log('✅ No error messages found after save attempt');
            }
          }
          
          // Close modal
          const cancelButtons = await page.$$('button');
          let cancelButton = null;
          for (const btn of cancelButtons) {
            const text = await page.evaluate(el => el.textContent?.trim(), btn);
            if (text && text.includes('Cancel')) {
              cancelButton = btn;
              break;
            }
          }
          
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Modal closed');
          }
        } else {
          console.log('❌ Modal did not open');
        }
      } else {
        console.log('❌ No Edit buttons found');
      }
    } else {
      console.log('⚠️ No Edit buttons found - might need to create appointments first');
      
      // Try to create an appointment first
      console.log('📝 Attempting to create an appointment...');
      
      // Look for Quick Book or similar buttons
      const allButtons = await page.$$('button');
      let quickBookButton = null;
      for (const btn of allButtons) {
        const text = await page.evaluate(el => el.textContent?.trim(), btn);
        if (text && (text.includes('Quick Book') || text.includes('Book') || text.includes('Add'))) {
          quickBookButton = btn;
          break;
        }
      }
      
      if (quickBookButton) {
        console.log('📝 Found booking button, clicking...');
        await quickBookButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if booking modal opened
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Booking modal opened');
          
          // Fill in appointment details
          const nameInput = await page.$('input[placeholder*="name"], input[name*="name"]');
          if (nameInput) {
            await nameInput.type('Test Customer');
          }
          
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            await timeInput.click();
            await page.keyboard.type('10:30');
            console.log('🕐 Set time to 10:30');
          }
          
          // Try to save
          const saveButtons = await page.$$('button');
          let saveButton = null;
          for (const btn of saveButtons) {
            const text = await page.evaluate(el => el.textContent?.trim(), btn);
            if (text && (text.includes('Save') || text.includes('Book'))) {
              saveButton = btn;
              break;
            }
          }
          
          if (saveButton) {
            await saveButton.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('💾 Attempted to save appointment');
          }
          
          // Close modal
          const cancelButtons = await page.$$('button');
          let cancelButton = null;
          for (const btn of cancelButtons) {
            const text = await page.evaluate(el => el.textContent?.trim(), btn);
            if (text && text.includes('Cancel')) {
              cancelButton = btn;
              break;
            }
          }
          
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Modal closed');
          }
        }
      }
    }
    
    console.log('\n🎉 Edit Modal Time Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testEditModalTimePrepopulation().catch(console.error);
