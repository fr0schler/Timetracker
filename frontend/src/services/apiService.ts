import axios from 'axios';

export interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters: APIParameter[];
  responseFormat: 'json' | 'csv' | 'xml';
  requiresAuth: boolean;
  rateLimit?: number;
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
  rateLimit: number;
  usageCount: number;
}

export interface APIUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: {
    endpoint: string;
    count: number;
  }[];
  dailyUsage: {
    date: string;
    requests: number;
    errors: number;
  }[];
}

class APIService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Authentication
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  // API Key Management
  async createAPIKey(data: {
    name: string;
    permissions: string[];
    rateLimit?: number;
  }): Promise<APIKey> {
    const response = await axios.post(`${this.baseURL}/api-keys`, data, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async getAPIKeys(): Promise<APIKey[]> {
    const response = await axios.get(`${this.baseURL}/api-keys`, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async updateAPIKey(id: string, data: Partial<APIKey>): Promise<APIKey> {
    const response = await axios.put(`${this.baseURL}/api-keys/${id}`, data, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async deleteAPIKey(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/api-keys/${id}`, {
      headers: this.defaultHeaders
    });
  }

  async regenerateAPIKey(id: string): Promise<APIKey> {
    const response = await axios.post(`${this.baseURL}/api-keys/${id}/regenerate`, {}, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  // API Documentation
  async getAPIEndpoints(): Promise<APIEndpoint[]> {
    const response = await axios.get(`${this.baseURL}/docs/endpoints`, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async getAPIDocumentation(): Promise<any> {
    const response = await axios.get(`${this.baseURL}/docs/openapi.json`, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  // Usage Statistics
  async getUsageStats(timeRange?: string): Promise<APIUsageStats> {
    const params = timeRange ? { timeRange } : {};
    const response = await axios.get(`${this.baseURL}/api-keys/usage`, {
      headers: this.defaultHeaders,
      params
    });
    return response.data;
  }

  async getKeyUsageStats(keyId: string, timeRange?: string): Promise<APIUsageStats> {
    const params = timeRange ? { timeRange } : {};
    const response = await axios.get(`${this.baseURL}/api-keys/${keyId}/usage`, {
      headers: this.defaultHeaders,
      params
    });
    return response.data;
  }

  // Data Export API
  async exportTimeEntries(params: {
    startDate?: string;
    endDate?: string;
    projectIds?: string[];
    format?: 'json' | 'csv' | 'xml';
    includeProjects?: boolean;
    includeStatistics?: boolean;
  }): Promise<any> {
    const response = await axios.get(`${this.baseURL}/export/time-entries`, {
      headers: this.defaultHeaders,
      params
    });
    return response.data;
  }

  async exportProjects(params: {
    format?: 'json' | 'csv' | 'xml';
    includeStatistics?: boolean;
  }): Promise<any> {
    const response = await axios.get(`${this.baseURL}/export/projects`, {
      headers: this.defaultHeaders,
      params
    });
    return response.data;
  }

  async exportReports(params: {
    reportType: 'summary' | 'detailed' | 'productivity';
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'pdf' | 'csv';
    includeCharts?: boolean;
  }): Promise<any> {
    const response = await axios.get(`${this.baseURL}/export/reports`, {
      headers: this.defaultHeaders,
      params
    });
    return response.data;
  }

  // Webhook Management
  async createWebhook(data: {
    url: string;
    events: string[];
    secret?: string;
    isActive?: boolean;
  }): Promise<any> {
    const response = await axios.post(`${this.baseURL}/webhooks`, data, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async getWebhooks(): Promise<any[]> {
    const response = await axios.get(`${this.baseURL}/webhooks`, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async updateWebhook(id: string, data: any): Promise<any> {
    const response = await axios.put(`${this.baseURL}/webhooks/${id}`, data, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async deleteWebhook(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/webhooks/${id}`, {
      headers: this.defaultHeaders
    });
  }

  async testWebhook(id: string): Promise<any> {
    const response = await axios.post(`${this.baseURL}/webhooks/${id}/test`, {}, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  // Integration APIs
  async getIntegrations(): Promise<any[]> {
    const response = await axios.get(`${this.baseURL}/integrations`, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async createIntegration(data: {
    type: 'slack' | 'discord' | 'teams' | 'email';
    config: any;
    isActive?: boolean;
  }): Promise<any> {
    const response = await axios.post(`${this.baseURL}/integrations`, data, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async updateIntegration(id: string, data: any): Promise<any> {
    const response = await axios.put(`${this.baseURL}/integrations/${id}`, data, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  async deleteIntegration(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/integrations/${id}`, {
      headers: this.defaultHeaders
    });
  }

  async testIntegration(id: string): Promise<any> {
    const response = await axios.post(`${this.baseURL}/integrations/${id}/test`, {}, {
      headers: this.defaultHeaders
    });
    return response.data;
  }

  // Error handling wrapper
  // private async makeRequest<T>(
  //   method: 'get' | 'post' | 'put' | 'delete',
  //   url: string,
  //   data?: any,
  //   params?: any
  // ): Promise<T> {
  //   try {
  //     const response = await axios({
  //       method,
  //       url: `${this.baseURL}${url}`,
  //       data,
  //       params,
  //       headers: this.defaultHeaders
  //     });
  //     return response.data;
  //   } catch (error) {
  //     if (axios.isAxiosError(error)) {
  //       if (error.response?.status === 401) {
  //         throw new Error('Authentication failed. Please check your API key.');
  //       } else if (error.response?.status === 403) {
  //         throw new Error('Access denied. Insufficient permissions.');
  //       } else if (error.response?.status === 429) {
  //         throw new Error('Rate limit exceeded. Please try again later.');
  //       } else if (error.response?.status && error.response.status >= 500) {
  //         throw new Error('Server error. Please try again later.');
  //       } else {
  //         throw new Error(error.response?.data?.message || 'Request failed.');
  //       }
  //     }
  //     throw new Error('Network error. Please check your connection.');
  //   }
  // }

  // Helper methods for common operations
  async validateAPIKey(key: string): Promise<boolean> {
    try {
      await axios.get(`${this.baseURL}/auth/validate`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return true;
    } catch {
      return false;
    }
  }

  formatAPIResponse(data: any, format: 'json' | 'csv' | 'xml'): string {
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'xml':
        return this.convertToXML(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private convertToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  private convertToXML(data: any): string {
    const toXML = (obj: any, rootName = 'root'): string => {
      let xml = `<${rootName}>`;

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          xml += toXML(item, `item${index}`);
        });
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            xml += `<${key}>`;
            value.forEach((item, index) => {
              xml += toXML(item, `item${index}`);
            });
            xml += `</${key}>`;
          } else if (typeof value === 'object' && value !== null) {
            xml += toXML(value, key);
          } else {
            xml += `<${key}>${value}</${key}>`;
          }
        });
      } else {
        xml += obj;
      }

      xml += `</${rootName}>`;
      return xml;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n${toXML(data)}`;
  }
}

export const apiService = new APIService();