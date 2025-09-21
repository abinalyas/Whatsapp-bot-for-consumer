/**
 * Role-Based Access Control (RBAC) Service
 * Manages user roles, permissions, and access control for multi-tenant system
 */

import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import type {
  UserRole,
  ApiPermission,
  ServiceResponse,
  UserProfile,
} from '@shared/types/tenant';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  resource: string;
  action: PermissionAction;
}

export type PermissionCategory = 
  | 'services'
  | 'conversations'
  | 'bookings'
  | 'analytics'
  | 'settings'
  | 'users'
  | 'billing'
  | 'webhooks'
  | 'admin';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'all';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  tenantId?: string; // null for system roles, set for custom tenant roles
}

export interface RoleAssignment {
  userId: string;
  roleId: string;
  tenantId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
}

export interface AccessControlCheck {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
  userPermissions?: string[];
}

export class RBACService {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private permissionCache: Map<string, Permission[]> = new Map();
  private roleCache: Map<string, Role> = new Map();

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
    this.initializeSystemRoles();
  }

  // ===== PERMISSION MANAGEMENT =====

  /**
   * Get all available permissions
   */
  getAvailablePermissions(): Permission[] {
    return [
      // Services permissions
      {
        id: 'read:services',
        name: 'Read Services',
        description: 'View services and service details',
        category: 'services',
        resource: 'services',
        action: 'read',
      },
      {
        id: 'write:services',
        name: 'Write Services',
        description: 'Create, update, and delete services',
        category: 'services',
        resource: 'services',
        action: 'manage',
      },
      // Conversations permissions
      {
        id: 'read:conversations',
        name: 'Read Conversations',
        description: 'View conversations and messages',
        category: 'conversations',
        resource: 'conversations',
        action: 'read',
      },
      {
        id: 'write:conversations',
        name: 'Write Conversations',
        description: 'Create and update conversations',
        category: 'conversations',
        resource: 'conversations',
        action: 'manage',
      },
      // Bookings permissions
      {
        id: 'read:bookings',
        name: 'Read Bookings',
        description: 'View bookings and booking details',
        category: 'bookings',
        resource: 'bookings',
        action: 'read',
      },
      {
        id: 'write:bookings',
        name: 'Write Bookings',
        description: 'Create, update, and manage bookings',
        category: 'bookings',
        resource: 'bookings',
        action: 'manage',
      },
      // Analytics permissions
      {
        id: 'read:analytics',
        name: 'Read Analytics',
        description: 'View analytics and reports',
        category: 'analytics',
        resource: 'analytics',
        action: 'read',
      },
      // Settings permissions
      {
        id: 'manage:settings',
        name: 'Manage Settings',
        description: 'Update bot settings and configuration',
        category: 'settings',
        resource: 'settings',
        action: 'manage',
      },
      // User management permissions
      {
        id: 'read:users',
        name: 'Read Users',
        description: 'View user accounts and profiles',
        category: 'users',
        resource: 'users',
        action: 'read',
      },
      {
        id: 'write:users',
        name: 'Write Users',
        description: 'Create, update, and manage user accounts',
        category: 'users',
        resource: 'users',
        action: 'manage',
      },
      // Billing permissions
      {
        id: 'read:billing',
        name: 'Read Billing',
        description: 'View billing information and invoices',
        category: 'billing',
        resource: 'billing',
        action: 'read',
      },
      {
        id: 'manage:billing',
        name: 'Manage Billing',
        description: 'Update billing settings and payment methods',
        category: 'billing',
        resource: 'billing',
        action: 'manage',
      },
      // Webhook permissions
      {
        id: 'webhook:receive',
        name: 'Receive Webhooks',
        description: 'Receive and process webhook notifications',
        category: 'webhooks',
        resource: 'webhooks',
        action: 'create',
      },
      {
        id: 'manage:webhooks',
        name: 'Manage Webhooks',
        description: 'Configure webhook endpoints and settings',
        category: 'webhooks',
        resource: 'webhooks',
        action: 'manage',
      },
      // Admin permissions
      {
        id: 'admin:all',
        name: 'Full Admin Access',
        description: 'Complete administrative access to all resources',
        category: 'admin',
        resource: 'all',
        action: 'all',
      },
    ];
  }

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(category: PermissionCategory): Permission[] {
    return this.getAvailablePermissions().filter(p => p.category === category);
  }

  // ===== ROLE MANAGEMENT =====

  /**
   * Get system roles
   */
  getSystemRoles(): Role[] {
    const permissions = this.getAvailablePermissions();
    
    return [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full access to all tenant resources and settings',
        permissions: permissions.filter(p => 
          p.id === 'admin:all' || 
          p.category !== 'admin'
        ),
        isSystemRole: true,
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Manage services, bookings, and view analytics',
        permissions: permissions.filter(p => 
          ['read:services', 'write:services', 'read:conversations', 'write:conversations',
           'read:bookings', 'write:bookings', 'read:analytics', 'read:users'].includes(p.id)
        ),
        isSystemRole: true,
      },
      {
        id: 'user',
        name: 'User',
        description: 'Basic access to services and bookings',
        permissions: permissions.filter(p => 
          ['read:services', 'write:services', 'read:conversations', 'write:conversations',
           'read:bookings', 'write:bookings'].includes(p.id)
        ),
        isSystemRole: true,
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to services, conversations, and bookings',
        permissions: permissions.filter(p => 
          ['read:services', 'read:conversations', 'read:bookings', 'read:analytics'].includes(p.id)
        ),
        isSystemRole: true,
      },
      {
        id: 'api_user',
        name: 'API User',
        description: 'API access for external integrations',
        permissions: permissions.filter(p => 
          ['read:services', 'read:bookings', 'webhook:receive'].includes(p.id)
        ),
        isSystemRole: true,
      },
    ];
  }

  /**
   * Get role by ID
   */
  getRoleById(roleId: string): Role | null {
    const systemRoles = this.getSystemRoles();
    return systemRoles.find(role => role.id === roleId) || null;
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<ServiceResponse<ApiPermission[]>> {
    try {
      // Get user
      const [user] = await this.db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.id, userId),
            eq(schema.users.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            tenantId,
          },
        };
      }

      const role = this.getRoleById(user.role);
      if (!role) {
        return {
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'User has invalid role',
            tenantId,
          },
        };
      }

      const permissions = role.permissions.map(p => p.id as ApiPermission);

      return {
        success: true,
        data: permissions,
      };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return {
        success: false,
        error: {
          code: 'PERMISSIONS_FETCH_FAILED',
          message: 'Failed to fetch user permissions',
          tenantId,
        },
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    permission: ApiPermission
  ): Promise<boolean> {
    try {
      const result = await this.getUserPermissions(userId, tenantId);
      if (!result.success) {
        return false;
      }

      const userPermissions = result.data!;
      return userPermissions.includes(permission) || userPermissions.includes('admin:all');
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    userId: string,
    tenantId: string,
    permissions: ApiPermission[]
  ): Promise<boolean> {
    try {
      const result = await this.getUserPermissions(userId, tenantId);
      if (!result.success) {
        return false;
      }

      const userPermissions = result.data!;
      
      // Admin has all permissions
      if (userPermissions.includes('admin:all')) {
        return true;
      }

      return permissions.some(permission => userPermissions.includes(permission));
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Check if user has all specified permissions
   */
  async hasAllPermissions(
    userId: string,
    tenantId: string,
    permissions: ApiPermission[]
  ): Promise<boolean> {
    try {
      const result = await this.getUserPermissions(userId, tenantId);
      if (!result.success) {
        return false;
      }

      const userPermissions = result.data!;
      
      // Admin has all permissions
      if (userPermissions.includes('admin:all')) {
        return true;
      }

      return permissions.every(permission => userPermissions.includes(permission));
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // ===== USER ROLE MANAGEMENT =====

  /**
   * Update user role
   */
  async updateUserRole(
    tenantId: string,
    userId: string,
    newRole: UserRole,
    updatedBy: string
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      // Validate new role exists
      const role = this.getRoleById(newRole);
      if (!role) {
        return {
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid role specified',
            tenantId,
          },
        };
      }

      // Check if updater has permission to change roles
      const canUpdateRoles = await this.hasPermission(updatedBy, tenantId, 'write:users');
      if (!canUpdateRoles) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'User does not have permission to update roles',
            tenantId,
          },
        };
      }

      // Update user role
      const [updatedUser] = await this.db
        .update(schema.users)
        .set({
          role: newRole,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.users.id, userId),
            eq(schema.users.tenantId, tenantId)
          )
        )
        .returning();

      if (!updatedUser) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            tenantId,
          },
        };
      }

      // Get tenant info for user profile
      const [tenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .limit(1);

      const userProfile: UserProfile = {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role as UserRole,
        firstName: updatedUser.firstName || undefined,
        lastName: updatedUser.lastName || undefined,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin || undefined,
        tenant: {
          id: tenant!.id,
          businessName: tenant!.businessName,
          domain: tenant!.domain,
        },
      };

      // Log role change
      await this.logRoleChange(tenantId, userId, newRole, updatedBy);

      return {
        success: true,
        data: userProfile,
        metadata: { roleUpdated: true },
      };
    } catch (error) {
      console.error('Error updating user role:', error);
      return {
        success: false,
        error: {
          code: 'ROLE_UPDATE_FAILED',
          message: 'Failed to update user role',
          tenantId,
        },
      };
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(tenantId: string, role: UserRole): Promise<ServiceResponse<UserProfile[]>> {
    try {
      const results = await this.db
        .select({
          user: schema.users,
          tenant: {
            id: schema.tenants.id,
            businessName: schema.tenants.businessName,
            domain: schema.tenants.domain,
          },
        })
        .from(schema.users)
        .innerJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
        .where(
          and(
            eq(schema.users.tenantId, tenantId),
            eq(schema.users.role, role),
            eq(schema.users.isActive, true)
          )
        );

      const users: UserProfile[] = results.map(({ user, tenant }) => ({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        isActive: user.isActive,
        lastLogin: user.lastLogin || undefined,
        tenant,
      }));

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      console.error('Error getting users by role:', error);
      return {
        success: false,
        error: {
          code: 'USERS_BY_ROLE_FAILED',
          message: 'Failed to get users by role',
          tenantId,
        },
      };
    }
  }

  // ===== ACCESS CONTROL CHECKS =====

  /**
   * Check if user can access resource
   */
  async checkAccess(
    userId: string,
    tenantId: string,
    resource: string,
    action: PermissionAction,
    resourceId?: string
  ): Promise<AccessControlCheck> {
    try {
      const permissionsResult = await this.getUserPermissions(userId, tenantId);
      if (!permissionsResult.success) {
        return {
          allowed: false,
          reason: 'Failed to get user permissions',
        };
      }

      const userPermissions = permissionsResult.data!;

      // Admin has access to everything
      if (userPermissions.includes('admin:all')) {
        return { allowed: true };
      }

      // Check specific permissions
      const requiredPermissions = this.getRequiredPermissions(resource, action);
      const hasPermission = requiredPermissions.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return {
          allowed: false,
          reason: 'Insufficient permissions',
          requiredPermissions: requiredPermissions.map(p => p.toString()),
          userPermissions: userPermissions.map(p => p.toString()),
        };
      }

      // Additional resource-specific checks
      if (resourceId) {
        const resourceCheck = await this.checkResourceAccess(
          userId,
          tenantId,
          resource,
          resourceId
        );
        if (!resourceCheck.allowed) {
          return resourceCheck;
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking access:', error);
      return {
        allowed: false,
        reason: 'Access check failed',
      };
    }
  }

  /**
   * Check bulk access for multiple resources
   */
  async checkBulkAccess(
    userId: string,
    tenantId: string,
    checks: Array<{
      resource: string;
      action: PermissionAction;
      resourceId?: string;
    }>
  ): Promise<ServiceResponse<AccessControlCheck[]>> {
    try {
      const results = await Promise.all(
        checks.map(check =>
          this.checkAccess(userId, tenantId, check.resource, check.action, check.resourceId)
        )
      );

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error('Error checking bulk access:', error);
      return {
        success: false,
        error: {
          code: 'BULK_ACCESS_CHECK_FAILED',
          message: 'Failed to check bulk access',
          tenantId,
        },
      };
    }
  }

  // ===== TENANT ADMIN MANAGEMENT =====

  /**
   * Get tenant administrators
   */
  async getTenantAdmins(tenantId: string): Promise<ServiceResponse<UserProfile[]>> {
    return this.getUsersByRole(tenantId, 'admin');
  }

  /**
   * Promote user to admin
   */
  async promoteToAdmin(
    tenantId: string,
    userId: string,
    promotedBy: string
  ): Promise<ServiceResponse<UserProfile>> {
    return this.updateUserRole(tenantId, userId, 'admin', promotedBy);
  }

  /**
   * Demote admin to regular user
   */
  async demoteFromAdmin(
    tenantId: string,
    userId: string,
    demotedBy: string
  ): Promise<ServiceResponse<UserProfile>> {
    // Ensure there's at least one admin remaining
    const adminsResult = await this.getTenantAdmins(tenantId);
    if (adminsResult.success && adminsResult.data!.length <= 1) {
      return {
        success: false,
        error: {
          code: 'CANNOT_REMOVE_LAST_ADMIN',
          message: 'Cannot remove the last administrator',
          tenantId,
        },
      };
    }

    return this.updateUserRole(tenantId, userId, 'user', demotedBy);
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Initialize system roles and permissions
   */
  private initializeSystemRoles(): void {
    const systemRoles = this.getSystemRoles();
    systemRoles.forEach(role => {
      this.roleCache.set(role.id, role);
    });

    const permissions = this.getAvailablePermissions();
    this.permissionCache.set('system', permissions);
  }

  /**
   * Get required permissions for resource and action
   */
  private getRequiredPermissions(resource: string, action: PermissionAction): ApiPermission[] {
    const permissionMap: Record<string, Record<PermissionAction, ApiPermission[]>> = {
      services: {
        create: ['write:services'],
        read: ['read:services'],
        update: ['write:services'],
        delete: ['write:services'],
        manage: ['write:services'],
        all: ['admin:all'],
      },
      conversations: {
        create: ['write:conversations'],
        read: ['read:conversations'],
        update: ['write:conversations'],
        delete: ['write:conversations'],
        manage: ['write:conversations'],
        all: ['admin:all'],
      },
      bookings: {
        create: ['write:bookings'],
        read: ['read:bookings'],
        update: ['write:bookings'],
        delete: ['write:bookings'],
        manage: ['write:bookings'],
        all: ['admin:all'],
      },
      analytics: {
        create: ['admin:all'],
        read: ['read:analytics'],
        update: ['admin:all'],
        delete: ['admin:all'],
        manage: ['admin:all'],
        all: ['admin:all'],
      },
      settings: {
        create: ['manage:settings'],
        read: ['read:services'], // Basic settings can be read by service readers
        update: ['manage:settings'],
        delete: ['admin:all'],
        manage: ['manage:settings'],
        all: ['admin:all'],
      },
      users: {
        create: ['write:users'],
        read: ['read:users'],
        update: ['write:users'],
        delete: ['write:users'],
        manage: ['write:users'],
        all: ['admin:all'],
      },
      billing: {
        create: ['admin:all'],
        read: ['read:billing'],
        update: ['manage:billing'],
        delete: ['admin:all'],
        manage: ['manage:billing'],
        all: ['admin:all'],
      },
      webhooks: {
        create: ['webhook:receive'],
        read: ['read:analytics'],
        update: ['manage:webhooks'],
        delete: ['manage:webhooks'],
        manage: ['manage:webhooks'],
        all: ['admin:all'],
      },
    };

    return permissionMap[resource]?.[action] || ['admin:all'];
  }

  /**
   * Check resource-specific access rules
   */
  private async checkResourceAccess(
    userId: string,
    tenantId: string,
    resource: string,
    resourceId: string
  ): Promise<AccessControlCheck> {
    try {
      // Resource-specific access checks
      switch (resource) {
        case 'users':
          // Users can always access their own profile
          if (userId === resourceId) {
            return { allowed: true };
          }
          break;

        case 'services':
        case 'conversations':
        case 'bookings':
          // These resources are tenant-scoped, so if user has permission and is in same tenant, allow access
          return { allowed: true };

        default:
          return { allowed: true };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking resource access:', error);
      return {
        allowed: false,
        reason: 'Resource access check failed',
      };
    }
  }

  /**
   * Log role changes for audit
   */
  private async logRoleChange(
    tenantId: string,
    userId: string,
    newRole: UserRole,
    changedBy: string
  ): Promise<void> {
    try {
      // In a real implementation, would insert into audit log
      console.log(`Role Change: User ${userId} in tenant ${tenantId} changed to ${newRole} by ${changedBy}`);
    } catch (error) {
      console.error('Error logging role change:', error);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}