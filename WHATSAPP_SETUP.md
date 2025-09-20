# WhatsApp Bot Setup Guide

## Step 1: Meta for Developers Setup

1. **Create/Access App**:
   - Go to https://developers.facebook.com/apps/
   - Create new app or select existing
   - Choose "Business" type

2. **Add WhatsApp Product**:
   - In app dashboard, click "Add Product"
   - Select "WhatsApp" → "Set up"

3. **Get Credentials**:
   - Go to WhatsApp → API Setup
   - Copy **Phone Number ID** (from the "From" section)
   - Generate and copy **Access Token**
   - Create your own **Verify Token** (any secure string)

## Step 2: Configure Webhook

1. **In WhatsApp API Setup**:
   - Webhook URL: `https://your-vercel-app.vercel.app/webhook`
   - Verify Token: Use the same token you set in Vercel env vars
   - Subscribe to: `messages` field

2. **Test Webhook**:
   - Click "Verify and save"
   - Should show green checkmark if successful

## Step 3: Test Your Bot

1. **Send test message** to your WhatsApp Business number
2. **Available commands**:
   - `hi` or `hello` - Get welcome message
   - `services` - View available services
   - `book [service]` - Book a service
   - `bookings` - View your bookings
   - `cancel [booking_id]` - Cancel a booking
   - `help` - Get help message

## Step 4: Monitor Dashboard

- Visit your Vercel app URL to see the dashboard
- View conversations, bookings, and analytics
- All data is stored in memory (resets on deployment)

## Troubleshooting

- Check Vercel function logs for errors
- Verify environment variables are set
- Test webhook URL responds to GET requests
- Ensure phone number is verified in Meta console