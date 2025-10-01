import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testDailyScheduleTimelineFix() {
  console.log('📅 Testing Daily Schedule Timeline View Fix...');
  
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
    
    // Look for Staff Schedule Overview section
    console.log('🔍 Looking for Staff Schedule Overview...');
    const timelineSection = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('h2, h3, .text-xl'));
      const timelineTitle = sections.find(section => 
        section.textContent?.trim().toLowerCase().includes('staff schedule overview')
      );
      return timelineTitle ? {
        found: true,
        text: timelineTitle.textContent?.trim()
      } : { found: false };
    });
    
    if (timelineSection.found) {
      console.log(`✅ Found timeline section: "${timelineSection.text}"`);
      
      // Check for appointment blocks in timeline
      console.log('🔍 Checking for appointment blocks in timeline...');
      const appointmentBlocks = await page.evaluate(() => {
        // Look for appointment blocks (colored rectangles in timeline)
        const blocks = Array.from(document.querySelectorAll('.absolute.h-6.rounded.text-white'));
        const blockDetails = blocks.map(block => {
          const text = block.textContent?.trim() || '';
          const bgColor = block.className;
          const leftPosition = block.style.left || '';
          const width = block.style.width || '';
          return {
            text,
            bgColor: bgColor.includes('bg-green-500') ? 'green' : 
                    bgColor.includes('bg-blue-500') ? 'blue' :
                    bgColor.includes('bg-yellow-500') ? 'yellow' :
                    bgColor.includes('bg-purple-500') ? 'purple' : 'other',
            position: leftPosition,
            width: width
          };
        });
        
        return {
          count: blocks.length,
          details: blockDetails
        };
      });
      
      console.log(`📊 Found ${appointmentBlocks.count} appointment blocks in timeline`);
      
      if (appointmentBlocks.count > 0) {
        console.log('📋 Appointment Block Details:');
        appointmentBlocks.details.forEach((block, index) => {
          console.log(`   Block ${index + 1}: "${block.text}" (${block.bgColor}, pos: ${block.position}, width: ${block.width})`);
        });
        
        // Check if we have multiple appointments with different details
        const uniqueTexts = [...new Set(appointmentBlocks.details.map(b => b.text))];
        const uniqueColors = [...new Set(appointmentBlocks.details.map(b => b.bgColor))];
        const uniquePositions = [...new Set(appointmentBlocks.details.map(b => b.position))];
        
        console.log('🔍 Timeline Analysis:');
        console.log(`   Unique appointment texts: ${uniqueTexts.length}`);
        console.log(`   Unique colors: ${uniqueColors.length}`);
        console.log(`   Unique positions: ${uniquePositions.length}`);
        
        if (uniqueTexts.length > 1) {
          console.log('✅ Multiple appointments with different details found!');
          console.log('   Appointment texts:', uniqueTexts);
        } else if (appointmentBlocks.count > 1) {
          console.log('⚠️ Multiple appointment blocks but same text - may indicate duplicate details issue');
        } else {
          console.log('ℹ️ Single appointment block found');
        }
        
        // Check if appointments are positioned at different times
        if (uniquePositions.length > 1) {
          console.log('✅ Appointments are positioned at different times in timeline!');
        } else {
          console.log('⚠️ All appointments at same position - may indicate time issue');
        }
        
      } else {
        console.log('❌ No appointment blocks found in timeline');
      }
      
      // Also check the detailed appointment list
      console.log('\n🔍 Checking detailed appointment list...');
      const appointmentList = await page.evaluate(() => {
        const appointments = Array.from(document.querySelectorAll('.border.rounded-lg.p-4'));
        const appointmentDetails = appointments.map(apt => {
          const customerElement = apt.querySelector('h3.font-semibold');
          const serviceElement = apt.querySelector('.text-sm.text-gray-600');
          const customer = customerElement?.textContent?.trim() || '';
          const serviceStaff = serviceElement?.textContent?.trim() || '';
          return {
            customer,
            serviceStaff,
            fullText: apt.textContent?.trim().substring(0, 100) + '...'
          };
        });
        
        return {
          count: appointments.length,
          details: appointmentDetails
        };
      });
      
      console.log(`📋 Found ${appointmentList.count} detailed appointments`);
      
      if (appointmentList.count > 0) {
        console.log('📋 Detailed Appointment Details:');
        appointmentList.details.forEach((apt, index) => {
          console.log(`   Appointment ${index + 1}:`);
          console.log(`     Customer: "${apt.customer}"`);
          console.log(`     Service/Staff: "${apt.serviceStaff}"`);
        });
        
        // Check for unique customer names
        const uniqueCustomers = [...new Set(appointmentList.details.map(a => a.customer))];
        const uniqueServiceStaff = [...new Set(appointmentList.details.map(a => a.serviceStaff))];
        
        console.log('🔍 Detailed List Analysis:');
        console.log(`   Unique customers: ${uniqueCustomers.length}`);
        console.log(`   Unique service/staff: ${uniqueServiceStaff.length}`);
        
        if (uniqueCustomers.length > 1) {
          console.log('✅ Multiple unique customers found in detailed list!');
          console.log('   Customers:', uniqueCustomers);
        } else if (appointmentList.count > 1) {
          console.log('⚠️ Multiple appointments but same customer - may indicate duplicate details issue');
        }
        
      } else {
        console.log('❌ No detailed appointments found');
      }
      
    } else {
      console.log('❌ Staff Schedule Overview section not found');
    }
    
    console.log('\n🎉 Daily Schedule Timeline Fix Test Completed!');
    
    // Take screenshot
    await page.screenshot({ path: 'daily-schedule-timeline-fix-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: daily-schedule-timeline-fix-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDailyScheduleTimelineFix().catch(console.error);
