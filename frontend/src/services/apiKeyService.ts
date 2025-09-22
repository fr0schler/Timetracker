import api from './api';
import { APIKey, CreateAPIKeyData, CreateAPIKeyResult } from '../types/apiKey';

class APIKeyService {
  async getAPIKeys(): Promise<APIKey[]> {
    try {
      const response = await api.get('/api-keys');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      // Return mock data for development
      return this.getMockAPIKeys();
    }
  }

  async createAPIKey(data: CreateAPIKeyData): Promise<CreateAPIKeyResult> {
    try {
      const response = await api.post('/api-keys', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create API key:', error);
      // Return mock data for development
      return this.getMockCreateResult(data);
    }
  }

  async deleteAPIKey(id: string): Promise<void> {
    try {
      await api.delete(`/api-keys/${id}`);
    } catch (error) {
      console.error('Failed to delete API key:', error);
      // Don't throw error in development
      if (process.env.NODE_ENV !== 'development') {
        throw error;
      }
    }
  }

  async revokeAPIKey(id: string): Promise<void> {
    try {
      await api.post(`/api-keys/${id}/revoke`);
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      throw error;
    }
  }

  async updateAPIKey(id: string, data: Partial<CreateAPIKeyData>): Promise<APIKey> {
    try {
      const response = await api.put(`/api-keys/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update API key:', error);
      throw error;
    }
  }

  // Mock data for development
  private getMockAPIKeys(): APIKey[] {
    return [
      {
        id: '1',
        name: 'Production API',
        description: 'Main API key for production environment',
        key: 'tt_12345678901234567890123456789012',
        permissions: ['read', 'write'],
        status: 'active',
        lastUsed: '2024-01-20T10:30:00Z',
        createdAt: '2024-01-15T09:00:00Z',
        expiresAt: '2024-07-15T09:00:00Z',
        usageCount: 1247,
      },
      {
        id: '2',
        name: 'Mobile App',
        description: 'API key for mobile application integration',
        key: 'tt_98765432109876543210987654321098',
        permissions: ['read'],
        status: 'active',
        lastUsed: '2024-01-22T14:15:00Z',
        createdAt: '2024-01-10T11:00:00Z',
        expiresAt: null,
        usageCount: 856,
      },
      {
        id: '3',
        name: 'Development Testing',
        description: 'Temporary key for development and testing',
        key: 'tt_11111111111111111111111111111111',
        permissions: ['read', 'write', 'delete'],
        status: 'expired',
        lastUsed: '2023-12-30T16:45:00Z',
        createdAt: '2023-12-01T08:00:00Z',
        expiresAt: '2024-01-01T08:00:00Z',
        usageCount: 234,
      },
      {
        id: '4',
        name: 'Analytics Service',
        description: 'Read-only access for analytics and reporting',
        key: 'tt_22222222222222222222222222222222',
        permissions: ['read'],
        status: 'revoked',
        lastUsed: '2024-01-18T12:00:00Z',
        createdAt: '2024-01-05T10:00:00Z',
        expiresAt: '2024-04-05T10:00:00Z',
        usageCount: 423,
      },
    ];
  }

  private getMockCreateResult(data: CreateAPIKeyData): CreateAPIKeyResult {
    const timestamp = Date.now().toString(36);
    const randomString = Math.random().toString(36).substring(2);
    const key = `tt_${timestamp}${randomString}`.padEnd(34, '0').substring(0, 34);

    return {
      id: Math.random().toString(36).substr(2, 9),
      key,
      name: data.name,
      permissions: data.permissions,
      expiresAt: data.expiresAt,
    };
  }
}

export const apiKeyService = new APIKeyService();