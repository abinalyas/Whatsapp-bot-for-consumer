# Overview

Spark Salon WhatsApp Bot is a comprehensive prototype application that enables salon service bookings through WhatsApp using the Meta WhatsApp Cloud API. The system provides an automated conversation flow where customers can view services, select options, make payments via UPI, and receive booking confirmations. It includes a modern dashboard for monitoring bot activity, managing services, and tracking revenue in real-time.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built with **React** and **TypeScript**, utilizing **Vite** as the build tool for fast development and optimized production builds. The UI components are built with **shadcn/ui** (a collection of Radix UI primitives) styled with **Tailwind CSS** for consistent design and accessibility.

**State Management**: Uses **TanStack Query** (React Query) for server state management, providing caching, synchronization, and background updates. Client-side routing is handled by **wouter** for lightweight navigation.

**Component Structure**: The dashboard features modular components including activity feeds, service panels, bot configuration, chat previews, and statistical displays. Components are designed to be reusable and follow React best practices with proper TypeScript typing.

## Backend Architecture
The server is built with **Node.js** and **Express.js**, following a RESTful API design pattern. The application uses an **in-memory storage system** (MemStorage class) that implements a standardized IStorage interface, making it easily replaceable with a database solution.

**Webhook Integration**: Implements both GET and POST endpoints for WhatsApp webhook verification and message processing. The system handles incoming message parsing, conversation state management, and automated responses.

**Service Management**: Provides CRUD operations for salon services, conversation tracking, message logging, and booking management through well-defined API endpoints.

## Data Storage Solutions
Currently uses **in-memory storage** for rapid prototyping and development. The system is architected with **Drizzle ORM** and **PostgreSQL** schemas defined, indicating preparation for production database integration. The storage layer abstracts data operations through interfaces, allowing seamless migration to persistent storage.

**Schema Design**: Defines tables for services, conversations, messages, and bookings with proper relationships and constraints. Includes fields for tracking conversation states, payment status, and customer information.

## Authentication and Authorization
The current implementation focuses on WhatsApp API token-based authentication for external service integration. The system uses environment variables for secure credential management including WhatsApp tokens, phone number IDs, and webhook verification tokens.

## Conversation Flow Management
Implements a **state machine pattern** for managing customer conversation flows:
- **Greeting State**: Initial welcome and service display
- **Service Selection**: Processing customer service choices
- **Payment**: UPI link generation and payment confirmation
- **Booking Confirmation**: Final confirmation and booking creation

The system tracks conversation states and handles user inputs intelligently, providing appropriate responses based on the current interaction context.

# External Dependencies

## WhatsApp Cloud API Integration
- **Meta WhatsApp Cloud API**: Core messaging functionality using Graph API v17.0
- **Webhook Configuration**: Handles real-time message events from Meta's servers
- **Message Processing**: Parses incoming JSON payloads and sends formatted responses
- **Token Management**: Uses permanent access tokens and phone number IDs for API authentication

## Payment Integration
- **UPI Protocol**: Generates deep links for seamless mobile payments using standardized UPI format
- **Payment Confirmation**: Implements mock payment verification system for prototype functionality
- **Multi-wallet Support**: Compatible with GPay, PhonePe, Paytm, and other UPI-enabled applications

## Development and Database Infrastructure
- **Neon Database**: PostgreSQL hosting service configured through Drizzle ORM
- **Environment Configuration**: Comprehensive environment variable management for different deployment stages
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Font Awesome**: Icon library for consistent UI iconography

## Deployment and Monitoring
The application is structured for deployment on modern hosting platforms with proper static asset serving, API routing, and webhook endpoint exposure for Meta's webhook verification process.