import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, KeyIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import KeyGenerator from '../components/API/KeyGenerator';
import { useAPIKeyStore } from '../store/apiKeyStore';
import { useToastStore } from '../store/toastStore';

const APIKeysPage: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const { apiKeys, loadAPIKeys, deleteAPIKey } = useAPIKeyStore();
  const [showGenerator, setShowGenerator] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAPIKeys();
  }, [loadAPIKeys]);

  const handleDeleteKey = async (keyId: string) => {
    if (window.confirm(t('apiKeys.confirmDelete'))) {
      try {
        await deleteAPIKey(keyId);
        addToast(
          'success',
          t('success.deleted'),
          t('apiKeys.keyDeleted')
        );
      } catch (error) {
        console.error('Failed to delete API key:', error);
        addToast(
          'error',
          t('errors.generic'),
          t('apiKeys.deleteFailed')
        );
      }
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const maskKey = (key: string): string => {
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'expired':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'revoked':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('apiKeys.title')}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('apiKeys.subtitle')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowGenerator(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>{t('apiKeys.generateKey')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <KeyIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {t('apiKeys.securityNotice')}
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              {t('apiKeys.securityNoticeDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('apiKeys.yourKeys')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('apiKeys.keysDescription')}
          </p>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('apiKeys.noKeys')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('apiKeys.noKeysDesc')}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowGenerator(true)}
                className="btn btn-primary"
              >
                {t('apiKeys.generateFirstKey')}
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('apiKeys.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('apiKeys.key')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('apiKeys.permissions')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('apiKeys.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('apiKeys.lastUsed')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('apiKeys.expires')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {apiKey.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {apiKey.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apiKey.status)}`}>
                        {t(`apiKeys.statuses.${apiKey.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : t('apiKeys.neverUsed')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : t('apiKeys.neverExpires')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteKey(apiKey.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Key Generator Modal */}
      {showGenerator && (
        <KeyGenerator onClose={() => setShowGenerator(false)} />
      )}
    </div>
  );
};

export default APIKeysPage;