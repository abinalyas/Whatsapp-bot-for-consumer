#!/usr/bin/env tsx
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { config } from "dotenv";
import * as schema from "../shared/schema";

config({ path: ".env.local" });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    const db = drizzle(client, { schema });
    
    console.log("Running migration to add default Spark Salon bot flow...");
    
    // Check if the default flow already exists
    const existingFlows = await db.query.botFlows.findMany({
      where: (botFlows, { eq }) => eq(botFlows.name, 'Spark Salon Default Flow')
    });
    
    if (existingFlows.length > 0) {
      console.log("Default Spark Salon bot flow already exists. Skipping creation.");
      return;
    }
    
    // Create the default Spark Salon bot flow
    const [newFlow] = await db.insert(schema.botFlows).values({
      name: 'Spark Salon Default Flow',
      description: 'Default bot flow for Spark Salon WhatsApp bookings',
      businessType: 'salon',
      isActive: true,
      isDefault: true,
      variables: JSON.stringify([
        { name: 'selected_service', type: 'string', description: 'The service customer selected' },
        { name: 'appointment_date', type: 'string', description: 'Preferred appointment date' },
        { name: 'appointment_time', type: 'string', description: 'Preferred appointment time' },
        { name: 'customer_name', type: 'string', description: 'Customer name for booking' }
      ])
    }).returning();
    
    if (!newFlow) {
      throw new Error("Failed to create default bot flow");
    }
    
    console.log(`Created default bot flow with ID: ${newFlow.id}`);
    
    // Create the nodes for the flow
    const nodes = [
      {
        flowId: newFlow.id,
        nodeType: 'start',
        name: 'Start',
        positionX: 100,
        positionY: 100,
        config: JSON.stringify({}),
        connections: JSON.stringify([
          {
            targetNodeId: 'welcome_msg',
            label: 'Begin'
          }
        ])
      },
      {
        flowId: newFlow.id,
        nodeType: 'message',
        name: 'Welcome Message',
        positionX: 400,
        positionY: 100,
        config: JSON.stringify({
          messageText: '👋 Welcome to Spark Salon!\n\nHere are our services:\n\n💇‍♀️ Haircut & Style - ₹800\n✨ Facial Treatment - ₹1200\n💆‍♀️ Massage Therapy - ₹1500\n\nReply with service name to book.'
        }),
        connections: JSON.stringify([
          {
            targetNodeId: 'service_question',
            label: 'Next'
          }
        ])
      },
      {
        flowId: newFlow.id,
        nodeType: 'question',
        name: 'Service Selection',
        positionX: 700,
        positionY: 100,
        config: JSON.stringify({
          questionText: 'Which service would you like to book?',
          inputType: 'text',
          variableName: 'selected_service'
        }),
        connections: JSON.stringify([
          {
            targetNodeId: 'date_question',
            label: 'Next'
          }
        ])
      },
      {
        flowId: newFlow.id,
        nodeType: 'question',
        name: 'Date Selection',
        positionX: 1000,
        positionY: 100,
        config: JSON.stringify({
          questionText: 'Please select your preferred appointment date:',
          inputType: 'date',
          variableName: 'appointment_date'
        }),
        connections: JSON.stringify([
          {
            targetNodeId: 'time_question',
            label: 'Next'
          }
        ])
      },
      {
        flowId: newFlow.id,
        nodeType: 'question',
        name: 'Time Selection',
        positionX: 1300,
        positionY: 100,
        config: JSON.stringify({
          questionText: 'Please select your preferred appointment time:',
          inputType: 'text',
          variableName: 'appointment_time'
        }),
        connections: JSON.stringify([
          {
            targetNodeId: 'customer_details',
            label: 'Next'
          }
        ])
      },
      {
        flowId: newFlow.id,
        nodeType: 'question',
        name: 'Customer Name',
        positionX: 1600,
        positionY: 100,
        config: JSON.stringify({
          questionText: 'What is your name?',
          inputType: 'text',
          variableName: 'customer_name'
        }),
        connections: JSON.stringify([
          {
            targetNodeId: 'payment_action',
            label: 'Next'
          }
        ])
      },
      {
        flowId: newFlow.id,
        nodeType: 'action',
        name: 'Payment Request',
        positionX: 1900,
        positionY: 100,
        config: JSON.stringify({
          actionType: 'create_transaction',
          actionParameters: {
            amount: 200,
            currency: 'INR',
            description: 'Spark Salon Booking Fee'
          }
        }),
        connections: JSON.stringify([
          {
            targetNodeId: 'confirmation_end',
            label: 'Payment Sent'
          }
        ])
      },
      {
        flowId: newFlow.id,
        nodeType: 'end',
        name: 'Booking Confirmed',
        positionX: 2200,
        positionY: 100,
        config: JSON.stringify({
          endMessage: '🎉 Booking Confirmed!\n\n📋 Your appointment:\n👤 {{customer_name}}\n💇‍♀️ {{selected_service}}\n📅 {{appointment_date}} at {{appointment_time}}\n\n📍 Spark Salon\n123 Beauty Street\n\nWe will send a reminder 2 hours before your appointment. Thank you! ✨'
        }),
        connections: JSON.stringify([])
      }
    ];
    
    for (const node of nodes) {
      const [createdNode] = await db.insert(schema.botFlowNodes).values(node).returning();
      console.log(`Created node: ${createdNode.name}`);
    }
    
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();