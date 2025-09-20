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

1. Push your code to a GitHub repository (including the new [vercel.json](file:///Users/abinalias/Documents/Whatsapp-bot-for-consumer/vercel.json) file)
2. Create a new project on Vercel and import your repository
3. Vercel will automatically detect it as a Node.js project
4. Configure the following environment variables in your Vercel project settings:
   - `NODE_ENV=production`
   - Any other environment variables required for WhatsApp integration (e.g., `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, etc.)

The [vercel.json](file:///Users/abinalias/Documents/Whatsapp-bot-for-consumer/vercel.json) configuration file tells Vercel to directly use the [server/index.vercel.ts](file:///Users/abinalias/Documents/Whatsapp-bot-for-consumer/server/index.vercel.ts) file which doesn't include any Vite dependencies.

### Troubleshooting Vercel Deployment

If you encounter deployment errors related to `@rollup/rollup-linux-x64-gnu` or similar module not found errors:

1. Make sure your [vercel.json](file:///Users/abinalias/Documents/Whatsapp-bot-for-consumer/vercel.json) is configured to use [server/index.vercel.ts](file:///Users/abinalias/Documents/Whatsapp-bot-for-consumer/server/index.vercel.ts) directly
2. This approach completely avoids the rollup dependency issue by using a separate server entry point that doesn't use Vite at all

If you're still having issues:
1. Try removing `package-lock.json` and `node_modules` and reinstalling dependencies
2. Clear your Vercel build cache
3. Make sure you're using Node.js 18.x or higher in your Vercel settings