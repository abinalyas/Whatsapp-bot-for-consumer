/**
 * Test Time Parsing Logic
 * Test the time parsing logic directly
 */

function testTimeParsing() {
  console.log('🔍 Test Time Parsing Logic');
  console.log('==========================\n');
  
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)/i, // 10:30 am, 2:45 pm
    /(\d{1,2})\s*(am|pm)/i, // 10 am, 2 pm
    /(\d{1,2}):(\d{2})/i, // 10:30, 14:30
    /^(\d{1,2})$/i // Only match if it's just a number (not part of another word)
  ];
  
  const testInputs = ['9 am', '9:00 am', '09:00', '17:00', '1'];
  
  testInputs.forEach(input => {
    console.log(`\n📊 Testing input: "${input}"`);
    
    let matchedTime = null;
    for (const pattern of timePatterns) {
      const match = input.match(pattern);
      if (match) {
        console.log(`  Pattern match:`, { pattern: pattern.toString(), match: match[0], groups: match });
        
        let hour = parseInt(match[1]);
        let minute = match[2] ? parseInt(match[2]) : 0;
        const period = match[3]?.toLowerCase();
        
        console.log(`  Parsed:`, { hour, minute, period });
        
        // Convert to 24-hour format if needed
        if (period === 'pm' && hour !== 12) {
          hour += 12;
        } else if (period === 'am' && hour === 12) {
          hour = 0;
        }
        
        // Format as HH:MM
        const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        console.log(`  Formatted time: ${formattedTime}`);
        
        matchedTime = formattedTime;
        break; // Stop at first match
      }
    }
    
    if (matchedTime) {
      console.log(`  ✅ Final result: ${matchedTime}`);
    } else {
      console.log(`  ❌ No match found`);
    }
  });
}

testTimeParsing();
