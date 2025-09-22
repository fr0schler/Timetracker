import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAPIKeyStore } from '../../store/apiKeyStore';
import { useToastStore } from '../../store/toastStore';
import { CreateAPIKeyData } from '../../types/apiKey';

interface KeyGeneratorProps {
  onClose: () => void;
}

const KeyGenerator: React.FC<KeyGeneratorProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { createAPIKey } = useAPIKeyStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<'configure' | 'generated'>('configure');
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    expiresInDays: 30,
    neverExpires: false,
  });

  const availablePermissions = [
    { id: 'read', name: t('apiKeys.permissions.read'), description: t('apiKeys.permissions.readDesc') },
    { id: 'write', name: t('apiKeys.permissions.write'), description: t('apiKeys.permissions.writeDesc') },
    { id: 'delete', name: t('apiKeys.permissions.delete'), description: t('apiKeys.permissions.deleteDesc') },
    { id: 'admin', name: t('apiKeys.permissions.admin'), description: t('apiKeys.permissions.adminDesc') },
  ];

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleGenerate = async () => {
    if (!formData.name.trim() || formData.permissions.length === 0) {
      addToast(
        'error',
        t('errors.validationError'),
        t('apiKeys.fillRequiredFields')
      );
      return;
    }

    try {
      setIsGenerating(true);

      const createData: CreateAPIKeyData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions,
        expiresAt: formData.neverExpires ? null : new Date(Date.now() + formData.expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      };

      const result = await createAPIKey(createData);
      setGeneratedKey(result.key);
      setStep('generated');

      addToast(
        'success',
        t('success.created'),
        t('apiKeys.keyGenerated')
      );
    } catch (error) {
      console.error('Failed to generate API key:', error);
      addToast(
        'error',
        t('errors.generic'),
        t('apiKeys.generationFailed')
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast(
        'success',
        t('apiKeys.copied'),
        t('apiKeys.copiedToClipboard')
      );
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      addToast(
        'error',
        t('errors.generic'),
        t('apiKeys.copyFailed')
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {step === 'configure' ? t('apiKeys.generateNewKey') : t('apiKeys.keyGenerated')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {step === 'configure' ? (
            // Configuration Step
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('apiKeys.keyName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder={t('apiKeys.keyNamePlaceholder')}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('apiKeys.keyDescription')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder={t('apiKeys.keyDescriptionPlaceholder')}
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('apiKeys.permissions.title')} *
                </label>
                <div className="space-y-3">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {permission.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('apiKeys.expiration')}
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.neverExpires}
                      onChange={(e) => setFormData(prev => ({ ...prev, neverExpires: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('apiKeys.neverExpires')}
                    </span>
                  </label>

                  {!formData.neverExpires && (
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {t('apiKeys.expiresIn')}
                      </label>
                      <select
                        value={formData.expiresInDays}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) }))}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value={30}>{t('apiKeys.expirationOptions.30days')}</option>
                        <option value={60}>{t('apiKeys.expirationOptions.60days')}</option>
                        <option value={90}>{t('apiKeys.expirationOptions.90days')}</option>
                        <option value={365}>{t('apiKeys.expirationOptions.1year')}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Generated Key Step
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  {t('apiKeys.keyGeneratedSuccess')}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t('apiKeys.keyGeneratedDesc')}
                </p>
              </div>

              {/* Generated Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('apiKeys.yourNewKey')}
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-sm font-mono bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded border">
                    {generatedKey}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClipboardIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  {t('apiKeys.importantNote')}
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t('apiKeys.saveKeyWarning')}
                </p>
              </div>

              {/* Key Details */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t('apiKeys.keyDetails')}
                </h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">{t('apiKeys.name')}:</dt>
                    <dd className="text-sm text-gray-900 dark:text-gray-100">{formData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">{t('apiKeys.permissions')}:</dt>
                    <dd className="text-sm text-gray-900 dark:text-gray-100">
                      {formData.permissions.join(', ')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">{t('apiKeys.expires')}:</dt>
                    <dd className="text-sm text-gray-900 dark:text-gray-100">
                      {formData.neverExpires
                        ? t('apiKeys.neverExpires')
                        : new Date(Date.now() + formData.expiresInDays * 24 * 60 * 60 * 1000).toLocaleDateString()
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3">
            {step === 'configure' ? (
              <>
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!formData.name.trim() || formData.permissions.length === 0 || isGenerating}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('apiKeys.generating')}</span>
                    </div>
                  ) : (
                    t('apiKeys.generateKey')
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="btn btn-primary"
              >
                {t('common.close')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyGenerator;