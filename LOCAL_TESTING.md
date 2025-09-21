# Local Testing Guide

Since there might be deployment issues on Vercel, you can test the business configuration UI locally without needing a database.

## 🚀 Quick Local Setup

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Start Development Server
```bash
npm run dev
# or
yarn dev
```

### 3. Access the Business Configuration
- **Main Dashboard**: http://localhost:5173/
- **Business Config**: http://localhost:5173/business-config
- **Test Route**: http://localhost:5173/test

## 🎯 What You'll See

### Business Configuration Features:
1. **Business Type Selection**: Choose from Restaurant, Clinic, Retail, Salon
2. **Terminology Customization**: Change "Menu Item" to "Product", etc.
3. **Branding Configuration**: Pick colors and see live preview
4. **Custom Fields**: Add fields like "Dietary Restrictions", "Size", etc.

### Mock Data Available:
- **Restaurant**: Menu items, orders, dietary restrictions
- **Healthcare**: Treatments, appointments, patient records
- **Retail**: Products, sizes, colors, loyalty programs
- **Beauty Salon**: Treatments, stylists, hair types

## 🔧 No Database Required

The business configuration uses **mock API data**, so you don't need:
- ❌ Database setup
- ❌ Environment variables
- ❌ API keys
- ❌ External services

Everything works with simulated data that demonstrates the flexible business model.

## 🎨 Expected UI Flow

1. **Select Business Type** → See cards for different business types
2. **Customize Terminology** → Change language to match your business
3. **Configure Branding** → Pick colors and see live preview
4. **Add Custom Fields** → Create fields specific to your business
5. **Track Progress** → See completion percentage

## 🐛 If Local Testing Doesn't Work

If you get errors locally, it might be due to:
1. **Node version**: Ensure you're using Node 18+
2. **Dependencies**: Run `npm install` or `yarn install`
3. **Port conflicts**: Try a different port with `npm run dev -- --port 3000`

## 📱 Mobile Testing

The UI is responsive and works on mobile devices too. You can test on your phone by:
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Access: `http://YOUR_IP:5173/business-config`

This will give you the full business configuration experience without any deployment issues!