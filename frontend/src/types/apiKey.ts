export interface APIKey {
  id: string;
  name: string;
  description: string;
  key: string;
  permissions: string[];
  status: 'active' | 'expired' | 'revoked';
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
  usageCount: number;
}

export interface CreateAPIKeyData {
  name: string;
  description: string;
  permissions: string[];
  expiresAt: string | null;
}

export interface CreateAPIKeyResult {
  id: string;
  key: string;
  name: string;
  permissions: string[];
  expiresAt: string | null;
}