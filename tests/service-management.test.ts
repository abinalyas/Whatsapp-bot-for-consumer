/**
 * Service Management Service Unit Tests
 * Tests tenant-specific service operations with business logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceManagementService, CreateServiceRequest, UpdateServiceRequest } from '../server/services/service-management.service';
import { ServiceRepository } from '../server/repositories/service.repository';
import type { Service } from '@shared/schema';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock ServiceRepository
const mockServiceRepo = {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn(),
  list: vi.fn(),
  search: vi.fn(),
  findByCategory: vi.fn(),
  findActive: vi.fn(),
  findByPriceRange: vi.fn(),
  updateAvailability: vi.fn(),
  close: vi.fn(),
} as unknown as ServiceRepository;

vi.mock('../server/repositories/service.repository', () => ({
  ServiceRepository: vi.fn(() => mockServiceRepo),
}));

describe('ServiceManagementService', () => {
  let serviceManagement: ServiceManagementService;
  let mockService: Service;

  beforeEach(() => {
    serviceManagement = new ServiceManagementService(mockConnectionString);
    
    mockService = {
      id: 'service-123',
      tenantId: 'tenant-123',
      name: 'Haircut',
      description: 'Professional haircut service',
      price: 50,
      category: 'hair',
      icon: 'scissors',
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await serviceManagement.close();
  });

  describe('Service Creation', () => {
    it('should create a new service successfully', async () => {
      const createRequest: CreateServiceRequest = {
        name: 'Haircut',
        description: 'Professional haircut service',
        price: 50,
        category: 'hair',
        icon: 'scissors',
        isActive: true,
      };

      vi.mocked(mockServiceRepo.search).mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      });

      vi.mocked(mockServiceRepo.create).mockResolvedValue({
        success: true,
        data: mockService,
      });

      const result = await serviceManagement.createService('tenant-123', createRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockService);
      expect(mockServiceRepo.create).toHaveBeenCalledWith('tenant-123', {
        tenantId: 'tenant-123',
        name: 'Haircut',
        description: 'Professional haircut service',
        price: 50,
        category: 'hair',
        icon: 'scissors',
        isActive: true,
        metadata: {},
      });
    });

    it('should validate required fields', async () => {
      const invalidRequest: CreateServiceRequest = {
        name: '',
        price: -10,
      };

      const result = await serviceManagement.createService('tenant-123', invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.details).toContain('Service name is required');
      expect(result.error?.details).toContain('Service price cannot be negative');
    });

    it('should prevent duplicate service names', async () => {
      const createRequest: CreateServiceRequest = {
        name: 'Haircut',
        price: 50,
      };

      vi.mocked(mockServiceRepo.search).mockResolvedValue({
        success: true,
        data: { 
          data: [{ ...mockService, name: 'Haircut' }], 
          pagination: { page: 1, limit: 1, total: 1, totalPages: 1, hasNext: false, hasPrev: false } 
        },
      });

      const result = await serviceManagement.createService('tenant-123', createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DUPLICATE_SERVICE_NAME');
    });

    it('should set default values for optional fields', async () => {
      const minimalRequest: CreateServiceRequest = {
        name: 'Basic Service',
        price: 25,
      };

      vi.mocked(mockServiceRepo.search).mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      });

      vi.mocked(mockServiceRepo.create).mockResolvedValue({
        success: true,
        data: mockService,
      });

      await serviceManagement.createService('tenant-123', minimalRequest);

      expect(mockServiceRepo.create).toHaveBeenCalledWith('tenant-123', {
        tenantId: 'tenant-123',
        name: 'Basic Service',
        description: '',
        price: 25,
        category: 'general',
        icon: undefined,
        isActive: true,
        metadata: {},
      });
    });
  });

  describe('Service Updates', () => {
    it('should update service successfully', async () => {
      const updateRequest: UpdateServiceRequest = {
        name: 'Premium Haircut',
        price: 75,
      };

      vi.mocked(mockServiceRepo.search).mockResolvedValue({
        success: true,
        data: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      });

      vi.mocked(mockServiceRepo.update).mockResolvedValue({
        success: true,
        data: { ...mockService, ...updateRequest },
      });

      const result = await serviceManagement.updateService('tenant-123', 'service-123', updateRequest);

      expect(result.success).toBe(true);
      expect(mockServiceRepo.update).toHaveBeenCalledWith('tenant-123', 'service-123', updateRequest);
    });

    it('should validate update data', async () => {
      const invalidUpdate: UpdateServiceRequest = {
        name: '',
        price: -5,
      };

      const result = await serviceManagement.updateService('tenant-123', 'service-123', invalidUpdate);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
    });

    it('should prevent empty updates', async () => {
      const result = await serviceManagement.updateService('tenant-123', 'service-123', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_UPDATE_DATA');
    });

    it('should prevent duplicate names during update', async () => {
      const updateRequest: UpdateServiceRequest = {
        name: 'Existing Service',
      };

      vi.mocked(mockServiceRepo.search).mockResolvedValue({
        success: true,
        data: { 
          data: [{ ...mockService, id: 'other-service', name: 'Existing Service' }], 
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false } 
        },
      });

      const result = await serviceManagement.updateService('tenant-123', 'service-123', updateRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DUPLICATE_SERVICE_NAME');
    });
  });

  describe('Service Deletion', () => {
    it('should delete service successfully', async () => {
      vi.mocked(mockServiceRepo.delete).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await serviceManagement.deleteService('tenant-123', 'service-123');

      expect(result.success).toBe(true);
      expect(mockServiceRepo.delete).toHaveBeenCalledWith('tenant-123', 'service-123');
    });

    it('should handle deletion errors', async () => {
      vi.mocked(mockServiceRepo.delete).mockRejectedValue(new Error('Database error'));

      const result = await serviceManagement.deleteService('tenant-123', 'service-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_DELETION_FAILED');
    });
  });

  describe('Service Retrieval', () => {
    it('should get service by ID', async () => {
      vi.mocked(mockServiceRepo.findById).mockResolvedValue({
        success: true,
        data: mockService,
      });

      const result = await serviceManagement.getService('tenant-123', 'service-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockService);
    });

    it('should list services with pagination', async () => {
      const mockPaginatedResponse = {
        data: [mockService],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      };

      vi.mocked(mockServiceRepo.list).mockResolvedValue({
        success: true,
        data: mockPaginatedResponse,
      });

      const result = await serviceManagement.listServices('tenant-123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaginatedResponse);
    });

    it('should search services by query', async () => {
      const mockSearchResponse = {
        data: [mockService],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      };

      vi.mocked(mockServiceRepo.search).mockResolvedValue({
        success: true,
        data: mockSearchResponse,
      });

      const result = await serviceManagement.listServices(
        'tenant-123', 
        { page: 1, limit: 10 }, 
        { search: 'haircut' }
      );

      expect(result.success).toBe(true);
      expect(mockServiceRepo.search).toHaveBeenCalledWith('tenant-123', 'haircut', { page: 1, limit: 10 });
    });

    it('should filter services by category', async () => {
      vi.mocked(mockServiceRepo.findByCategory).mockResolvedValue({
        success: true,
        data: [mockService],
      });

      const result = await serviceManagement.listServices(
        'tenant-123', 
        { page: 1, limit: 10 }, 
        { category: 'hair' }
      );

      expect(result.success).toBe(true);
      expect(mockServiceRepo.findByCategory).toHaveBeenCalledWith('tenant-123', 'hair');
    });

    it('should filter active services only', async () => {
      const mockActiveResponse = {
        data: [mockService],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      };

      vi.mocked(mockServiceRepo.findActive).mockResolvedValue({
        success: true,
        data: mockActiveResponse,
      });

      const result = await serviceManagement.listServices(
        'tenant-123', 
        { page: 1, limit: 10 }, 
        { isActive: true }
      );

      expect(result.success).toBe(true);
      expect(mockServiceRepo.findActive).toHaveBeenCalledWith('tenant-123', { page: 1, limit: 10 });
    });

    it('should filter services by price range', async () => {
      vi.mocked(mockServiceRepo.findByPriceRange).mockResolvedValue({
        success: true,
        data: [mockService],
      });

      const result = await serviceManagement.listServices(
        'tenant-123', 
        { page: 1, limit: 10 }, 
        { minPrice: 25, maxPrice: 75 }
      );

      expect(result.success).toBe(true);
      expect(mockServiceRepo.findByPriceRange).toHaveBeenCalledWith('tenant-123', 25, 75);
    });
  });

  describe('Service Availability Toggle', () => {
    it('should toggle service availability', async () => {
      vi.mocked(mockServiceRepo.findById).mockResolvedValue({
        success: true,
        data: mockService,
      });

      vi.mocked(mockServiceRepo.updateAvailability).mockResolvedValue({
        success: true,
        data: { ...mockService, isActive: false },
      });

      const result = await serviceManagement.toggleServiceAvailability('tenant-123', 'service-123');

      expect(result.success).toBe(true);
      expect(mockServiceRepo.updateAvailability).toHaveBeenCalledWith('tenant-123', 'service-123', false);
    });

    it('should handle service not found during toggle', async () => {
      vi.mocked(mockServiceRepo.findById).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service not found' },
      });

      const result = await serviceManagement.toggleServiceAvailability('tenant-123', 'service-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('Service Statistics', () => {
    it('should calculate service statistics', async () => {
      const mockServices = [
        { ...mockService, price: 50, category: 'hair', isActive: true },
        { ...mockService, id: 'service-2', price: 30, category: 'nails', isActive: true },
        { ...mockService, id: 'service-3', price: 40, category: 'hair', isActive: false },
      ];

      vi.mocked(mockServiceRepo.list).mockResolvedValue({
        success: true,
        data: {
          data: mockServices,
          pagination: { page: 1, limit: 1000, total: 3, totalPages: 1, hasNext: false, hasPrev: false },
        },
      });

      const result = await serviceManagement.getServiceStats('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalServices: 3,
        activeServices: 2,
        inactiveServices: 1,
        averagePrice: 40, // (50 + 30 + 40) / 3
        categoryCounts: {
          hair: 2,
          nails: 1,
        },
      });
    });

    it('should handle empty service list', async () => {
      vi.mocked(mockServiceRepo.list).mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 1000, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        },
      });

      const result = await serviceManagement.getServiceStats('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalServices: 0,
        activeServices: 0,
        inactiveServices: 0,
        averagePrice: 0,
        categoryCounts: {},
      });
    });
  });

  describe('Popular Services', () => {
    it('should get popular services', async () => {
      const mockActiveResponse = {
        data: [mockService],
        pagination: { page: 1, limit: 5, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      };

      vi.mocked(mockServiceRepo.findActive).mockResolvedValue({
        success: true,
        data: mockActiveResponse,
      });

      const result = await serviceManagement.getPopularServices('tenant-123', 5);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockService]);
      expect(mockServiceRepo.findActive).toHaveBeenCalledWith('tenant-123', { page: 1, limit: 5 });
    });
  });

  describe('Validation', () => {
    it('should validate service name length', async () => {
      const longNameRequest: CreateServiceRequest = {
        name: 'A'.repeat(101), // Too long
        price: 50,
      };

      const result = await serviceManagement.createService('tenant-123', longNameRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details).toContain('Service name must be less than 100 characters');
    });

    it('should validate price limits', async () => {
      const expensiveRequest: CreateServiceRequest = {
        name: 'Expensive Service',
        price: 1000001, // Too expensive
      };

      const result = await serviceManagement.createService('tenant-123', expensiveRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details).toContain('Service price cannot exceed 1,000,000');
    });

    it('should validate description length', async () => {
      const longDescRequest: CreateServiceRequest = {
        name: 'Service',
        price: 50,
        description: 'A'.repeat(501), // Too long
      };

      const result = await serviceManagement.createService('tenant-123', longDescRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details).toContain('Service description must be less than 500 characters');
    });

    it('should validate category length', async () => {
      const longCategoryRequest: CreateServiceRequest = {
        name: 'Service',
        price: 50,
        category: 'A'.repeat(51), // Too long
      };

      const result = await serviceManagement.createService('tenant-123', longCategoryRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details).toContain('Service category must be less than 50 characters');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors during creation', async () => {
      const createRequest: CreateServiceRequest = {
        name: 'Test Service',
        price: 50,
      };

      vi.mocked(mockServiceRepo.search).mockRejectedValue(new Error('Database error'));

      const result = await serviceManagement.createService('tenant-123', createRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_CREATION_FAILED');
    });

    it('should handle repository errors during listing', async () => {
      vi.mocked(mockServiceRepo.list).mockRejectedValue(new Error('Database error'));

      const result = await serviceManagement.listServices('tenant-123', { page: 1, limit: 10 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_LIST_FAILED');
    });

    it('should handle repository errors during stats calculation', async () => {
      vi.mocked(mockServiceRepo.list).mockRejectedValue(new Error('Database error'));

      const result = await serviceManagement.getServiceStats('tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_STATS_FAILED');
    });
  });
});