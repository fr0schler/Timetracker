import React, { useState, useEffect } from 'react';
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Activity,
  Code,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { APIKey, APIUsageStats, apiService } from '../../services/apiService';
import { format } from 'date-fns';

const APIManager: React.FC = () => {

  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [usageStats, setUsageStats] = useState<APIUsageStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: [] as string[],
    rateLimit: 1000
  });

  const availablePermissions = [
    { id: 'read', name: 'Read Access', description: 'View time entries, projects, and reports' },
    { id: 'write', name: 'Write Access', description: 'Create and update time entries' },
    { id: 'delete', name: 'Delete Access', description: 'Delete time entries and projects' },
    { id: 'export', name: 'Export Access', description: 'Export data in various formats' },
    { id: 'admin', name: 'Admin Access', description: 'Full administrative privileges' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [keys, stats] = await Promise.all([
        apiService.getAPIKeys(),
        apiService.getUsageStats('30d')
      ]);
      setApiKeys(keys);
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load API data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAPIKey = async () => {
    try {
      const newKey = await apiService.createAPIKey(newKeyData);
      setApiKeys(prev => [newKey, ...prev]);
      setShowCreateModal(false);
      setNewKeyData({ name: '', permissions: [], rateLimit: 1000 });
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const regenerateKey = async (keyId: string) => {
    try {
      const updatedKey = await apiService.regenerateAPIKey(keyId);
      setApiKeys(prev => prev.map(key => key.id === keyId ? updatedKey : key));
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    }
  };

  const deleteKey = async (keyId: string) => {
    if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        await apiService.deleteAPIKey(keyId);
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
      } catch (error) {
        console.error('Failed to delete API key:', error);
      }
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyValue(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircle : XCircle;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500 dark:text-gray-400">Loading API management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            API Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage API keys and monitor usage statistics
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </button>
      </div>

      {/* Usage Statistics */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {usageStats.totalRequests.toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {usageStats.requestsToday}
                </p>
              </div>
              <Code className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {usageStats.averageResponseTime}ms
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {usageStats.errorRate.toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${
                usageStats.errorRate > 5 ? 'text-red-500' : 'text-yellow-500'
              }`} />
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            API Keys
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {apiKeys.length === 0 ? (
            <div className="p-6 text-center">
              <Key className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No API keys created yet. Create your first API key to get started.
              </p>
            </div>
          ) : (
            apiKeys.map((key) => {
              const StatusIcon = getStatusIcon(key.isActive);
              return (
                <div key={key.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {key.name}
                        </h4>
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(key.isActive)}`} />
                      </div>

                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Created: {format(key.createdAt, 'MMM dd, yyyy')}</span>
                          {key.lastUsed && (
                            <span>Last used: {format(key.lastUsed, 'MMM dd, yyyy')}</span>
                          )}
                          <span>Usage: {key.usageCount} requests</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm">
                            <span>
                              {showKeyValue[key.id]
                                ? key.key
                                : key.key.substring(0, 8) + '...' + key.key.slice(-4)
                              }
                            </span>
                            <button
                              onClick={() => toggleKeyVisibility(key.id)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showKeyValue[key.id] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(key.key)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {key.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => regenerateKey(key.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Regenerate key"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteKey(key.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* API Documentation Link */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              API Documentation
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Learn how to integrate with the TimeTracker API
            </p>
          </div>
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Docs
          </a>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create API Key
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="e.g., Mobile App Integration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={newKeyData.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyData(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, permission.id]
                            }));
                          } else {
                            setNewKeyData(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(p => p !== permission.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
                      />
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {permission.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rate Limit (requests per hour)
                </label>
                <input
                  type="number"
                  value={newKeyData.rateLimit}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                  className="input"
                  min="100"
                  max="10000"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createAPIKey}
                disabled={!newKeyData.name || newKeyData.permissions.length === 0}
                className="btn btn-primary"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIManager;