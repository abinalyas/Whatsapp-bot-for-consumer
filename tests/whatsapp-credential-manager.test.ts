/**
 * WhatsApp Credential Manager Service Unit Tests
 * Tests credential validation, management, and monitoring functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WhatsAppCredentialManagerService, WhatsAppCredentials, CredentialValidationResult } from '../server/services/whatsapp-credential-manager.service';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock credentials
const mockCredentials: WhatsAppCredentials = {
  phoneNumberId: 'phone-123',
  accessToken: 'token-123',
  businessAccountId: 'business-123',
  webhookVerifyToken: 'verify-123',
  appId: 'app-123',
  appSecret: 'secret-123',
  systemUserToken: 'system-token-123',
};

// Mock services
const mockTenantSettingsService = {
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  deleteSettings: vi.fn(),
  close: vi.fn(),
};

const mockTenantService = {
  listTenants: vi.fn(),
  close: vi.fn(),
};

// Mock fetch
global.fetch = vi.fn();

vi.mock('../server/services/tenant-settings.service', () => ({
  TenantSettingsService: vi.fn(() => mockTenantSettingsService),
}));

vi.mock('../server/services/tenant.service', () => ({
  TenantService: vi.fn(() => mockTenantService),
}));

describe('WhatsAppCredentialManagerService', () => {
  let credentialManager: WhatsAppCredentialManagerService;

  beforeEach(() => {
    credentialManager = new WhatsAppCredentialManagerService(mockConnectionString);
    
    // Mock successful credentials fetch
    vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValue({
      success: true,
      data: {
        id: 'setting-123',
        tenantId: 'tenant-123',
        category: 'whatsapp',
        key: 'whatsapp',
        value: mockCredentials,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await credentialManager.close();
  });

  describe('Credential Validation', () => {
    it('should validate credentials successfully', async () => {
      // Mock successful API responses
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            display_phone_number: '+1234567890',
            verified_name: 'Test Business',
            code_verification_status: 'VERIFIED',
            quality_rating: 'GREEN',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            name: 'Test Business Inc',
            verification_status: 'verified',
            business_verification_status: 'verified',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [],
          }),
        } as Response);

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
      expect(result.data?.phoneNumber).toBe('+1234567890');
      expect(result.data?.businessName).toBe('Test Business Inc');
      expect(result.data?.verifiedName).toBe('Test Business');
      expect(result.data?.errors).toBeUndefined();
    });

    it('should detect invalid credentials', async () => {
      // Mock API error response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid access token',
            code: 190,
          },
        }),
      } as Response);

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors).toContain('Phone number validation failed: HTTP 401: Invalid access token');
    });

    it('should handle missing credentials', async () => {
      // Mock missing credentials
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Settings not found' },
      });

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors).toContain('Credentials not configured');
    });

    it('should validate provided credentials without fetching', async () => {
      // Mock successful API response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
          verified_name: 'Test Business',
          code_verification_status: 'VERIFIED',
        }),
      } as Response);

      const customCredentials: WhatsAppCredentials = {
        phoneNumberId: 'custom-phone',
        accessToken: 'custom-token',
      };

      const result = await credentialManager.validateCredentials('tenant-123', customCredentials);

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
      // Should not have called getSettings since credentials were provided
      expect(mockTenantSettingsService.getSettings).not.toHaveBeenCalled();
    });

    it('should cache validation results', async () => {
      // Mock successful API response
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
          verified_name: 'Test Business',
        }),
      } as Response);

      // First validation
      const result1 = await credentialManager.validateCredentials('tenant-123');
      expect(result1.success).toBe(true);

      // Second validation should use cache
      const result2 = await credentialManager.validateCredentials('tenant-123');
      expect(result2.success).toBe(true);

      // Should only call API once due to caching
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should detect token expiry warnings', async () => {
      // Mock API responses including token debug
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            display_phone_number: '+1234567890',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              expires_at: Math.floor((Date.now() + 5 * 24 * 60 * 60 * 1000) / 1000), // 5 days from now
            },
          }),
        } as Response);

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.warnings).toContain('Token expires in 5 days');
    });

    it('should validate multiple credentials in batch', async () => {
      // Mock API responses for multiple validations
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
        }),
      } as Response);

      const credentialsList = [
        { tenantId: 'tenant-1' },
        { tenantId: 'tenant-2' },
        { tenantId: 'tenant-3' },
      ];

      const result = await credentialManager.validateMultipleCredentials(credentialsList);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.every(r => r.success)).toBe(true);
    });
  });

  describe('Credential Management', () => {
    it('should get credentials for tenant', async () => {
      const result = await credentialManager.getCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCredentials);
      expect(mockTenantSettingsService.getSettings).toHaveBeenCalledWith('tenant-123', 'whatsapp');
    });

    it('should handle missing credentials when getting', async () => {
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Settings not found' },
      });

      const result = await credentialManager.getCredentials('tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CREDENTIALS_NOT_FOUND');
    });

    it('should update credentials successfully', async () => {
      // Mock successful validation
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
        }),
      } as Response);

      // Mock successful update
      vi.mocked(mockTenantSettingsService.updateSettings).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'setting-123',
          tenantId: 'tenant-123',
          category: 'whatsapp',
          key: 'whatsapp',
          value: { ...mockCredentials, accessToken: 'new-token' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const updates = { accessToken: 'new-token' };
      const result = await credentialManager.updateCredentials('tenant-123', updates);

      expect(result.success).toBe(true);
      expect(result.data?.accessToken).toBe('new-token');
      expect(mockTenantSettingsService.updateSettings).toHaveBeenCalled();
    });

    it('should reject invalid credential updates', async () => {
      // Mock validation failure
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Invalid token' },
        }),
      } as Response);

      const updates = { accessToken: 'invalid-token' };
      const result = await credentialManager.updateCredentials('tenant-123', updates);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should delete credentials successfully', async () => {
      vi.mocked(mockTenantSettingsService.deleteSettings).mockResolvedValueOnce({
        success: true,
      });

      const result = await credentialManager.deleteCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(mockTenantSettingsService.deleteSettings).toHaveBeenCalledWith('tenant-123', 'whatsapp');
    });

    it('should handle deletion errors', async () => {
      vi.mocked(mockTenantSettingsService.deleteSettings).mockResolvedValueOnce({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete' },
      });

      const result = await credentialManager.deleteCredentials('tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CREDENTIALS_DELETE_FAILED');
    });
  });

  describe('Health Monitoring', () => {
    it('should get health status for tenant', async () => {
      // Mock successful validation to create health status
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
        }),
      } as Response);

      const result = await credentialManager.getHealthStatus('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.tenantId).toBe('tenant-123');
      expect(result.data?.phoneNumberId).toBe('phone-123');
      expect(result.data?.status).toBe('healthy');
    });

    it('should detect unhealthy credentials', async () => {
      // Mock API error
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Invalid token' },
        }),
      } as Response);

      const result = await credentialManager.getHealthStatus('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('error');
      expect(result.data?.issues).toHaveLength(1);
      expect(result.data?.issues[0].type).toBe('error');
    });

    it('should get all health statuses', async () => {
      // First create some health statuses
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
        }),
      } as Response);

      await credentialManager.getHealthStatus('tenant-123');

      const result = await credentialManager.getAllHealthStatuses();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].tenantId).toBe('tenant-123');
    });

    it('should handle health monitoring errors', async () => {
      // Mock credentials not found
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Settings not found' },
      });

      const result = await credentialManager.getHealthStatus('tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CREDENTIALS_NOT_FOUND');
    });
  });

  describe('Validation History', () => {
    it('should get validation history for tenant', async () => {
      const mockHistory = [
        {
          tenantId: 'tenant-123',
          validationResult: { valid: true },
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'history-123',
          tenantId: 'tenant-123',
          category: 'whatsapp_validation_history',
          key: 'whatsapp_validation_history',
          value: mockHistory,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const result = await credentialManager.getValidationHistory('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
    });

    it('should return empty history when none exists', async () => {
      vi.mocked(mockTenantSettingsService.getSettings).mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'History not found' },
      });

      const result = await credentialManager.getValidationHistory('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('Cache Management', () => {
    it('should clear validation cache for specific tenant', async () => {
      // First populate cache
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
        }),
      } as Response);

      await credentialManager.validateCredentials('tenant-123');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Clear cache for tenant
      credentialManager.clearValidationCache('tenant-123');

      // Next validation should hit API again
      await credentialManager.validateCredentials('tenant-123');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should clear all validation cache', async () => {
      // Populate cache for multiple tenants
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
        }),
      } as Response);

      await credentialManager.validateCredentials('tenant-1');
      await credentialManager.validateCredentials('tenant-2');

      // Clear all cache
      credentialManager.clearValidationCache();

      // Next validations should hit API again
      await credentialManager.validateCredentials('tenant-1');
      await credentialManager.validateCredentials('tenant-2');

      expect(fetch).toHaveBeenCalledTimes(4); // 2 initial + 2 after cache clear
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during validation', async () => {
      // Mock network error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors).toContain('Validation error: Error: Network error');
    });

    it('should handle timeout errors', async () => {
      // Mock timeout error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('The operation was aborted'));

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors?.[0]).toContain('Validation error');
    });

    it('should handle service errors gracefully', async () => {
      // Mock service error
      vi.mocked(mockTenantSettingsService.getSettings).mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors?.[0]).toContain('Validation error');
    });
  });

  describe('API Endpoint Testing', () => {
    it('should test phone number endpoint correctly', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          display_phone_number: '+1234567890',
          verified_name: 'Test Business',
          code_verification_status: 'VERIFIED',
          quality_rating: 'GREEN',
        }),
      } as Response);

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.phoneNumber).toBe('+1234567890');
      expect(result.data?.verifiedName).toBe('Test Business');
      expect(result.data?.status).toBe('VERIFIED');

      // Verify correct API endpoint was called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`https://graph.facebook.com/v18.0/${mockCredentials.phoneNumberId}`),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockCredentials.accessToken}`,
          },
        })
      );
    });

    it('should test business account endpoint when business ID provided', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ display_phone_number: '+1234567890' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            name: 'Test Business Inc',
            verification_status: 'verified',
          }),
        } as Response);

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.businessName).toBe('Test Business Inc');

      // Verify business account endpoint was called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`https://graph.facebook.com/v18.0/${mockCredentials.businessAccountId}`),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockCredentials.accessToken}`,
          },
        })
      );
    });

    it('should test permissions endpoint', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ display_phone_number: '+1234567890' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response);

      const result = await credentialManager.validateCredentials('tenant-123');

      expect(result.success).toBe(true);
      expect(result.data?.permissions).toContain('whatsapp_business_messaging');

      // Verify permissions endpoint was called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`message_templates`),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockCredentials.accessToken}`,
          },
        })
      );
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup resources properly on close', async () => {
      await credentialManager.close();

      expect(mockTenantSettingsService.close).toHaveBeenCalled();
      expect(mockTenantService.close).toHaveBeenCalled();
    });
  });
});