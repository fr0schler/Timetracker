import { create } from 'zustand';
import { APIKey, CreateAPIKeyData, CreateAPIKeyResult } from '../types/apiKey';
import { apiKeyService } from '../services/apiKeyService';

interface APIKeyStore {
  apiKeys: APIKey[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAPIKeys: () => Promise<void>;
  createAPIKey: (data: CreateAPIKeyData) => Promise<CreateAPIKeyResult>;
  deleteAPIKey: (id: string) => Promise<void>;
  revokeAPIKey: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAPIKeyStore = create<APIKeyStore>((set, get) => ({
  apiKeys: [],
  isLoading: false,
  error: null,

  loadAPIKeys: async () => {
    try {
      set({ isLoading: true, error: null });
      const apiKeys = await apiKeyService.getAPIKeys();
      set({ apiKeys, isLoading: false });
    } catch (error) {
      console.error('Failed to load API keys:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load API keys',
        isLoading: false
      });
    }
  },

  createAPIKey: async (data: CreateAPIKeyData) => {
    try {
      set({ isLoading: true, error: null });
      const result = await apiKeyService.createAPIKey(data);

      // Add the new API key to the list (but without the actual key for security)
      const newAPIKey: APIKey = {
        id: result.id,
        name: result.name,
        description: data.description,
        key: result.key, // This will be masked in the UI
        permissions: result.permissions,
        status: 'active',
        lastUsed: null,
        createdAt: new Date().toISOString(),
        expiresAt: result.expiresAt,
        usageCount: 0,
      };

      const { apiKeys } = get();
      set({
        apiKeys: [newAPIKey, ...apiKeys],
        isLoading: false
      });

      return result;
    } catch (error) {
      console.error('Failed to create API key:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create API key',
        isLoading: false
      });
      throw error;
    }
  },

  deleteAPIKey: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await apiKeyService.deleteAPIKey(id);
      const { apiKeys } = get();
      set({
        apiKeys: apiKeys.filter(key => key.id !== id),
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to delete API key:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete API key',
        isLoading: false
      });
      throw error;
    }
  },

  revokeAPIKey: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await apiKeyService.revokeAPIKey(id);
      const { apiKeys } = get();
      set({
        apiKeys: apiKeys.map(key =>
          key.id === id ? { ...key, status: 'revoked' as const } : key
        ),
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to revoke API key',
        isLoading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));