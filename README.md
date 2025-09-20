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
