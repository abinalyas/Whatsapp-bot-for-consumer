/**
 * Test New Time Logic
 * Test the new time selection logic directly
 */

function testNewTimeLogic() {
  console.log('🔍 Test New Time Logic');
  console.log('======================\n');
  
  // Simulate available slots
  const availableSlots = [
    { time: '09:00', available: true },
    { time: '10:00', available: true },
    { time: '11:00', available: true },
    { time: '12:00', available: true },
    { time: '13:00', available: true },
    { time: '14:00', available: true },
    { time: '15:00', available: true },
    { time: '16:00', available: true },
    { time: '17:00', available: true }
  ];
  
  // Simulate the new parseTimeFromText function
  function parseTimeFromText(input, availableSlots) {
    // Remove extra spaces and normalize
    const normalizedInput = input.replace(/\s+/g, ' ').trim();
    
    console.log(`\n📊 Testing input: "${input}" -> normalized: "${normalizedInput}"`);
    
    // Direct time format matching (most reliable)
    for (const slot of availableSlots) {
      // Check exact matches first
      if (normalizedInput === slot.time.toLowerCase()) {
        console.log(`  ✅ Exact match: ${slot.time}`);
        return slot.time;
      }
      
      // Check without colon
      if (normalizedInput === slot.time.replace(':', '').toLowerCase()) {
        console.log(`  ✅ Match without colon: ${slot.time}`);
        return slot.time;
      }
      
      // Check with different separators
      if (normalizedInput === slot.time.replace(':', ' ').toLowerCase()) {
        console.log(`  ✅ Match with space: ${slot.time}`);
        return slot.time;
      }
    }
    
    // Parse 12-hour format with AM/PM
    const amPmMatch = normalizedInput.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (amPmMatch) {
      console.log(`  🔍 AM/PM match found:`, amPmMatch);
      let hour = parseInt(amPmMatch[1]);
      const minute = amPmMatch[2] ? parseInt(amPmMatch[2]) : 0;
      const period = amPmMatch[3].toLowerCase();
      
      console.log(`  🔍 Parsed: hour=${hour}, minute=${minute}, period=${period}`);
      
      // Convert to 24-hour format
      if (period === 'pm' && hour !== 12) {
        hour += 12;
      } else if (period === 'am' && hour === 12) {
        hour = 0;
      }
      
      const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      console.log(`  🔍 Formatted time: ${formattedTime}`);
      
      // Check if this time is available
      for (const slot of availableSlots) {
        if (slot.time === formattedTime) {
          console.log(`  ✅ Found matching slot: ${slot.time}`);
          return slot.time;
        }
      }
    }
    
    // Parse 24-hour format
    const time24Match = normalizedInput.match(/^(\d{1,2})(?::(\d{2}))?$/);
    if (time24Match) {
      console.log(`  🔍 24-hour match found:`, time24Match);
      let hour = parseInt(time24Match[1]);
      const minute = time24Match[2] ? parseInt(time24Match[2]) : 0;
      
      console.log(`  🔍 Parsed: hour=${hour}, minute=${minute}`);
      
      // Ensure hour is in valid range
      if (hour >= 0 && hour <= 23) {
        const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        console.log(`  🔍 Formatted time: ${formattedTime}`);
        
        // Check if this time is available
        for (const slot of availableSlots) {
          if (slot.time === formattedTime) {
            console.log(`  ✅ Found matching slot: ${slot.time}`);
            return slot.time;
          }
        }
      }
    }
    
    // Try partial matching for common cases
    const hourMatch = normalizedInput.match(/^(\d{1,2})$/);
    if (hourMatch) {
      console.log(`  🔍 Hour-only match found:`, hourMatch);
      const hour = parseInt(hourMatch[1]);
      
      // Try as 24-hour format first
      if (hour >= 0 && hour <= 23) {
        const formattedTime = `${hour.toString().padStart(2, '0')}:00`;
        console.log(`  🔍 Trying 24-hour format: ${formattedTime}`);
        for (const slot of availableSlots) {
          if (slot.time === formattedTime) {
            console.log(`  ✅ Found matching slot: ${slot.time}`);
            return slot.time;
          }
        }
      }
      
      // Try as 12-hour format (AM)
      if (hour >= 1 && hour <= 12) {
        const formattedTime = `${hour.toString().padStart(2, '0')}:00`;
        console.log(`  🔍 Trying 12-hour format (AM): ${formattedTime}`);
        for (const slot of availableSlots) {
          if (slot.time === formattedTime) {
            console.log(`  ✅ Found matching slot: ${slot.time}`);
            return slot.time;
          }
        }
      }
    }
    
    console.log(`  ❌ No match found`);
    return null;
  }
  
  // Test various inputs
  const testInputs = ['9 am', '9:00 am', '09:00', '9', '17:00', '1'];
  
  testInputs.forEach(input => {
    const result = parseTimeFromText(input, availableSlots);
    console.log(`\n🎯 Final result for "${input}": ${result || 'NO MATCH'}`);
  });
}

testNewTimeLogic();
