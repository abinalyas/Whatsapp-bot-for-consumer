# WhatsApp Webhook Troubleshooting Guide

## Common Issues & Solutions

### 1. **Test Your Webhook URL First**

Before configuring in Facebook, test your webhook manually:

```
https://your-vercel-app.vercel.app/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=YOUR_VERIFY_TOKEN
```

**Expected Response:** `test123`

### 2. **Check Environment Variables in Vercel**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Ensure you have:
- `WHATSAPP_VERIFY_TOKEN` = exactly the same token you use in Facebook
- `WHATSAPP_PHONE_ID` = your phone number ID
- `WHATSAPP_TOKEN` = your access token

**Important:** After adding env vars, redeploy your app!

### 3. **Common Mistakes**

❌ **Wrong verify token**: Token in Vercel ≠ Token in Facebook
❌ **Extra spaces**: `"mytoken "` vs `"mytoken"`
❌ **Case sensitivity**: `"MyToken"` vs `"mytoken"`
❌ **Not redeployed**: Added env vars but didn't redeploy

### 4. **Debug Steps**

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Functions tab
   - Look for webhook verification logs

2. **Test with curl**:
   ```bash
   curl "https://your-app.vercel.app/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_token"
   ```

3. **Check Response**:
   - Should return the challenge value
   - Status should be 200

### 5. **Facebook Configuration**

In Facebook Developer Console:
- **Callback URL**: `https://your-app.vercel.app/webhook`
- **Verify Token**: Exact same as `WHATSAPP_VERIFY_TOKEN` in Vercel
- **Webhook Fields**: Subscribe to `messages`

### 6. **Still Not Working?**

Try these steps:
1. Use a simple verify token like `test123`
2. Update both Vercel env var and Facebook
3. Redeploy your Vercel app
4. Test the URL manually first
5. Then try Facebook verification

### 7. **Example Working Setup**

**Vercel Environment Variables:**
```
WHATSAPP_VERIFY_TOKEN=mysecuretoken123
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxx
```

**Facebook Webhook Config:**
```
Callback URL: https://myapp.vercel.app/webhook
Verify Token: mysecuretoken123
```

**Test URL:**
```
https://myapp.vercel.app/webhook?hub.mode=subscribe&hub.challenge=hello&hub.verify_token=mysecuretoken123
```
Should return: `hello`