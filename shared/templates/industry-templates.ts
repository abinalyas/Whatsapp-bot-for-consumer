/**
 * Industry-Specific Bot Flow Templates
 * Pre-built templates for different business types
 */

import { BotFlow } from '../types/bot-flow.types';

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  icon: string;
  flow: BotFlow;
  features: string[];
  useCases: string[];
}

export const industryTemplates: IndustryTemplate[] = [
  {
    id: 'salon_template',
    name: '💇‍♀️ Salon & Beauty',
    description: 'Complete booking flow for salons, spas, and beauty services',
    industry: 'beauty',
    icon: '💇‍♀️',
    features: ['Service Selection', 'Stylist Booking', 'Time Slots', 'Payment Collection'],
    useCases: ['Hair Salons', 'Nail Salons', 'Spa Services', 'Beauty Clinics'],
    flow: {
      id: 'salon_template',
      name: 'Salon Booking Flow',
      description: 'Complete salon booking experience',
      businessType: 'salon',
      isActive: true,
      isTemplate: true,
      version: '1.0.0',
      nodes: [
        {
          id: 'welcome',
          type: 'service_message',
          name: 'Welcome & Services',
          position: { x: 100, y: 100 },
          configuration: {
            welcomeText: '👋 Welcome to our salon!',
            serviceIntro: 'Here are our services:',
            instruction: 'Reply with the number or name of the service to book.',
            showEmojis: true,
            loadFromDatabase: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'stylist_selection',
          type: 'question',
          name: 'Stylist Selection',
          position: { x: 400, y: 100 },
          configuration: {
            question: 'Which stylist would you prefer?',
            inputType: 'service',
            loadFromDatabase: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'date_selection',
          type: 'date_picker',
          name: 'Date Selection',
          position: { x: 700, y: 100 },
          configuration: {
            minDate: new Date().toISOString().split('T')[0],
            maxDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            availableDays: [0, 1, 2, 3, 4, 5, 6]
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'time_selection',
          type: 'time_slots',
          name: 'Time Selection',
          position: { x: 1000, y: 100 },
          configuration: {
            timeSlots: [
              { start: '09:00', end: '10:00' },
              { start: '10:30', end: '11:30' },
              { start: '12:00', end: '13:00' },
              { start: '14:00', end: '15:00' },
              { start: '15:30', end: '16:30' },
              { start: '17:00', end: '18:00' }
            ]
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'booking_summary',
          type: 'booking_summary',
          name: 'Booking Summary',
          position: { x: 1300, y: 100 },
          configuration: {
            template: '📋 **Booking Summary**\n\n🎯 **Service:** {selectedService}\n👨‍💼 **Stylist:** {selectedStylist}\n📅 **Date:** {selectedDate}\n🕐 **Time:** {selectedTime}\n💰 **Price:** ₹{price}\n\nPlease confirm your booking by replying "CONFIRM" or "YES".',
            fallbackMessage: 'Please contact us to complete your booking.'
          },
          connections: [],
          metadata: {}
        }
      ],
      connections: [],
      variables: [],
      metadata: {}
    }
  },
  {
    id: 'clinic_template',
    name: '🏥 Medical Clinic',
    description: 'Appointment booking for medical clinics and healthcare providers',
    industry: 'healthcare',
    icon: '🏥',
    features: ['Doctor Selection', 'Appointment Types', 'Insurance Verification', 'Reminders'],
    useCases: ['General Practice', 'Specialist Clinics', 'Dental Offices', 'Mental Health'],
    flow: {
      id: 'clinic_template',
      name: 'Medical Appointment Flow',
      description: 'Complete medical appointment booking',
      businessType: 'clinic',
      isActive: true,
      isTemplate: true,
      version: '1.0.0',
      nodes: [
        {
          id: 'welcome',
          type: 'service_message',
          name: 'Welcome & Services',
          position: { x: 100, y: 100 },
          configuration: {
            welcomeText: '🏥 Welcome to our medical clinic!',
            serviceIntro: 'Here are our available services:',
            instruction: 'Reply with the number or name of the service to book.',
            showEmojis: true,
            loadFromDatabase: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'doctor_selection',
          type: 'question',
          name: 'Doctor Selection',
          position: { x: 400, y: 100 },
          configuration: {
            question: 'Which doctor would you prefer?',
            inputType: 'service',
            loadFromDatabase: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'appointment_type',
          type: 'question',
          name: 'Appointment Type',
          position: { x: 700, y: 100 },
          configuration: {
            question: 'What type of appointment do you need?',
            inputType: 'text',
            required: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'date_selection',
          type: 'date_picker',
          name: 'Date Selection',
          position: { x: 1000, y: 100 },
          configuration: {
            minDate: new Date().toISOString().split('T')[0],
            maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            availableDays: [0, 1, 2, 3, 4, 5, 6]
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'time_selection',
          type: 'time_slots',
          name: 'Time Selection',
          position: { x: 1300, y: 100 },
          configuration: {
            timeSlots: [
              { start: '09:00', end: '10:00' },
              { start: '10:30', end: '11:30' },
              { start: '12:00', end: '13:00' },
              { start: '14:00', end: '15:00' },
              { start: '15:30', end: '16:30' },
              { start: '17:00', end: '18:00' }
            ]
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'insurance_verification',
          type: 'question',
          name: 'Insurance Verification',
          position: { x: 1600, y: 100 },
          configuration: {
            question: 'Do you have insurance coverage? (Yes/No)',
            inputType: 'text',
            required: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'booking_summary',
          type: 'booking_summary',
          name: 'Booking Summary',
          position: { x: 1900, y: 100 },
          configuration: {
            template: '📋 **Appointment Summary**\n\n👨‍⚕️ **Doctor:** {selectedDoctor}\n🏥 **Service:** {selectedService}\n📅 **Date:** {selectedDate}\n🕐 **Time:** {selectedTime}\n💳 **Insurance:** {insuranceStatus}\n\nPlease confirm your appointment by replying "CONFIRM" or "YES".',
            fallbackMessage: 'Please contact us to complete your appointment booking.'
          },
          connections: [],
          metadata: {}
        }
      ],
      connections: [],
      variables: [],
      metadata: {}
    }
  },
  {
    id: 'restaurant_template',
    name: '🍽️ Restaurant',
    description: 'Table reservation system for restaurants and dining establishments',
    industry: 'hospitality',
    icon: '🍽️',
    features: ['Table Selection', 'Party Size', 'Special Requests', 'Confirmation'],
    useCases: ['Fine Dining', 'Casual Restaurants', 'Cafes', 'Event Venues'],
    flow: {
      id: 'restaurant_template',
      name: 'Restaurant Reservation Flow',
      description: 'Complete restaurant reservation system',
      businessType: 'restaurant',
      isActive: true,
      isTemplate: true,
      version: '1.0.0',
      nodes: [
        {
          id: 'welcome',
          type: 'service_message',
          name: 'Welcome & Services',
          position: { x: 100, y: 100 },
          configuration: {
            welcomeText: '🍽️ Welcome to our restaurant!',
            serviceIntro: 'Here are our dining options:',
            instruction: 'Reply with the number or name of the service to book.',
            showEmojis: true,
            loadFromDatabase: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'party_size',
          type: 'question',
          name: 'Party Size',
          position: { x: 400, y: 100 },
          configuration: {
            question: 'How many people will be dining?',
            inputType: 'number',
            required: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'date_selection',
          type: 'date_picker',
          name: 'Date Selection',
          position: { x: 700, y: 100 },
          configuration: {
            minDate: new Date().toISOString().split('T')[0],
            maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            availableDays: [0, 1, 2, 3, 4, 5, 6]
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'time_selection',
          type: 'time_slots',
          name: 'Time Selection',
          position: { x: 1000, y: 100 },
          configuration: {
            timeSlots: [
              { start: '12:00', end: '13:00' },
              { start: '13:30', end: '14:30' },
              { start: '15:00', end: '16:00' },
              { start: '18:00', end: '19:00' },
              { start: '19:30', end: '20:30' },
              { start: '21:00', end: '22:00' }
            ]
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'special_requests',
          type: 'question',
          name: 'Special Requests',
          position: { x: 1300, y: 100 },
          configuration: {
            question: 'Any special requests or dietary restrictions?',
            inputType: 'text',
            required: false
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'booking_summary',
          type: 'booking_summary',
          name: 'Booking Summary',
          position: { x: 1600, y: 100 },
          configuration: {
            template: '📋 **Reservation Summary**\n\n🍽️ **Service:** {selectedService}\n👥 **Party Size:** {partySize}\n📅 **Date:** {selectedDate}\n🕐 **Time:** {selectedTime}\n📝 **Special Requests:** {specialRequests}\n\nPlease confirm your reservation by replying "CONFIRM" or "YES".',
            fallbackMessage: 'Please contact us to complete your reservation.'
          },
          connections: [],
          metadata: {}
        }
      ],
      connections: [],
      variables: [],
      metadata: {}
    }
  },
  {
    id: 'fitness_template',
    name: '💪 Fitness & Gym',
    description: 'Class booking and membership management for fitness centers',
    industry: 'fitness',
    icon: '💪',
    features: ['Class Booking', 'Instructor Selection', 'Membership Check', 'Waitlist'],
    useCases: ['Gyms', 'Yoga Studios', 'Pilates Centers', 'CrossFit Boxes'],
    flow: {
      id: 'fitness_template',
      name: 'Fitness Class Booking Flow',
      description: 'Complete fitness class booking system',
      businessType: 'fitness',
      isActive: true,
      isTemplate: true,
      version: '1.0.0',
      nodes: [
        {
          id: 'welcome',
          type: 'service_message',
          name: 'Welcome & Classes',
          position: { x: 100, y: 100 },
          configuration: {
            welcomeText: '💪 Welcome to our fitness center!',
            serviceIntro: 'Here are our available classes:',
            instruction: 'Reply with the number or name of the class to book.',
            showEmojis: true,
            loadFromDatabase: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'instructor_selection',
          type: 'question',
          name: 'Instructor Selection',
          position: { x: 400, y: 100 },
          configuration: {
            question: 'Which instructor would you prefer?',
            inputType: 'service',
            loadFromDatabase: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'date_selection',
          type: 'date_picker',
          name: 'Date Selection',
          position: { x: 700, y: 100 },
          configuration: {
            minDate: new Date().toISOString().split('T')[0],
            maxDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            availableDays: [0, 1, 2, 3, 4, 5, 6]
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'time_selection',
          type: 'time_slots',
          name: 'Time Selection',
          position: { x: 1000, y: 100 },
          configuration: {
            timeSlots: [
              { start: '06:00', end: '07:00' },
              { start: '07:30', end: '08:30' },
              { start: '09:00', end: '10:00' },
              { start: '18:00', end: '19:00' },
              { start: '19:30', end: '20:30' },
              { start: '21:00', end: '22:00' }
            ]
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'membership_check',
          type: 'question',
          name: 'Membership Check',
          position: { x: 1300, y: 100 },
          configuration: {
            question: 'Do you have an active membership? (Yes/No)',
            inputType: 'text',
            required: true
          },
          connections: [],
          metadata: {}
        },
        {
          id: 'booking_summary',
          type: 'booking_summary',
          name: 'Booking Summary',
          position: { x: 1600, y: 100 },
          configuration: {
            template: '📋 **Class Booking Summary**\n\n💪 **Class:** {selectedService}\n👨‍🏫 **Instructor:** {selectedInstructor}\n📅 **Date:** {selectedDate}\n🕐 **Time:** {selectedTime}\n🎫 **Membership:** {membershipStatus}\n\nPlease confirm your class booking by replying "CONFIRM" or "YES".',
            fallbackMessage: 'Please contact us to complete your class booking.'
          },
          connections: [],
          metadata: {}
        }
      ],
      connections: [],
      variables: [],
      metadata: {}
    }
  }
];

export function getTemplateById(id: string): IndustryTemplate | undefined {
  return industryTemplates.find(template => template.id === id);
}

export function getTemplatesByIndustry(industry: string): IndustryTemplate[] {
  return industryTemplates.filter(template => template.industry === industry);
}

export function getAllTemplates(): IndustryTemplate[] {
  return industryTemplates;
}
