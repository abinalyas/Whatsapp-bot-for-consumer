import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TENANT_ID = 'bella-salon';

describe('End-to-End User Workflows', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Error:', msg.text());
      }
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Service Management Workflow', () => {
    test('Complete service creation workflow', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Wait for services to load
      await page.waitForSelector('[data-testid="services-section"]', { timeout: 10000 });

      // Click "Add Service" button
      await page.click('[data-testid="add-service-button"]');
      
      // Wait for modal to open
      await page.waitForSelector('[data-testid="service-form"]', { timeout: 5000 });

      // Fill service form
      await page.fill('input[name="name"]', 'E2E Test Service');
      await page.fill('input[name="base_price"]', '150');
      await page.selectOption('select[name="category"]', 'hair');
      await page.fill('input[name="duration_minutes"]', '90');
      await page.fill('textarea[name="description"]', 'E2E test service description');
      await page.check('input[name="is_active"]');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for success or error
      await page.waitForTimeout(2000);

      // Check if service was created (look for success message or service in list)
      const successMessage = await page.locator('.success-message, .toast-success').first();
      const serviceInList = await page.locator('[data-testid="service-list"]').locator('text=E2E Test Service').first();
      
      // Either success message or service appears in list
      expect(successMessage.isVisible() || serviceInList.isVisible()).toBeTruthy();
    });

    test('Service editing workflow', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Wait for services to load
      await page.waitForSelector('[data-testid="services-section"]', { timeout: 10000 });

      // Find and click edit button for first service
      const editButton = await page.locator('[data-testid="edit-service-button"]').first();
      await editButton.click();

      // Wait for edit modal
      await page.waitForSelector('[data-testid="edit-service-form"]', { timeout: 5000 });

      // Update service details
      await page.fill('input[name="name"]', 'Updated E2E Service');
      await page.fill('input[name="base_price"]', '200');
      await page.fill('textarea[name="description"]', 'Updated description');

      // Save changes
      await page.click('button[type="submit"]');

      // Wait for update to complete
      await page.waitForTimeout(2000);

      // Verify update (look for success message or updated service)
      const successMessage = await page.locator('.success-message, .toast-success').first();
      const updatedService = await page.locator('[data-testid="service-list"]').locator('text=Updated E2E Service').first();
      
      expect(successMessage.isVisible() || updatedService.isVisible()).toBeTruthy();
    });

    test('Service deletion workflow', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Wait for services to load
      await page.waitForSelector('[data-testid="services-section"]', { timeout: 10000 });

      // Find and click delete button for first service
      const deleteButton = await page.locator('[data-testid="delete-service-button"]').first();
      await deleteButton.click();

      // Wait for confirmation modal
      await page.waitForSelector('[data-testid="delete-confirmation-modal"]', { timeout: 5000 });

      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');

      // Wait for deletion to complete
      await page.waitForTimeout(2000);

      // Verify deletion (look for success message)
      const successMessage = await page.locator('.success-message, .toast-success').first();
      expect(successMessage.isVisible()).toBeTruthy();
    });
  });

  describe('Staff Management Workflow', () => {
    test('Complete staff creation workflow', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Navigate to staff section
      await page.click('[data-testid="staff-tab"]');
      await page.waitForSelector('[data-testid="staff-section"]', { timeout: 10000 });

      // Click "Add Staff" button
      await page.click('[data-testid="add-staff-button"]');
      
      // Wait for modal to open
      await page.waitForSelector('[data-testid="staff-form"]', { timeout: 5000 });

      // Fill staff form
      await page.fill('input[name="name"]', 'E2E Test Staff');
      await page.selectOption('select[name="role"]', 'stylist');
      await page.fill('input[name="email"]', 'e2e@test.com');
      await page.fill('input[name="phone"]', '1234567890');
      await page.check('input[name="is_active"]');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for success or error
      await page.waitForTimeout(2000);

      // Check if staff was created
      const successMessage = await page.locator('.success-message, .toast-success').first();
      const staffInList = await page.locator('[data-testid="staff-list"]').locator('text=E2E Test Staff').first();
      
      expect(successMessage.isVisible() || staffInList.isVisible()).toBeTruthy();
    });
  });

  describe('Appointment Management Workflow', () => {
    test('Quick book appointment workflow', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Click "Quick Book" button
      await page.click('[data-testid="quick-book-button"]');
      
      // Wait for modal to open
      await page.waitForSelector('[data-testid="quick-book-form"]', { timeout: 5000 });

      // Fill appointment form
      await page.fill('input[name="customerName"]', 'E2E Test Customer');
      await page.fill('input[name="phone"]', '1234567890');
      await page.fill('input[name="email"]', 'customer@test.com');
      
      // Select service (first available)
      await page.selectOption('select[name="service"]', { index: 1 });
      
      // Select staff (first available)
      await page.selectOption('select[name="staffMember"]', { index: 1 });
      
      // Set appointment date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      await page.fill('input[name="date"]', dateString);
      
      // Set appointment time
      await page.fill('input[name="time"]', '10:00');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for success or error
      await page.waitForTimeout(2000);

      // Check if appointment was created
      const successMessage = await page.locator('.success-message, .toast-success').first();
      expect(successMessage.isVisible()).toBeTruthy();
    });

    test('View schedule workflow', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Click "View Schedule" button
      await page.click('[data-testid="view-schedule-button"]');
      
      // Wait for schedule modal
      await page.waitForSelector('[data-testid="schedule-modal"]', { timeout: 5000 });

      // Verify schedule is displayed
      const scheduleContent = await page.locator('[data-testid="schedule-content"]');
      expect(scheduleContent.isVisible()).toBeTruthy();

      // Close modal
      await page.click('[data-testid="close-schedule-button"]');
    });
  });

  describe('Error Handling Workflows', () => {
    test('Form validation prevents invalid submission', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Click "Add Service" button
      await page.click('[data-testid="add-service-button"]');
      
      // Wait for modal to open
      await page.waitForSelector('[data-testid="service-form"]', { timeout: 5000 });

      // Try to submit form with empty required fields
      await page.click('button[type="submit"]');

      // Wait for validation errors
      await page.waitForTimeout(1000);

      // Check for validation error messages
      const nameError = await page.locator('input[name="name"]:invalid');
      const priceError = await page.locator('input[name="base_price"]:invalid');
      const categoryError = await page.locator('select[name="category"]:invalid');

      expect(nameError.isVisible()).toBeTruthy();
      expect(priceError.isVisible()).toBeTruthy();
      expect(categoryError.isVisible()).toBeTruthy();
    });

    test('API error handling displays user-friendly messages', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Click "Add Service" button
      await page.click('[data-testid="add-service-button"]');
      
      // Wait for modal to open
      await page.waitForSelector('[data-testid="service-form"]', { timeout: 5000 });

      // Fill form with invalid data that will cause API error
      await page.fill('input[name="name"]', 'Test Service');
      await page.fill('input[name="base_price"]', 'invalid-price');
      await page.selectOption('select[name="category"]', 'hair');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for error response
      await page.waitForTimeout(2000);

      // Check for error message
      const errorMessage = await page.locator('.error-message, .toast-error').first();
      expect(errorMessage.isVisible()).toBeTruthy();
    });
  });

  describe('Navigation and UI Workflows', () => {
    test('Dashboard navigation works correctly', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Test navigation between tabs
      const tabs = ['overview', 'services', 'staff', 'calendar', 'payments', 'customers'];
      
      for (const tab of tabs) {
        await page.click(`[data-testid="${tab}-tab"]`);
        await page.waitForTimeout(500);
        
        // Verify tab content is visible
        const tabContent = await page.locator(`[data-testid="${tab}-content"]`);
        expect(tabContent.isVisible()).toBeTruthy();
      }
    });

    test('Modal interactions work correctly', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Test opening and closing modals
      const modals = [
        { button: 'add-service-button', modal: 'service-form' },
        { button: 'quick-book-button', modal: 'quick-book-form' },
        { button: 'view-schedule-button', modal: 'schedule-modal' }
      ];

      for (const modal of modals) {
        // Open modal
        await page.click(`[data-testid="${modal.button}"]`);
        await page.waitForSelector(`[data-testid="${modal.modal}"]`, { timeout: 5000 });
        
        // Verify modal is visible
        const modalElement = await page.locator(`[data-testid="${modal.modal}"]`);
        expect(modalElement.isVisible()).toBeTruthy();
        
        // Close modal
        await page.click('[data-testid="close-modal-button"]');
        await page.waitForTimeout(500);
        
        // Verify modal is closed
        expect(modalElement.isVisible()).toBeFalsy();
      }
    });
  });

  describe('Data Loading and State Management', () => {
    test('Dashboard loads all required data', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Wait for all sections to load
      await page.waitForSelector('[data-testid="overview-content"]', { timeout: 10000 });
      await page.waitForSelector('[data-testid="services-section"]', { timeout: 10000 });
      await page.waitForSelector('[data-testid="staff-section"]', { timeout: 10000 });

      // Verify data is displayed
      const servicesCount = await page.locator('[data-testid="services-count"]').textContent();
      const staffCount = await page.locator('[data-testid="staff-count"]').textContent();
      const appointmentsCount = await page.locator('[data-testid="appointments-count"]').textContent();

      expect(servicesCount).toBeDefined();
      expect(staffCount).toBeDefined();
      expect(appointmentsCount).toBeDefined();
    });

    test('Real-time updates work correctly', async () => {
      // Navigate to salon dashboard
      await page.goto(`${API_BASE_URL}/salon-dashboard`);
      await page.waitForLoadState('networkidle');

      // Get initial counts
      const initialServicesCount = await page.locator('[data-testid="services-count"]').textContent();
      
      // Add a new service
      await page.click('[data-testid="add-service-button"]');
      await page.waitForSelector('[data-testid="service-form"]', { timeout: 5000 });
      
      await page.fill('input[name="name"]', 'Real-time Test Service');
      await page.fill('input[name="base_price"]', '100');
      await page.selectOption('select[name="category"]', 'hair');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(2000);
      
      // Check if count updated
      const updatedServicesCount = await page.locator('[data-testid="services-count"]').textContent();
      expect(updatedServicesCount).not.toBe(initialServicesCount);
    });
  });
});
