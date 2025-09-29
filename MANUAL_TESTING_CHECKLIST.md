# Manual Testing Checklist for Salon Dashboard

## 🎯 Quick Actions Testing

### ✅ Quick Book Modal
- [ ] Open Overview page
- [ ] Click "Quick Book" button
- [ ] Verify modal opens with form fields
- [ ] Check Service dropdown is populated with real services
- [ ] Check Staff dropdown is populated with real staff members
- [ ] Fill in customer details (name, phone, email)
- [ ] Select a service and staff member
- [ ] Set date (default should be today)
- [ ] Set time
- [ ] Click "Book Appointment"
- [ ] Verify success message
- [ ] Check if appointment appears in calendar/overview

### ✅ Check In Modal
- [ ] Click "Check In" button
- [ ] Verify modal opens
- [ ] Check appointment dropdown shows pending/confirmed appointments
- [ ] Select an appointment
- [ ] Add check-in notes
- [ ] Click "Check In Customer"
- [ ] Verify success message
- [ ] Check appointment status changed to "checked-in"

### ✅ Process Payment Modal
- [ ] Click "Process Payment" button
- [ ] Verify modal opens
- [ ] Check appointment dropdown shows checked-in appointments
- [ ] Select an appointment
- [ ] Enter payment amount (should auto-calculate)
- [ ] Add tip amount
- [ ] Select payment method
- [ ] Click "Process Payment"
- [ ] Verify success message
- [ ] Check appointment status changed to "completed"

### ✅ Send Reminders Modal
- [ ] Click "Send Reminders" button
- [ ] Verify modal opens
- [ ] Select reminder type (Today, Tomorrow, This Week)
- [ ] Check appointment count updates
- [ ] Verify appointment list shows correct appointments
- [ ] Click "Send Reminders"
- [ ] Verify success message

### ✅ View Schedule Modal
- [ ] Click "View Schedule" button
- [ ] Verify modal opens
- [ ] Check staff schedules are displayed
- [ ] Verify appointments are shown for each staff member
- [ ] Check appointment details (time, customer, service)
- [ ] Verify color coding for appointment status

### ✅ Walk-in Modal
- [ ] Click "Walk-in" button
- [ ] Verify modal opens
- [ ] Fill in customer details
- [ ] Select service and staff
- [ ] Set time (should default to current time + 15 min)
- [ ] Click "Check Availability"
- [ ] Click "Book Walk-in"
- [ ] Verify success message

### ✅ Daily Summary Modal
- [ ] Click "Daily Summary" button
- [ ] Verify modal opens
- [ ] Check today's metrics are displayed:
  - [ ] Total appointments count
  - [ ] Completed appointments count
  - [ ] Pending appointments count
  - [ ] Total revenue amount
- [ ] Check top services list
- [ ] Check staff performance list
- [ ] Verify all data is real (not hardcoded)

## 🎯 Edit Appointment Testing

### ✅ Overview Page Edit Appointment
- [ ] Go to Overview page
- [ ] Find "Today's Appointments" table
- [ ] Click "Edit" button on any appointment
- [ ] Verify modal opens
- [ ] Check all fields are pre-populated:
  - [ ] Customer name
  - [ ] Phone number
  - [ ] Email
  - [ ] Service (dropdown should show selected service)
  - [ ] Staff member (dropdown should show selected staff)
  - [ ] Date
  - [ ] Time (should be in correct format)
  - [ ] Status
  - [ ] Notes
- [ ] Make changes to fields
- [ ] Click "Save Changes"
- [ ] Verify success message
- [ ] Check if changes are reflected in the table

### ✅ Calendar Page Edit Appointment
- [ ] Go to Calendar page
- [ ] Click on any appointment in the calendar
- [ ] Click "Edit" button in appointment details
- [ ] Verify modal opens
- [ ] Check all fields are pre-populated (same as above)
- [ ] Make changes to fields
- [ ] Click "Save Changes"
- [ ] Verify success message
- [ ] Check if changes are reflected in the calendar

## 🎯 Data Loading Testing

### ✅ Overview Page Data
- [ ] Check overview cards show real data:
  - [ ] Total appointments (not 0 or hardcoded)
  - [ ] Today's revenue (not $0 or hardcoded)
  - [ ] Pending appointments count
  - [ ] Staff count
- [ ] Check "Today's Appointments" table:
  - [ ] Shows real appointments
  - [ ] Customer names are populated
  - [ ] Service names are populated
  - [ ] Staff names are populated (not "Unassigned")
  - [ ] Times are displayed correctly

### ✅ Calendar Page Data
- [ ] Check calendar shows appointments
- [ ] Verify appointment details show:
  - [ ] Customer name (not "N/A")
  - [ ] Service name (not "service")
  - [ ] Staff name (not "Unassigned")
  - [ ] Time is displayed correctly
- [ ] Check daily schedule view shows appointments
- [ ] Verify timeline view shows appointments and free slots

### ✅ Services Page Data
- [ ] Check services list shows real services
- [ ] Verify service details:
  - [ ] Name
  - [ ] Price (in ₹, not $)
  - [ ] Duration
  - [ ] Category
- [ ] Test service availability toggle
- [ ] Check add new service functionality

### ✅ Staff Page Data
- [ ] Check staff list shows real staff members
- [ ] Verify staff details:
  - [ ] Name
  - [ ] Role
  - [ ] Phone number
  - [ ] Email
  - [ ] Working days highlighted
- [ ] Check staff performance metrics

## 🎯 UI/UX Testing

### ✅ Responsive Design
- [ ] Test on desktop (1280x720)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify modals are responsive
- [ ] Check sidebar collapse functionality

### ✅ Navigation
- [ ] Test sidebar navigation
- [ ] Verify active page highlighting
- [ ] Test quick actions accessibility
- [ ] Check breadcrumb navigation

### ✅ Form Validation
- [ ] Test required field validation
- [ ] Check email format validation
- [ ] Test phone number validation
- [ ] Verify date/time validation
- [ ] Check error message display

## 🎯 Performance Testing

### ✅ Loading Speed
- [ ] Check initial page load time
- [ ] Test modal opening speed
- [ ] Verify data loading indicators
- [ ] Check API response times

### ✅ Error Handling
- [ ] Test network error scenarios
- [ ] Check invalid data handling
- [ ] Verify error message display
- [ ] Test retry mechanisms

## 🎯 Browser Compatibility

### ✅ Chrome
- [ ] Test all functionality in Chrome
- [ ] Check console for errors
- [ ] Verify responsive design

### ✅ Firefox
- [ ] Test all functionality in Firefox
- [ ] Check console for errors
- [ ] Verify responsive design

### ✅ Safari
- [ ] Test all functionality in Safari
- [ ] Check console for errors
- [ ] Verify responsive design

## 🎯 Security Testing

### ✅ Data Validation
- [ ] Test SQL injection attempts
- [ ] Check XSS prevention
- [ ] Verify input sanitization
- [ ] Test file upload security

### ✅ Authentication
- [ ] Check tenant isolation
- [ ] Verify API access control
- [ ] Test session management

## 📋 Test Results Template

```
Test Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

Quick Actions:
- Quick Book: ✅/❌
- Check In: ✅/❌
- Process Payment: ✅/❌
- Send Reminders: ✅/❌
- View Schedule: ✅/❌
- Walk-in: ✅/❌
- Daily Summary: ✅/❌

Edit Appointment:
- Overview Edit: ✅/❌
- Calendar Edit: ✅/❌

Data Loading:
- Overview Data: ✅/❌
- Calendar Data: ✅/❌
- Services Data: ✅/❌
- Staff Data: ✅/❌

Issues Found:
1. ________________
2. ________________
3. ________________

Overall Status: ✅ PASS / ❌ FAIL
```

## 🚀 Quick Test Commands

```bash
# Run automated API tests
npm run test:deployed

# Run comprehensive automation tests
npm run test:automation

# Run UI automation tests (requires Puppeteer)
npm run test:ui
```

## 📱 Test URLs

- **Production**: https://whatsapp-bot-for-consumer-num9fgy3b-abinalyas-projects.vercel.app
- **Local Development**: http://localhost:5000

## 🎯 Priority Test Cases

1. **Critical**: Quick Actions modals functionality
2. **Critical**: Edit appointment functionality
3. **High**: Data loading and display
4. **High**: Form validation and error handling
5. **Medium**: UI responsiveness
6. **Medium**: Performance and loading times
7. **Low**: Browser compatibility
8. **Low**: Security testing
