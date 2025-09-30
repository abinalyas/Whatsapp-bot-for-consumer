import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <form id="service-form">
        <input name="name" type="text" required />
        <input name="base_price" type="number" required />
        <select name="category" required>
          <option value="">Select category</option>
          <option value="hair">Hair</option>
          <option value="nails">Nails</option>
        </select>
        <input name="duration_minutes" type="number" />
        <textarea name="description"></textarea>
        <input name="is_active" type="checkbox" />
      </form>
    </body>
  </html>
`);

// Set up global DOM
global.document = dom.window.document;
global.window = dom.window as any;

describe('Form Validation Testing', () => {
  let form: HTMLFormElement;

  beforeAll(() => {
    form = document.getElementById('service-form') as HTMLFormElement;
  });

  describe('Form Field Mapping', () => {
    test('Form data extraction works correctly', () => {
      // Set form values
      (form.querySelector('input[name="name"]') as HTMLInputElement).value = 'Test Service';
      (form.querySelector('input[name="base_price"]') as HTMLInputElement).value = '100';
      (form.querySelector('select[name="category"]') as HTMLSelectElement).value = 'hair';
      (form.querySelector('input[name="duration_minutes"]') as HTMLInputElement).value = '60';
      (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value = 'Test description';
      (form.querySelector('input[name="is_active"]') as HTMLInputElement).checked = true;

      const formData = new FormData(form);
      
      // Test field extraction
      expect(formData.get('name')).toBe('Test Service');
      expect(formData.get('base_price')).toBe('100');
      expect(formData.get('category')).toBe('hair');
      expect(formData.get('duration_minutes')).toBe('60');
      expect(formData.get('description')).toBe('Test description');
      expect(formData.get('is_active')).toBe('on');
    });

    test('Form data transformation to API format', () => {
      // Set form values
      (form.querySelector('input[name="name"]') as HTMLInputElement).value = 'Test Service';
      (form.querySelector('input[name="base_price"]') as HTMLInputElement).value = '100';
      (form.querySelector('select[name="category"]') as HTMLSelectElement).value = 'hair';
      (form.querySelector('input[name="duration_minutes"]') as HTMLInputElement).value = '60';
      (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value = 'Test description';
      (form.querySelector('input[name="is_active"]') as HTMLInputElement).checked = true;

      const formData = new FormData(form);
      
      // Transform to API format
      const apiData = {
        name: formData.get('name'),
        base_price: parseFloat(formData.get('base_price') as string),
        category: formData.get('category'),
        duration_minutes: parseInt(formData.get('duration_minutes') as string),
        description: formData.get('description'),
        is_active: formData.get('is_active') === 'on',
        currency: 'USD',
        display_order: 0,
        tags: [],
        images: []
      };

      // Validate transformation
      expect(apiData.name).toBe('Test Service');
      expect(apiData.base_price).toBe(100);
      expect(apiData.category).toBe('hair');
      expect(apiData.duration_minutes).toBe(60);
      expect(apiData.description).toBe('Test description');
      expect(apiData.is_active).toBe(true);
      expect(apiData.currency).toBe('USD');
      expect(apiData.display_order).toBe(0);
      expect(Array.isArray(apiData.tags)).toBe(true);
      expect(Array.isArray(apiData.images)).toBe(true);
    });
  });

  describe('Client-Side Validation', () => {
    test('Required field validation works', () => {
      // Clear all form fields
      (form.querySelector('input[name="name"]') as HTMLInputElement).value = '';
      (form.querySelector('input[name="base_price"]') as HTMLInputElement).value = '';
      (form.querySelector('select[name="category"]') as HTMLSelectElement).value = '';

      // Test validation
      const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement;
      const priceInput = form.querySelector('input[name="base_price"]') as HTMLInputElement;
      const categorySelect = form.querySelector('select[name="category"]') as HTMLSelectElement;

      expect(nameInput.validity.valueMissing).toBe(true);
      expect(priceInput.validity.valueMissing).toBe(true);
      expect(categorySelect.validity.valueMissing).toBe(true);
    });

    test('Numeric validation works', () => {
      // Set invalid numeric values
      (form.querySelector('input[name="base_price"]') as HTMLInputElement).value = 'invalid';
      (form.querySelector('input[name="duration_minutes"]') as HTMLInputElement).value = 'not-a-number';

      const priceInput = form.querySelector('input[name="base_price"]') as HTMLInputElement;
      const durationInput = form.querySelector('input[name="duration_minutes"]') as HTMLInputElement;

      expect(priceInput.validity.badInput).toBe(true);
      expect(durationInput.validity.badInput).toBe(true);
    });

    test('Form submission validation', () => {
      // Clear required fields
      (form.querySelector('input[name="name"]') as HTMLInputElement).value = '';
      (form.querySelector('input[name="base_price"]') as HTMLInputElement).value = '';
      (form.querySelector('select[name="category"]') as HTMLSelectElement).value = '';

      // Test form validity
      expect(form.checkValidity()).toBe(false);
      
      // Test individual field validity
      const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement;
      const priceInput = form.querySelector('input[name="base_price"]') as HTMLInputElement;
      const categorySelect = form.querySelector('select[name="category"]') as HTMLSelectElement;

      expect(nameInput.checkValidity()).toBe(false);
      expect(priceInput.checkValidity()).toBe(false);
      expect(categorySelect.checkValidity()).toBe(false);
    });
  });

  describe('Data Type Conversion', () => {
    test('String to number conversion', () => {
      (form.querySelector('input[name="base_price"]') as HTMLInputElement).value = '150.50';
      (form.querySelector('input[name="duration_minutes"]') as HTMLInputElement).value = '90';

      const formData = new FormData(form);
      
      const basePrice = parseFloat(formData.get('base_price') as string);
      const duration = parseInt(formData.get('duration_minutes') as string);

      expect(basePrice).toBe(150.50);
      expect(duration).toBe(90);
    });

    test('Boolean conversion from checkbox', () => {
      // Test checked state
      (form.querySelector('input[name="is_active"]') as HTMLInputElement).checked = true;
      let formData = new FormData(form);
      let isActive = formData.get('is_active') === 'on';
      expect(isActive).toBe(true);

      // Test unchecked state
      (form.querySelector('input[name="is_active"]') as HTMLInputElement).checked = false;
      formData = new FormData(form);
      isActive = formData.get('is_active') === 'on';
      expect(isActive).toBe(false);
    });

    test('Default value handling', () => {
      // Clear optional fields
      (form.querySelector('input[name="duration_minutes"]') as HTMLInputElement).value = '';
      (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value = '';

      const formData = new FormData(form);
      
      // Test default values
      const duration = parseInt(formData.get('duration_minutes') as string || '60');
      const description = formData.get('description') || '';

      expect(duration).toBe(60);
      expect(description).toBe('');
    });
  });

  describe('Edge Cases', () => {
    test('Empty string handling', () => {
      (form.querySelector('input[name="name"]') as HTMLInputElement).value = '   '; // Whitespace only
      (form.querySelector('input[name="base_price"]') as HTMLInputElement).value = '0';

      const formData = new FormData(form);
      
      const name = formData.get('name') as string;
      const basePrice = parseFloat(formData.get('base_price') as string);

      expect(name.trim()).toBe('');
      expect(basePrice).toBe(0);
    });

    test('Special characters in form data', () => {
      (form.querySelector('input[name="name"]') as HTMLInputElement).value = 'Service with "quotes" & symbols';
      (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value = 'Description with\nnewlines\tand\ttabs';

      const formData = new FormData(form);
      
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;

      expect(name).toBe('Service with "quotes" & symbols');
      expect(description).toBe('Description with\nnewlines\tand\ttabs');
    });

    test('Very long input handling', () => {
      const longName = 'A'.repeat(1000);
      (form.querySelector('input[name="name"]') as HTMLInputElement).value = longName;

      const formData = new FormData(form);
      const name = formData.get('name') as string;

      expect(name).toBe(longName);
      expect(name.length).toBe(1000);
    });
  });

  describe('Form Submission Simulation', () => {
    test('Complete form submission flow', () => {
      // Set all form values
      (form.querySelector('input[name="name"]') as HTMLInputElement).value = 'Complete Test Service';
      (form.querySelector('input[name="base_price"]') as HTMLInputElement).value = '200';
      (form.querySelector('select[name="category"]') as HTMLSelectElement).value = 'nails';
      (form.querySelector('input[name="duration_minutes"]') as HTMLInputElement).value = '45';
      (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value = 'Complete test description';
      (form.querySelector('input[name="is_active"]') as HTMLInputElement).checked = true;

      // Simulate form submission
      const formData = new FormData(form);
      
      // Transform to API format
      const apiData = {
        name: formData.get('name'),
        base_price: parseFloat(formData.get('base_price') as string),
        category: formData.get('category'),
        duration_minutes: parseInt(formData.get('duration_minutes') as string),
        description: formData.get('description'),
        is_active: formData.get('is_active') === 'on',
        currency: 'USD',
        display_order: 0,
        tags: [],
        images: []
      };

      // Validate complete data
      expect(apiData.name).toBe('Complete Test Service');
      expect(apiData.base_price).toBe(200);
      expect(apiData.category).toBe('nails');
      expect(apiData.duration_minutes).toBe(45);
      expect(apiData.description).toBe('Complete test description');
      expect(apiData.is_active).toBe(true);
      expect(apiData.currency).toBe('USD');
      expect(apiData.display_order).toBe(0);
    });

    test('Form validation prevents invalid submission', () => {
      // Set invalid data
      (form.querySelector('input[name="name"]') as HTMLInputElement).value = '';
      (form.querySelector('input[name="base_price"]') as HTMLInputElement).value = 'invalid';
      (form.querySelector('select[name="category"]') as HTMLSelectElement).value = '';

      // Test form validity
      expect(form.checkValidity()).toBe(false);
      
      // Test individual field validation
      const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement;
      const priceInput = form.querySelector('input[name="base_price"]') as HTMLInputElement;
      const categorySelect = form.querySelector('select[name="category"]') as HTMLSelectElement;

      expect(nameInput.checkValidity()).toBe(false);
      expect(priceInput.checkValidity()).toBe(false);
      expect(categorySelect.checkValidity()).toBe(false);
    });
  });
});
