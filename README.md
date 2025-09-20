# Spark Salon WhatsApp Bot

A WhatsApp bot prototype for Spark Salon that handles service bookings and UPI payment integration using the WhatsApp Cloud API.

## Features

- **WhatsApp Integration**: Complete webhook setup for Meta WhatsApp Cloud API
- **Service Management**: Manage salon services (Haircut, Facial, Massage) with pricing
- **Conversation Flow**: Automated greeting → service selection → payment → confirmation
- **UPI Payment Links**: Generate UPI deep links for seamless payments
- **Dashboard**: Monitor bot activity, bookings, and revenue in real-time
- **Mock Payment Confirmation**: Handle "paid" confirmation messages

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query
- **Database**: In-memory storage (easily replaceable with real database)
- **External APIs**: WhatsApp Cloud API, UPI protocol

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd spark-salon-whatsapp-bot
npm install
```

### 2. Run locally

- **Development mode**:
  ```bash
  npm run dev
  ```

- **Production mode**:
  ```bash
  npm run build
  npm start
  ```

## Deployment to Vercel

This application can be deployed to Vercel with minimal configuration. Follow these steps:

1. Build the project locally:
   ```bash
   npm run build
   ```

2. Push your code including the `dist` and `public` folders to a GitHub repository

3. Create a new project on Vercel and import your repository

4. Vercel will automatically detect it as a hybrid project (static site + serverless functions)

5. Configure the following environment variables in your Vercel project settings:
   - `NODE_ENV=production`
   - `WHATSAPP_TOKEN=your_whatsapp_token`
   - `PHONE_NUMBER_ID=your_phone_number_id`
   - Any other environment variables required

6. Deploy the project

The build process creates:
- A `public/` folder with frontend assets (HTML, CSS, JS)
- A `dist/` folder with the backend server code

Vercel will automatically:
- Serve static files from the `public/` folder
- Route API requests to `/api/*` and `/webhook` to the serverless function

### Troubleshooting Vercel Deployment

If you encounter deployment errors:

1. Make sure you build the project locally with `npm run build` before deploying
2. Ensure both the `dist` and `public` folders are included in your repository
3. The pre-built approach avoids Vercel build issues by not requiring dependency installation

If you're still having issues:
1. Try removing `package-lock.json` and `node_modules` and reinstalling dependencies
2. Clear your Vercel build cache
3. Make sure you're using Node.js 18.x or higher in your Vercel settings