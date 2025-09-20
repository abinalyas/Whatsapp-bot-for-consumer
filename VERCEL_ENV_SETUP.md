# Vercel Environment Variables Setup

Go to your Vercel project dashboard → Settings → Environment Variables

Add these variables:

## Required WhatsApp API Variables:

1. **WHATSAPP_PHONE_ID**
   - Value: Your WhatsApp Business Phone Number ID from Meta
   - Example: `123456789012345`

2. **WHATSAPP_TOKEN**
   - Value: Your WhatsApp Access Token from Meta
   - Example: `EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. **WHATSAPP_VERIFY_TOKEN**
   - Value: A random string you create for webhook verification
   - Example: `my_secure_verify_token_123`

## How to get these values:

### From Meta for Developers Console:
1. Go to https://developers.facebook.com/apps/
2. Select your app → WhatsApp → API Setup
3. **Phone Number ID**: Found in the "From" phone number section
4. **Access Token**: Click "Generate" next to the phone number
5. **Verify Token**: You create this yourself (any secure string)

### Set in Vercel:
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add each variable with Production environment selected
4. Redeploy your app after adding variables