import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testMultipleAppointmentsPerTimeslot() {
  console.log('📅 Testing Multiple Appointments Per Time Slot Fix...');
  
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
      } else if (msg.text().includes('🚀') || msg.text().includes('📅') || msg.text().includes('🔍')) {
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
    
    // Look for Daily Schedule section
    console.log('🔍 Looking for Daily Schedule section...');
    const scheduleSection = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('h2, h3, h4'));
      const scheduleTitle = sections.find(section => 
        section.textContent?.trim().toLowerCase().includes('daily schedule')
      );
      return scheduleTitle ? {
        found: true,
        text: scheduleTitle.textContent?.trim()
      } : { found: false };
    });
    
    if (scheduleSection.found) {
      console.log(`✅ Found schedule section: "${scheduleSection.text}"`);
      
      // Check for appointments in the daily schedule
      console.log('🔍 Checking for appointments in daily schedule...');
      const appointments = await page.evaluate(() => {
        const appointmentRows = Array.from(document.querySelectorAll('.border.rounded-lg'));
        const appointmentDetails = appointmentRows.map(row => {
          const customerNames = Array.from(row.querySelectorAll('.font-semibold.text-gray-900')).map(el => el.textContent?.trim()).filter(text => text);
          const serviceStaff = Array.from(row.querySelectorAll('.text-sm.text-gray-600')).map(el => el.textContent?.trim()).filter(text => text);
          const timeElement = row.querySelector('.text-sm.font-medium.text-gray-900');
          const time = timeElement?.textContent?.trim() || '';
          
          return {
            time,
            customers: customerNames,
            serviceStaffDetails: serviceStaff,
            totalCustomers: customerNames.length,
            rowText: row.textContent?.trim().substring(0, 200) + '...'
          };
        });
        
        return appointmentDetails;
      });
      
      console.log(`📊 Found ${appointments.length} appointment rows in daily schedule`);
      
      if (appointments.length > 0) {
        console.log('📋 Appointment Analysis:');
        appointments.forEach((apt, index) => {
          console.log(`   Row ${index + 1} (${apt.time}):`);
          console.log(`     Customers: ${apt.customers.join(', ')}`);
          console.log(`     Total customers: ${apt.totalCustomers}`);
          console.log(`     Service/Staff: ${apt.serviceStaffDetails.join(' | ')}`);
        });
        
        // Check for multiple customers per time slot
        const multipleCustomersPerSlot = appointments.filter(apt => apt.totalCustomers > 1);
        const uniqueCustomers = [...new Set(appointments.flatMap(apt => apt.customers))];
        
        console.log('🔍 Multiple Appointments Analysis:');
        console.log(`   Time slots with multiple customers: ${multipleCustomersPerSlot.length}`);
        console.log(`   Total unique customers found: ${uniqueCustomers.length}`);
        console.log(`   Unique customers: ${uniqueCustomers.join(', ')}`);
        
        if (multipleCustomersPerSlot.length > 0) {
          console.log('✅ Multiple customers found per time slot!');
          multipleCustomersPerSlot.forEach(slot => {
            console.log(`   ${slot.time}: ${slot.customers.join(', ')}`);
          });
        } else if (uniqueCustomers.length > 1) {
          console.log('✅ Multiple unique customers found across different time slots!');
        } else {
          console.log('⚠️ Only one unique customer found - may indicate duplicate details issue');
        }
        
        // Check for duplicate customer names in same time slot
        const duplicateCustomers = appointments.filter(apt => {
          const uniqueInSlot = [...new Set(apt.customers)];
          return apt.customers.length > uniqueInSlot.length;
        });
        
        if (duplicateCustomers.length > 0) {
          console.log('❌ Found duplicate customer names in same time slot:');
          duplicateCustomers.forEach(slot => {
            console.log(`   ${slot.time}: ${slot.customers.join(', ')}`);
          });
        } else {
          console.log('✅ No duplicate customer names in same time slots found');
        }
        
        // Check for visual separators (hr elements)
        const separators = await page.evaluate(() => {
          const hrElements = Array.from(document.querySelectorAll('hr.border-gray-200'));
          return hrElements.length;
        });
        
        console.log(`📏 Visual separators found: ${separators}`);
        if (separators > 0) {
          console.log('✅ Visual separators found - multiple appointments properly separated');
        }
        
      } else {
        console.log('❌ No appointments found in daily schedule');
      }
      
    } else {
      console.log('❌ Daily Schedule section not found');
    }
    
    console.log('\n🎉 Multiple Appointments Per Time Slot Test Completed!');
    
    // Take screenshot
    await page.screenshot({ path: 'multiple-appointments-per-timeslot-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: multiple-appointments-per-timeslot-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testMultipleAppointmentsPerTimeslot().catch(console.error);
