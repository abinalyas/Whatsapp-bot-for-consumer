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

Vercel will automatically run `npm run build` and then `npm start` to serve your application.

The build process creates a `dist/` folder with both your frontend assets and backend server code. The `vercel.json` configuration file ensures that all routes are properly handled by your Express server.

### Troubleshooting Vercel Deployment

If you encounter deployment errors related to `@rollup/rollup-linux-x64-gnu` or similar module not found errors, try these solutions:

1. In your Vercel project settings, override the build command to use `npm run vercel-build`
2. This special build command completely avoids Vite and rollup by only building the backend API server
3. Add these environment variables in your Vercel project settings:
   - `NODE_ENV=production`

This approach builds only the backend server without the frontend, which completely avoids the rollup dependency issues. The backend API will still work correctly, but the frontend dashboard will not be available through this deployment.

If you want to deploy the full application with the frontend:
1. First deploy the backend API using this simplified approach
2. Then deploy the frontend separately using a static site deployment from the `dist/public` directory after building it locally

If you're still having issues:
1. Try removing `package-lock.json` and `node_modules` and reinstalling dependencies
2. Clear your Vercel build cache
3. Make sure you're using Node.js 18.x or higher in your Vercel settings