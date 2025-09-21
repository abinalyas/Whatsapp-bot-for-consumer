/**
 * RBAC Service Unit Tests
 * Tests role-based access control functionality and permission validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RBACService } from '../server/services/rbac.service';
import type { UserRole, ApiPermission } from '@shared/types/tenant';

// Mock database connection
const mockConnectionString = 'postgresql://test:test@localhost:5432/test';

// Mock drizzle and database
vi.mock('drizzle-orm/neon-serverless', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  })),
}));

vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => ({
    end: vi.fn(),
  })),
}));

describe('RBACService', () => {
  let rbacService: RBACService;

  beforeEach(() => {
    rbacService = new RBACService(mockConnectionString);
  });

  afterEach(async () => {
    await rbacService.close();
  });

  describe('Permission Management', () => {
    it('should return all available permissions', () => {
      const permissions = rbacService.getAvailablePermissions();
      
      expect(permissions).toHaveLength(15);
      expect(permissions.map(p => p.id)).toContain('read:services');
      expect(permissions.map(p => p.id)).toContain('write:services');
      expect(permissions.map(p => p.id)).toContain('admin:all');
      expect(permissions.map(p => p.id)).toContain('manage:settings');
      expect(permissions.map(p => p.id)).toContain('write:users');
      expect(permissions.map(p => p.id)).toContain('manage:billing');
      expect(permissions.map(p => p.id)).toContain('manage:webhooks');
    });

    it('should filter permissions by category', () => {
      const servicePermissions = rbacService.getPermissionsByCategory('services');
      const userPermissions = rbacService.getPermissionsByCategory('users');
      const adminPermissions = rbacService.getPermissionsByCategory('admin');

      expect(servicePermissions).toHaveLength(2);
      expect(servicePermissions.map(p => p.id)).toEqual(['read:services', 'write:services']);

      expect(userPermissions).toHaveLength(2);
      expect(userPermissions.map(p => p.id)).toEqual(['read:users', 'write:users']);

      expect(adminPermissions).toHaveLength(1);
      expect(adminPermissions.map(p => p.id)).toEqual(['admin:all']);
    });

    it('should validate permission structure', () => {
      const permissions = rbacService.getAvailablePermissions();
      
      permissions.forEach(permission => {
        expect(permission).toHaveProperty('id');
        expect(permission).toHaveProperty('name');
        expect(permission).toHaveProperty('description');
        expect(permission).toHaveProperty('category');
        expect(permission).toHaveProperty('resource');
        expect(permission).toHaveProperty('action');
        
        expect(typeof permission.id).toBe('string');
        expect(typeof permission.name).toBe('string');
        expect(typeof permission.description).toBe('string');
        expect(typeof permission.category).toBe('string');
        expect(typeof permission.resource).toBe('string');
        expect(typeof permission.action).toBe('string');
      });
    });
  });

  describe('Role Management', () => {
    it('should return all system roles', () => {
      const roles = rbacService.getSystemRoles();
      
      expect(roles).toHaveLength(5);
      expect(roles.map(r => r.id)).toEqual(['admin', 'manager', 'user', 'viewer', 'api_user']);
      
      roles.forEach(role => {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('description');
        expect(role).toHaveProperty('permissions');
        expect(role).toHaveProperty('isSystemRole');
        expect(role.isSystemRole).toBe(true);
        expect(Array.isArray(role.permissions)).toBe(true);
      });
    });

    it('should get role by ID', () => {
      const adminRole = rbacService.getRoleById('admin');
      const managerRole = rbacService.getRoleById('manager');
      const invalidRole = rbacService.getRoleById('invalid');

      expect(adminRole).toBeTruthy();
      expect(adminRole?.id).toBe('admin');
      expect(adminRole?.name).toBe('Administrator');

      expect(managerRole).toBeTruthy();
      expect(managerRole?.id).toBe('manager');
      expect(managerRole?.name).toBe('Manager');

      expect(invalidRole).toBeNull();
    });

    it('should validate role permissions hierarchy', () => {
      const adminRole = rbacService.getRoleById('admin');
      const managerRole = rbacService.getRoleById('manager');
      const userRole = rbacService.getRoleById('user');
      const viewerRole = rbacService.getRoleById('viewer');

      // Admin should have admin:all permission
      expect(adminRole?.permissions.some(p => p.id === 'admin:all')).toBe(true);

      // Manager should have more permissions than user
      expect(managerRole?.permissions.length).toBeGreaterThan(userRole?.permissions.length || 0);

      // User should have more permissions than viewer
      expect(userRole?.permissions.length).toBeGreaterThan(viewerRole?.permissions.length || 0);

      // Viewer should only have read permissions
      const viewerPermissionIds = viewerRole?.permissions.map(p => p.id) || [];
      viewerPermissionIds.forEach(permissionId => {
        expect(permissionId.startsWith('read:')).toBe(true);
      });
    });

    it('should validate manager role permissions', () => {
      const managerRole = rbacService.getRoleById('manager');
      const managerPermissionIds = managerRole?.permissions.map(p => p.id) || [];

      // Manager should have specific permissions
      expect(managerPermissionIds).toContain('read:services');
      expect(managerPermissionIds).toContain('write:services');
      expect(managerPermissionIds).toContain('read:conversations');
      expect(managerPermissionIds).toContain('write:conversations');
      expect(managerPermissionIds).toContain('read:bookings');
      expect(managerPermissionIds).toContain('write:bookings');
      expect(managerPermissionIds).toContain('read:analytics');
      expect(managerPermissionIds).toContain('read:users');

      // Manager should NOT have admin permissions
      expect(managerPermissionIds).not.toContain('admin:all');
      expect(managerPermissionIds).not.toContain('write:users');
    });
  });

  describe('Permission Validation', () => {
    it('should validate permission format', () => {
      const permissions = rbacService.getAvailablePermissions();
      
      permissions.forEach(permission => {
        // Permission ID should follow pattern: action:resource or category:action
        expect(permission.id).toMatch(/^[a-z_]+:[a-z_]+$/);
        
        // Category should be valid
        const validCategories = [
          'services', 'conversations', 'bookings', 'analytics',
          'settings', 'users', 'billing', 'webhooks', 'admin'
        ];
        expect(validCategories).toContain(permission.category);

        // Action should be valid
        const validActions = ['create', 'read', 'update', 'delete', 'manage', 'all'];
        expect(validActions).toContain(permission.action);
      });
    });

    it('should have consistent permission naming', () => {
      const permissions = rbacService.getAvailablePermissions();
      
      // Check for consistent read/write patterns
      const readPermissions = permissions.filter(p => p.id.startsWith('read:'));
      const writePermissions = permissions.filter(p => p.id.startsWith('write:'));
      
      readPermissions.forEach(readPerm => {
        const resource = readPerm.id.split(':')[1];
        if (['services', 'conversations', 'bookings'].includes(resource)) {
          const hasWritePermission = writePermissions.some(writePerm => 
            writePerm.id === `write:${resource}`
          );
          expect(hasWritePermission).toBe(true);
        }
      });
    });
  });

  describe('Access Control Logic', () => {
    it('should correctly map resources to required permissions', () => {
      // Test the private method through public interface by checking role permissions
      const userRole = rbacService.getRoleById('user');
      const viewerRole = rbacService.getRoleById('viewer');
      const adminRole = rbacService.getRoleById('admin');

      // User should have write permissions for basic resources
      const userPermissionIds = userRole?.permissions.map(p => p.id) || [];
      expect(userPermissionIds).toContain('write:services');
      expect(userPermissionIds).toContain('write:conversations');
      expect(userPermissionIds).toContain('write:bookings');

      // Viewer should only have read permissions
      const viewerPermissionIds = viewerRole?.permissions.map(p => p.id) || [];
      expect(viewerPermissionIds).toContain('read:services');
      expect(viewerPermissionIds).toContain('read:conversations');
      expect(viewerPermissionIds).toContain('read:bookings');
      expect(viewerPermissionIds).not.toContain('write:services');

      // Admin should have admin:all permission
      const adminPermissionIds = adminRole?.permissions.map(p => p.id) || [];
      expect(adminPermissionIds).toContain('admin:all');
    });

    it('should validate role-based resource access patterns', () => {
      const roles = rbacService.getSystemRoles();
      
      roles.forEach(role => {
        const permissionIds = role.permissions.map(p => p.id);
        
        switch (role.id) {
          case 'admin':
            // Admin should have admin:all
            expect(permissionIds).toContain('admin:all');
            break;
            
          case 'manager':
            // Manager should have read access to users but not write
            expect(permissionIds).toContain('read:users');
            expect(permissionIds).not.toContain('write:users');
            // Manager should have analytics access
            expect(permissionIds).toContain('read:analytics');
            break;
            
          case 'user':
            // User should have basic CRUD for core resources
            expect(permissionIds).toContain('read:services');
            expect(permissionIds).toContain('write:services');
            expect(permissionIds).toContain('read:bookings');
            expect(permissionIds).toContain('write:bookings');
            // User should NOT have user management permissions
            expect(permissionIds).not.toContain('read:users');
            expect(permissionIds).not.toContain('write:users');
            break;
            
          case 'viewer':
            // Viewer should only have read permissions
            permissionIds.forEach(permissionId => {
              expect(permissionId.startsWith('read:') || permissionId === 'admin:all').toBe(true);
            });
            break;
            
          case 'api_user':
            // API user should have limited permissions for integrations
            expect(permissionIds).toContain('read:services');
            expect(permissionIds).toContain('read:bookings');
            expect(permissionIds).toContain('webhook:receive');
            expect(permissionIds).not.toContain('write:users');
            break;
        }
      });
    });
  });

  describe('Permission Categories', () => {
    it('should have all expected permission categories', () => {
      const permissions = rbacService.getAvailablePermissions();
      const categories = [...new Set(permissions.map(p => p.category))];
      
      const expectedCategories = [
        'services', 'conversations', 'bookings', 'analytics',
        'settings', 'users', 'billing', 'webhooks', 'admin'
      ];
      
      expectedCategories.forEach(category => {
        expect(categories).toContain(category);
      });
    });

    it('should have appropriate permissions for each category', () => {
      const categoryPermissionCounts = {
        services: 2, // read, write
        conversations: 2, // read, write
        bookings: 2, // read, write
        analytics: 1, // read
        settings: 1, // manage
        users: 2, // read, write
        billing: 2, // read, manage
        webhooks: 2, // receive, manage
        admin: 1, // all
      };

      Object.entries(categoryPermissionCounts).forEach(([category, expectedCount]) => {
        const categoryPermissions = rbacService.getPermissionsByCategory(category as any);
        expect(categoryPermissions).toHaveLength(expectedCount);
      });
    });
  });

  describe('Role Consistency', () => {
    it('should ensure all roles have valid permissions', () => {
      const roles = rbacService.getSystemRoles();
      const allPermissions = rbacService.getAvailablePermissions();
      const validPermissionIds = allPermissions.map(p => p.id);

      roles.forEach(role => {
        role.permissions.forEach(permission => {
          expect(validPermissionIds).toContain(permission.id);
        });
      });
    });

    it('should maintain role hierarchy in permission scope', () => {
      const adminRole = rbacService.getRoleById('admin');
      const managerRole = rbacService.getRoleById('manager');
      const userRole = rbacService.getRoleById('user');
      const viewerRole = rbacService.getRoleById('viewer');

      // Admin should have the most comprehensive access
      expect(adminRole?.permissions.some(p => p.id === 'admin:all')).toBe(true);

      // Manager should have more permissions than user
      const managerPermCount = managerRole?.permissions.length || 0;
      const userPermCount = userRole?.permissions.length || 0;
      expect(managerPermCount).toBeGreaterThan(userPermCount);

      // User should have more permissions than viewer
      const viewerPermCount = viewerRole?.permissions.length || 0;
      expect(userPermCount).toBeGreaterThan(viewerPermCount);

      // Viewer should have the least permissions (only read access)
      const viewerPermissions = viewerRole?.permissions.map(p => p.id) || [];
      viewerPermissions.forEach(permId => {
        expect(permId.startsWith('read:')).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid role IDs gracefully', () => {
      const invalidRole = rbacService.getRoleById('nonexistent');
      expect(invalidRole).toBeNull();
    });

    it('should handle invalid permission categories gracefully', () => {
      const invalidCategoryPermissions = rbacService.getPermissionsByCategory('invalid' as any);
      expect(invalidCategoryPermissions).toEqual([]);
    });

    it('should validate permission structure integrity', () => {
      const permissions = rbacService.getAvailablePermissions();
      
      permissions.forEach(permission => {
        // Ensure no undefined or null values
        expect(permission.id).toBeTruthy();
        expect(permission.name).toBeTruthy();
        expect(permission.description).toBeTruthy();
        expect(permission.category).toBeTruthy();
        expect(permission.resource).toBeTruthy();
        expect(permission.action).toBeTruthy();
        
        // Ensure proper types
        expect(typeof permission.id).toBe('string');
        expect(typeof permission.name).toBe('string');
        expect(typeof permission.description).toBe('string');
        expect(typeof permission.category).toBe('string');
        expect(typeof permission.resource).toBe('string');
        expect(typeof permission.action).toBe('string');
      });
    });
  });
});