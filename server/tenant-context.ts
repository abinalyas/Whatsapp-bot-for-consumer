import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';

export class TenantContext {
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle({ client: this.pool, schema });
  }

  /**
   * Execute a function with tenant context set
   */
  async withTenantContext<T>(
    tenantId: string,
    operation: (db: ReturnType<typeof drizzle>) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      // Set tenant context for this connection
      await client.query('SELECT set_tenant_context($1)', [tenantId]);
      
      // Create a database instance with this specific client
      const contextDb = drizzle({ client, schema });
      
      // Execute the operation with tenant context
      const result = await operation(contextDb);
      
      return result;
    } finally {
      // Clear tenant context and release connection
      await client.query('SELECT clear_tenant_context()').catch(() => {});
      client.release();
    }
  }

  /**
   * Validate that a tenant exists and is active
   */
  async validateTenant(tenantId: string): Promise<boolean> {
    try {
      const result = await this.db
        .select({ id: schema.tenants.id })
        .from(schema.tenants)
        .where(schema.tenants.id === tenantId && schema.tenants.status === 'active')
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error('Error validating tenant:', error);
      return false;
    }
  }

  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain: string): Promise<schema.Tenant | null> {
    try {
      const result = await this.db
        .select()
        .from(schema.tenants)
        .where(schema.tenants.domain === domain)
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error getting tenant by domain:', error);
      return null;
    }
  }

  /**
   * Ensure all queries in a transaction include tenant_id filtering
   */
  async withTenantTransaction<T>(
    tenantId: string,
    operation: (db: ReturnType<typeof drizzle>) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_tenant_context($1)', [tenantId]);
      
      const contextDb = drizzle({ client, schema });
      const result = await operation(contextDb);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      await client.query('SELECT clear_tenant_context()').catch(() => {});
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Middleware for Express to set tenant context
export function tenantContextMiddleware(tenantContext: TenantContext) {
  return async (req: any, res: any, next: any) => {
    try {
      // Extract tenant ID from various sources
      let tenantId: string | null = null;
      
      // 1. From API key (if using API key authentication)
      if (req.headers['x-api-key']) {
        // This would be implemented in the API key validation logic
        tenantId = await extractTenantFromApiKey(req.headers['x-api-key'], tenantContext);
      }
      
      // 2. From JWT token (if using JWT authentication)
      if (!tenantId && req.user?.tenantId) {
        tenantId = req.user.tenantId;
      }
      
      // 3. From subdomain (e.g., tenant1.example.com)
      if (!tenantId && req.headers.host) {
        const subdomain = req.headers.host.split('.')[0];
        const tenant = await tenantContext.getTenantByDomain(`${subdomain}.example.com`);
        tenantId = tenant?.id || null;
      }
      
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant context required' });
      }
      
      // Validate tenant
      const isValidTenant = await tenantContext.validateTenant(tenantId);
      if (!isValidTenant) {
        return res.status(403).json({ error: 'Invalid or inactive tenant' });
      }
      
      // Add tenant context to request
      req.tenantId = tenantId;
      req.tenantContext = tenantContext;
      
      next();
    } catch (error) {
      console.error('Tenant context middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

async function extractTenantFromApiKey(apiKey: string, tenantContext: TenantContext): Promise<string | null> {
  // This would hash the API key and look it up in the api_keys table
  // For now, return null as this will be implemented in the API key management task
  return null;
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantContext?: TenantContext;
    }
  }
}