# Dashboard Functionality Testing Guide

## 🎯 **New API Endpoints Added:**

### **Services Management:**
- ✅ `GET /api/services` - List all services
- ✅ `POST /api/services` - Create new service
- ✅ `PATCH /api/services/:id` - Update service
- ✅ `DELETE /api/services/:id` - Delete service

### **Bookings Management:**
- ✅ `GET /api/bookings` - List all bookings
- ✅ `PATCH /api/bookings/:id` - Update booking status (confirm/cancel)

### **Settings Management:**
- ✅ `GET /api/settings` - Get UPI ID and business settings
- ✅ `PATCH /api/settings` - Update UPI ID and business name

## 🧪 **Test Dashboard Features:**

### **1. Add New Service:**
```bash
curl -X POST https://whatsapp-bot-for-consumer.vercel.app/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hair Wash",
    "description": "Professional hair wash and conditioning",
    "duration": 20,
    "price": 150,
    "isActive": true
  }'
```

### **2. Update Service:**
```bash
curl -X PATCH https://whatsapp-bot-for-consumer.vercel.app/api/services/SERVICE_ID \
  -H "Content-Type: application/json" \
  -d '{"price": 180}'
```

### **3. Confirm Booking:**
```bash
curl -X PATCH https://whatsapp-bot-for-consumer.vercel.app/api/bookings/BOOKING_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

### **4. Cancel Booking:**
```bash
curl -X PATCH https://whatsapp-bot-for-consumer.vercel.app/api/bookings/BOOKING_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

### **5. Update UPI ID:**
```bash
curl -X PATCH https://whatsapp-bot-for-consumer.vercel.app/api/settings \
  -H "Content-Type: application/json" \
  -d '{"upiId": "newsalon@paytm", "businessName": "New Salon Name"}'
```

## 🎯 **Dashboard Features Now Working:**

### **Services Section:**
- ✅ **Add Service Button** - Creates new service
- ✅ **Edit Service** - Updates service details
- ✅ **Delete Service** - Removes service
- ✅ **Toggle Active/Inactive** - Updates service status

### **Bookings Section:**
- ✅ **Confirm Button** - Changes status to "confirmed"
- ✅ **Cancel Button** - Changes status to "cancelled"
- ✅ **View Details** - Shows full booking information

### **Settings Section:**
- ✅ **Edit UPI ID** - Updates payment details
- ✅ **Edit Business Name** - Updates salon name
- ✅ **Save Settings** - Persists changes

## 🔄 **Real-time Updates:**

All changes should reflect immediately:
- New services appear in WhatsApp bot menu
- Booking status changes update analytics
- Settings changes affect payment links

## 🚀 **Test Complete Flow:**

1. **Add a new service** via dashboard
2. **Send WhatsApp message** "hi" - should show new service
3. **Book the new service** via WhatsApp
4. **Confirm booking** via dashboard
5. **Check analytics** - should update revenue and counts