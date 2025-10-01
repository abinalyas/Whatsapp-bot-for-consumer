import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testModalFlows() {
  console.log('🎭 Starting Modal Flows Test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Browser Error:', msg.text());
      } else if (msg.text().includes('🚀') || msg.text().includes('🔍') || msg.text().includes('✅')) {
        console.log('📱 Browser Log:', msg.text());
      }
    });

    console.log('🌐 Navigating to salon dashboard...');
    await page.goto(`${BASE_URL}/salon-dashboard`, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Page loaded successfully');
    
    // Test 1: Overview Section - Edit Appointment Modal
    console.log('\n🧪 Test 1: Overview Section - Edit Appointment Modal');
    try {
      // Navigate to Overview section
      await page.click('button:has-text("Overview")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for edit buttons in Today's Appointments
      const editButtons = await page.$$('button:has-text("Edit")');
      if (editButtons.length > 0) {
        console.log('📝 Found edit buttons, clicking first one...');
        await editButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if modal opened
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Edit Appointment Modal opened successfully');
          
          // Check if time field is populated
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            const timeValue = await page.evaluate(el => el.value, timeInput);
            console.log(`🕐 Time field value: "${timeValue}"`);
            
            if (timeValue && timeValue !== '') {
              console.log('✅ Time field is properly populated');
            } else {
              console.log('⚠️ Time field is empty - this might be the issue');
            }
            
            // Test time field interaction
            await timeInput.click();
            await page.keyboard.type('14:30');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const newTimeValue = await page.evaluate(el => el.value, timeInput);
            console.log(`🕐 Updated time field value: "${newTimeValue}"`);
            
            if (newTimeValue === '14:30') {
              console.log('✅ Time field interaction works correctly');
            } else {
              console.log('❌ Time field interaction failed');
            }
          } else {
            console.log('❌ Time input field not found in modal');
          }
          
          // Close modal
          const cancelButton = await page.$('button:has-text("Cancel")');
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Modal closed successfully');
          }
        } else {
          console.log('❌ Edit Appointment Modal did not open');
        }
      } else {
        console.log('⚠️ No edit buttons found - might need to create appointments first');
      }
    } catch (error) {
      console.error('❌ Test 1 failed:', error.message);
    }
    
    // Test 2: Services Section - Add Service Modal
    console.log('\n🧪 Test 2: Services Section - Add Service Modal');
    try {
      await page.click('button:has-text("Services")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const addServiceButton = await page.$('button:has-text("Add Service")');
      if (addServiceButton) {
        console.log('📝 Clicking Add Service button...');
        await addServiceButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Add Service Modal opened successfully');
          
          // Test form validation
          const saveButton = await page.$('button:has-text("Save Service")');
          if (saveButton) {
            const isDisabled = await page.evaluate(el => el.disabled, saveButton);
            console.log(`🔒 Save button disabled: ${isDisabled}`);
            
            if (isDisabled) {
              console.log('✅ Form validation working - Save button disabled when required fields empty');
            } else {
              console.log('⚠️ Form validation might not be working - Save button should be disabled');
            }
            
            // Fill required fields
            await page.type('input[name="name"]', 'Test Service');
            await page.select('select[name="category"]', 'Hair');
            await page.type('input[name="base_price"]', '500');
            await page.type('input[name="duration_minutes"]', '60');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const isDisabledAfterFill = await page.evaluate(el => el.disabled, saveButton);
            console.log(`🔓 Save button disabled after filling: ${isDisabledAfterFill}`);
            
            if (!isDisabledAfterFill) {
              console.log('✅ Form validation working - Save button enabled after filling required fields');
            } else {
              console.log('❌ Form validation failed - Save button still disabled');
            }
          }
          
          // Close modal
          const cancelButton = await page.$('button:has-text("Cancel")');
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Modal closed successfully');
          }
        } else {
          console.log('❌ Add Service Modal did not open');
        }
      } else {
        console.log('❌ Add Service button not found');
      }
    } catch (error) {
      console.error('❌ Test 2 failed:', error.message);
    }
    
    // Test 3: Staff Section - Add Staff Modal
    console.log('\n🧪 Test 3: Staff Section - Add Staff Modal');
    try {
      await page.click('button:has-text("Staff")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const addStaffButton = await page.$('button:has-text("Add Staff")');
      if (addStaffButton) {
        console.log('📝 Clicking Add Staff button...');
        await addStaffButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Add Staff Modal opened successfully');
          
          // Test form validation
          const saveButton = await page.$('button:has-text("Save Staff")');
          if (saveButton) {
            const isDisabled = await page.evaluate(el => el.disabled, saveButton);
            console.log(`🔒 Save button disabled: ${isDisabled}`);
            
            // Fill required fields
            await page.type('input[name="name"]', 'Test Staff');
            await page.select('select[name="role"]', 'Hair Stylist');
            await page.type('input[name="email"]', 'test@example.com');
            await page.type('input[name="phone"]', '+91 98765 43210');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const isDisabledAfterFill = await page.evaluate(el => el.disabled, saveButton);
            console.log(`🔓 Save button disabled after filling: ${isDisabledAfterFill}`);
            
            if (!isDisabledAfterFill) {
              console.log('✅ Staff form validation working correctly');
            } else {
              console.log('❌ Staff form validation failed');
            }
          }
          
          // Close modal
          const cancelButton = await page.$('button:has-text("Cancel")');
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Modal closed successfully');
          }
        } else {
          console.log('❌ Add Staff Modal did not open');
        }
      } else {
        console.log('❌ Add Staff button not found');
      }
    } catch (error) {
      console.error('❌ Test 3 failed:', error.message);
    }
    
    // Test 4: Calendar Section - Quick Book Modal
    console.log('\n🧪 Test 4: Calendar Section - Quick Book Modal');
    try {
      await page.click('button:has-text("Calendar")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const quickBookButton = await page.$('button:has-text("Quick Book")');
      if (quickBookButton) {
        console.log('📝 Clicking Quick Book button...');
        await quickBookButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Quick Book Modal opened successfully');
          
          // Test time field
          const timeInput = await page.$('input[type="time"]');
          if (timeInput) {
            await timeInput.click();
            await page.keyboard.type('15:00');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const timeValue = await page.evaluate(el => el.value, timeInput);
            console.log(`🕐 Quick Book time field value: "${timeValue}"`);
            
            if (timeValue === '15:00') {
              console.log('✅ Quick Book time field works correctly');
            } else {
              console.log('❌ Quick Book time field failed');
            }
          }
          
          // Close modal
          const cancelButton = await page.$('button:has-text("Cancel")');
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Modal closed successfully');
          }
        } else {
          console.log('❌ Quick Book Modal did not open');
        }
      } else {
        console.log('❌ Quick Book button not found');
      }
    } catch (error) {
      console.error('❌ Test 4 failed:', error.message);
    }
    
    // Test 5: Overview Section - Reassign Appointment Modal
    console.log('\n🧪 Test 5: Overview Section - Reassign Appointment Modal');
    try {
      await page.click('button:has-text("Overview")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for reassign buttons in Today's Staff Schedule
      const reassignButtons = await page.$$('button:has-text("Reassign")');
      if (reassignButtons.length > 0) {
        console.log('📝 Found reassign buttons, clicking first one...');
        await reassignButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✅ Reassign Appointment Modal opened successfully');
          
          // Check staff selection dropdown
          const staffSelect = await page.$('select');
          if (staffSelect) {
            const options = await page.$$eval('select option', options => 
              options.map(option => ({ value: option.value, text: option.textContent }))
            );
            console.log(`👥 Staff options found: ${options.length - 1} staff members`);
            
            if (options.length > 1) {
              console.log('✅ Staff dropdown populated correctly');
              
              // Select a staff member
              await page.select('select', options[1].value);
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Check notification checkbox
              const checkbox = await page.$('input[type="checkbox"]');
              if (checkbox) {
                const isChecked = await page.evaluate(el => el.checked, checkbox);
                console.log(`🔔 Notification checkbox checked: ${isChecked}`);
                
                if (!isChecked) {
                  console.log('✅ Notification checkbox defaults to unchecked');
                } else {
                  console.log('⚠️ Notification checkbox should default to unchecked');
                }
                
                // Test checkbox interaction
                await checkbox.click();
                const isCheckedAfter = await page.evaluate(el => el.checked, checkbox);
                console.log(`🔔 Notification checkbox after click: ${isCheckedAfter}`);
                
                if (isCheckedAfter) {
                  console.log('✅ Notification checkbox interaction works');
                } else {
                  console.log('❌ Notification checkbox interaction failed');
                }
              }
            } else {
              console.log('⚠️ No staff members found in dropdown');
            }
          }
          
          // Close modal
          const cancelButton = await page.$('button:has-text("Cancel")');
          if (cancelButton) {
            await cancelButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Modal closed successfully');
          }
        } else {
          console.log('❌ Reassign Appointment Modal did not open');
        }
      } else {
        console.log('⚠️ No reassign buttons found - might need appointments with staff assigned');
      }
    } catch (error) {
      console.error('❌ Test 5 failed:', error.message);
    }
    
    console.log('\n🎉 Modal Flows Test Completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testModalFlows().catch(console.error);
