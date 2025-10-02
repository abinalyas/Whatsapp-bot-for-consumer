import puppeteer from 'puppeteer';

async function testEditModal() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('🕐') || msg.text().includes('🔍') || msg.text().includes('Converting') || msg.text().includes('Staff assignment')) {
      console.log('📱 Browser Log:', msg.text());
    }
  });
  
  try {
    console.log('🚀 Testing Edit Appointment modal...');
    await page.goto('https://whatsapp-bot-for-consumer-3h75gsncd-abinalyas-projects.vercel.app/salon-dashboard', { waitUntil: 'networkidle0' });
    
    // Wait for calendar to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find and click Edit button
    const editButtons = await page.$$('button');
    let editButton = null;
    
    for (const button of editButtons) {
      const text = await page.evaluate(el => el.textContent?.trim(), button);
      if (text === 'Edit') {
        editButton = button;
        break;
      }
    }
    
    if (editButton) {
      console.log('✅ Found Edit button, clicking...');
      await editButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if time field is populated
      const timeInput = await page.$('input[type="time"]');
      if (timeInput) {
        const timeValue = await page.evaluate(el => el.value, timeInput);
        console.log('⏰ Time field value:', timeValue || 'EMPTY');
      } else {
        console.log('❌ Time input not found');
      }
      
      // Check staff dropdown
      const staffSelect = await page.$('select[name="staffMember"], select[name="staff"]');
      if (staffSelect) {
        const selectedStaff = await page.evaluate(el => el.value, staffSelect);
        console.log('👤 Staff dropdown value:', selectedStaff || 'EMPTY');
      }
      
    } else {
      console.log('❌ Edit button not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEditModal();
