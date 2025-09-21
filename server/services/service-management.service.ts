/**
 * Service Management Service
 * Handles tenant-specific service operations with business logic
 */

import { ServiceRepository } from '../repositories/service.repository';
import type {
  ServiceResponse,
  PaginationParams,
  PaginatedResponse,
} from '@shared/types/tenant';
import type { Service, InsertService } from '@shared/schema';

export interface ServiceFilters {
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  averagePrice: number;
  categoryCounts: Record<string, number>;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  category?: string;
  icon?: string;
  isActive?: boolean;
  metadata?: any;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  icon?: string;
  isActive?: boolean;
  metadata?: any;
}

export class ServiceManagementService {
  private serviceRepo: ServiceRepository;

  constructor(connectionString: string) {
    this.serviceRepo = new ServiceRepository(connectionString);
  }

  // ===== SERVICE CRUD OPERATIONS =====

  /**
   * Create a new service for tenant
   */
  async createService(
    tenantId: string,
    serviceData: CreateServiceRequest
  ): Promise<ServiceResponse<Service>> {
    try {
      // Validate service data
      const validationResult = this.validateServiceData(serviceData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Service validation failed',
            details: validationResult.errors,
          },
        };
      }

      // Check for duplicate service names within tenant
      const existingServices = await this.serviceRepo.search(tenantId, serviceData.name, { page: 1, limit: 1 });
      if (existingServices.success && existingServices.data!.data.length > 0) {
        const exactMatch = existingServices.data!.data.find(
          s => s.name.toLowerCase() === serviceData.name.toLowerCase()
        );
        if (exactMatch) {
          return {
            success: false,
            error: {
              code: 'DUPLICATE_SERVICE_NAME',
              message: 'A service with this name already exists',
              tenantId,
            },
          };
        }
      }

      const insertData: InsertService = {
        tenantId,
        name: serviceData.name,
        description: serviceData.description || '',
        price: serviceData.price,
        category: serviceData.category || 'general',
        icon: serviceData.icon,
        isActive: serviceData.isActive !== false, // Default to true
        metadata: serviceData.metadata || {},
      };

      return await this.serviceRepo.create(tenantId, insertData);
    } catch (error) {
      console.error('Error creating service:', error);
      return {
        success: false,
        error: {
          code: 'SERVICE_CREATION_FAILED',
          message: 'Failed to create service',
          tenantId,
        },
      };
    }
  }

  /**
   * Update an existing service
   */
  async updateService(
    tenantId: string,
    serviceId: string,
    updateData: UpdateServiceRequest
  ): Promise<ServiceResponse<Service>> {
    try {
      // Validate update data
      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_UPDATE_DATA',
            message: 'No update data provided',
            tenantId,
          },
        };
      }

      // Validate service data if provided
      if (updateData.name || updateData.price !== undefined) {
        const validationResult = this.validateServiceData(updateData as CreateServiceRequest);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Service validation failed',
              details: validationResult.errors,
            },
          };
        }
      }

      // Check for duplicate names if name is being updated
      if (updateData.name) {
        const existingServices = await this.serviceRepo.search(tenantId, updateData.name, { page: 1, limit: 10 });
        if (existingServices.success) {
          const duplicateService = existingServices.data!.data.find(
            s => s.name.toLowerCase() === updateData.name!.toLowerCase() && s.id !== serviceId
          );
          if (duplicateService) {
            return {
              success: false,
              error: {
                code: 'DUPLICATE_SERVICE_NAME',
                message: 'A service with this name already exists',
                tenantId,
              },
            };
          }
        }
      }

      return await this.serviceRepo.update(tenantId, serviceId, updateData as any);
    } catch (error) {
      console.error('Error updating service:', error);
      return {
        success: false,
        error: {
          code: 'SERVICE_UPDATE_FAILED',
          message: 'Failed to update service',
          tenantId,
        },
      };
    }
  }

  /**
   * Delete a service
   */
  async deleteService(tenantId: string, serviceId: string): Promise<ServiceResponse<void>> {
    try {
      // Check if service has active bookings
      // Note: This would require booking repository integration
      // For now, we'll just delete the service
      
      return await this.serviceRepo.delete(tenantId, serviceId);
    } catch (error) {
      console.error('Error deleting service:', error);
      return {
        success: false,
        error: {
          code: 'SERVICE_DELETION_FAILED',
          message: 'Failed to delete service',
          tenantId,
        },
      };
    }
  }

  /**
   * Get service by ID
   */
  async getService(tenantId: string, serviceId: string): Promise<ServiceResponse<Service>> {
    return await this.serviceRepo.findById(tenantId, serviceId);
  }

  /**
   * List services with filtering and pagination
   */
  async listServices(
    tenantId: string,
    pagination: PaginationParams,
    filters?: ServiceFilters
  ): Promise<ServiceResponse<PaginatedResponse<Service>>> {
    try {
      if (filters?.search) {
        return await this.serviceRepo.search(tenantId, filters.search, pagination);
      }

      if (filters?.category) {
        return await this.serviceRepo.findByCategory(tenantId, filters.category);
      }

      if (filters?.isActive === true) {
        return await this.serviceRepo.findActive(tenantId, pagination);
      }

      if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
        const minPrice = filters.minPrice || 0;
        const maxPrice = filters.maxPrice || Number.MAX_SAFE_INTEGER;
        const priceRangeResult = await this.serviceRepo.findByPriceRange(tenantId, minPrice, maxPrice);
        
        if (!priceRangeResult.success) {
          return priceRangeResult as any;
        }

        // Convert array result to paginated response
        const services = priceRangeResult.data!;
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedServices = services.slice(startIndex, endIndex);
        const totalPages = Math.ceil(services.length / pagination.limit);

        return {
          success: true,
          data: {
            data: paginatedServices,
            pagination: {
              page: pagination.page,
              limit: pagination.limit,
              total: services.length,
              totalPages,
              hasNext: pagination.page < totalPages,
              hasPrev: pagination.page > 1,
            },
          },
        };
      }

      return await this.serviceRepo.list(tenantId, pagination);
    } catch (error) {
      console.error('Error listing services:', error);
      return {
        success: false,
        error: {
          code: 'SERVICE_LIST_FAILED',
          message: 'Failed to list services',
          tenantId,
        },
      };
    }
  }

  /**
   * Toggle service availability
   */
  async toggleServiceAvailability(
    tenantId: string,
    serviceId: string
  ): Promise<ServiceResponse<Service>> {
    try {
      const serviceResult = await this.serviceRepo.findById(tenantId, serviceId);
      if (!serviceResult.success) {
        return serviceResult;
      }

      const service = serviceResult.data!;
      return await this.serviceRepo.updateAvailability(tenantId, serviceId, !service.isActive);
    } catch (error) {
      console.error('Error toggling service availability:', error);
      return {
        success: false,
        error: {
          code: 'SERVICE_TOGGLE_FAILED',
          message: 'Failed to toggle service availability',
          tenantId,
        },
      };
    }
  }

  // ===== SERVICE ANALYTICS =====

  /**
   * Get service statistics for tenant
   */
  async getServiceStats(tenantId: string): Promise<ServiceResponse<ServiceStats>> {
    try {
      const allServicesResult = await this.serviceRepo.list(tenantId, { page: 1, limit: 1000 });
      if (!allServicesResult.success) {
        return allServicesResult as any;
      }

      const services = allServicesResult.data!.data;
      const activeServices = services.filter(s => s.isActive);
      const inactiveServices = services.filter(s => !s.isActive);

      // Calculate average price
      const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
      const averagePrice = services.length > 0 ? totalPrice / services.length : 0;

      // Count services by category
      const categoryCounts: Record<string, number> = {};
      services.forEach(service => {
        const category = service.category || 'general';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      return {
        success: true,
        data: {
          totalServices: services.length,
          activeServices: activeServices.length,
          inactiveServices: inactiveServices.length,
          averagePrice: Math.round(averagePrice * 100) / 100, // Round to 2 decimal places
          categoryCounts,
        },
      };
    } catch (error) {
      console.error('Error getting service stats:', error);
      return {
        success: false,
        error: {
          code: 'SERVICE_STATS_FAILED',
          message: 'Failed to get service statistics',
          tenantId,
        },
      };
    }
  }

  /**
   * Get popular services (most booked)
   */
  async getPopularServices(
    tenantId: string,
    limit: number = 5
  ): Promise<ServiceResponse<Service[]>> {
    try {
      // This would require integration with booking repository to get booking counts
      // For now, return active services ordered by creation date
      const activeServicesResult = await this.serviceRepo.findActive(tenantId, { page: 1, limit });
      if (!activeServicesResult.success) {
        return activeServicesResult as any;
      }

      return {
        success: true,
        data: activeServicesResult.data!.data,
      };
    } catch (error) {
      console.error('Error getting popular services:', error);
      return {
        success: false,
        error: {
          code: 'POPULAR_SERVICES_FAILED',
          message: 'Failed to get popular services',
          tenantId,
        },
      };
    }
  }

  // ===== VALIDATION HELPERS =====

  /**
   * Validate service data
   */
  private validateServiceData(data: Partial<CreateServiceRequest>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Service name is required');
      } else if (data.name.length > 100) {
        errors.push('Service name must be less than 100 characters');
      }
    }

    if (data.price !== undefined) {
      if (data.price < 0) {
        errors.push('Service price cannot be negative');
      } else if (data.price > 1000000) {
        errors.push('Service price cannot exceed 1,000,000');
      }
    }

    if (data.description && data.description.length > 500) {
      errors.push('Service description must be less than 500 characters');
    }

    if (data.category && data.category.length > 50) {
      errors.push('Service category must be less than 50 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.serviceRepo.close();
  }
}