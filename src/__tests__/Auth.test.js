import { describe, it, expect } from 'vitest';

// Simulating the Tenant resolving logic
const resolveTenantFromUrl = (hostname, tenants) => {
    // haras-san-pablo.equestrian.app
    const match = Object.values(tenants).find(t => t.domain === hostname);
    return match || null;
};

// Mock Data
const MOCK_TENANTS = {
    't1': { id: 't1', domain: 'tenant1.app.com', name: 'Tenant 1' },
    't2': { id: 't2', domain: 'tenant2.app.com', name: 'Tenant 2' }
};

describe('Multi-Tenant Resolution', () => {

    it('should find tenant by exact domain match', () => {
        const result = resolveTenantFromUrl('tenant1.app.com', MOCK_TENANTS);
        expect(result).toBeDefined();
        expect(result.id).toBe('t1');
    });

    it('should return null for unknown domain', () => {
        const result = resolveTenantFromUrl('unknown.com', MOCK_TENANTS);
        expect(result).toBeNull();
    });

});
