import puppeteer from 'puppeteer';

const BASE_URL = 'https://whatsapp-bot-for-consumer-38m8i4mcn-abinalyas-projects.vercel.app';

async function testCalendarDataConsistency() {
  console.log('📅 Testing Calendar Data Consistency Across Views...');
  
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
      } else if (msg.text().includes('MAIN COMPONENT')) {
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
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Collect data from all three views
    console.log('🔍 Collecting data from all calendar views...');
    const calendarData = await page.evaluate(() => {
      // 1. Daily Schedule data
      const dailyScheduleRows = Array.from(document.querySelectorAll('.border.rounded-lg'));
      const dailyScheduleAppointments = dailyScheduleRows.map(row => {
        const customerNames = Array.from(row.querySelectorAll('.font-semibold.text-gray-900')).map(el => el.textContent?.trim()).filter(text => text);
        const serviceStaff = Array.from(row.querySelectorAll('.text-sm.text-gray-600')).map(el => el.textContent?.trim()).filter(text => text);
        const timeElement = row.querySelector('.text-sm.font-medium.text-gray-900');
        const time = timeElement?.textContent?.trim() || '';
        
        return {
          time,
          customers: customerNames,
          serviceStaffDetails: serviceStaff,
          totalCustomers: customerNames.length
        };
      });
      
      // 2. Appointment Details data
      const appointmentDetailsRows = Array.from(document.querySelectorAll('.space-y-4 > div'));
      const appointmentDetails = appointmentDetailsRows.map(row => {
        const customerElement = row.querySelector('h3.font-semibold');
        const serviceElement = row.querySelector('.text-sm.text-gray-600');
        const customer = customerElement?.textContent?.trim() || '';
        const serviceStaff = serviceElement?.textContent?.trim() || '';
        
        return {
          customer,
          serviceStaff
        };
      }).filter(apt => apt.customer && apt.serviceStaff);
      
      // 3. Staff Schedule Overview data
      const staffTimelineBlocks = Array.from(document.querySelectorAll('.absolute.h-6.rounded.text-white'));
      const staffScheduleAppointments = staffTimelineBlocks.map(block => {
        const text = block.textContent?.trim() || '';
        const bgColor = block.className;
        const leftPosition = block.style.left || '';
        
        return {
          text,
          bgColor: bgColor.includes('bg-green-500') ? 'green' : 
                  bgColor.includes('bg-blue-500') ? 'blue' :
                  bgColor.includes('bg-yellow-500') ? 'yellow' :
                  bgColor.includes('bg-purple-500') ? 'purple' : 'other',
          position: leftPosition
        };
      });
      
      return {
        dailySchedule: {
          appointments: dailyScheduleAppointments,
          totalAppointments: dailyScheduleAppointments.length,
          uniqueCustomers: [...new Set(dailyScheduleAppointments.flatMap(apt => apt.customers))]
        },
        appointmentDetails: {
          appointments: appointmentDetails,
          totalAppointments: appointmentDetails.length,
          uniqueCustomers: [...new Set(appointmentDetails.map(apt => apt.customer))]
        },
        staffSchedule: {
          appointments: staffScheduleAppointments,
          totalAppointments: staffScheduleAppointments.length,
          uniqueTexts: [...new Set(staffScheduleAppointments.map(apt => apt.text))]
        }
      };
    });
    
    console.log('📊 Calendar Data Analysis:');
    console.log('='.repeat(50));
    
    // Daily Schedule Analysis
    console.log('📋 Daily Schedule:');
    console.log(`   Total appointments: ${calendarData.dailySchedule.totalAppointments}`);
    console.log(`   Unique customers: ${calendarData.dailySchedule.uniqueCustomers.length}`);
    console.log(`   Customers: ${calendarData.dailySchedule.uniqueCustomers.join(', ')}`);
    
    // Appointment Details Analysis
    console.log('\n📋 Appointment Details:');
    console.log(`   Total appointments: ${calendarData.appointmentDetails.totalAppointments}`);
    console.log(`   Unique customers: ${calendarData.appointmentDetails.uniqueCustomers.length}`);
    console.log(`   Customers: ${calendarData.appointmentDetails.uniqueCustomers.join(', ')}`);
    
    // Staff Schedule Analysis
    console.log('\n📋 Staff Schedule Overview:');
    console.log(`   Total appointment blocks: ${calendarData.staffSchedule.totalAppointments}`);
    console.log(`   Unique texts: ${calendarData.staffSchedule.uniqueTexts.length}`);
    console.log(`   Texts: ${calendarData.staffSchedule.uniqueTexts.join(', ')}`);
    
    // Consistency Analysis
    console.log('\n🔍 Data Consistency Analysis:');
    console.log('='.repeat(50));
    
    const dailyCustomers = calendarData.dailySchedule.uniqueCustomers;
    const detailsCustomers = calendarData.appointmentDetails.uniqueCustomers;
    const staffTexts = calendarData.staffSchedule.uniqueTexts;
    
    // Check if customer names match between Daily Schedule and Appointment Details
    const customersMatch = dailyCustomers.length === detailsCustomers.length && 
                          dailyCustomers.every(customer => detailsCustomers.includes(customer));
    
    console.log(`✅ Daily Schedule vs Appointment Details customers match: ${customersMatch ? 'YES' : 'NO'}`);
    
    if (!customersMatch) {
      console.log('❌ Customer mismatch details:');
      console.log(`   Daily Schedule: ${dailyCustomers.join(', ')}`);
      console.log(`   Appointment Details: ${detailsCustomers.join(', ')}`);
    }
    
    // Check if appointment counts are consistent
    const appointmentCountsMatch = calendarData.dailySchedule.totalAppointments === calendarData.appointmentDetails.totalAppointments;
    console.log(`✅ Appointment counts match: ${appointmentCountsMatch ? 'YES' : 'NO'}`);
    
    if (!appointmentCountsMatch) {
      console.log(`❌ Count mismatch: Daily Schedule (${calendarData.dailySchedule.totalAppointments}) vs Appointment Details (${calendarData.appointmentDetails.totalAppointments})`);
    }
    
    // Check if staff schedule has reasonable data
    const staffScheduleHasData = calendarData.staffSchedule.totalAppointments > 0;
    console.log(`✅ Staff Schedule has data: ${staffScheduleHasData ? 'YES' : 'NO'}`);
    
    // Overall consistency check
    const overallConsistent = customersMatch && appointmentCountsMatch;
    console.log('\n🎯 Overall Data Consistency:');
    console.log(`   ${overallConsistent ? '✅ CONSISTENT' : '❌ INCONSISTENT'}`);
    
    if (overallConsistent) {
      console.log('🎉 All calendar views show consistent data!');
    } else {
      console.log('⚠️ Data inconsistency detected across calendar views');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'calendar-data-consistency-test-result.png', fullPage: true });
    console.log('📸 Test result screenshot saved: calendar-data-consistency-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCalendarDataConsistency().catch(console.error);
