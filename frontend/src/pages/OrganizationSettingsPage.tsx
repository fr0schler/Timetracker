import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building,
  Palette,
  CreditCard,
  Users,
  Settings
} from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import BrandingSettings from '../components/Organization/BrandingSettings';
import api from '../services/api';

interface OrganizationSettings {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  brand_color?: string;
  website_url?: string;
  subscription_tier: 'free' | 'professional' | 'enterprise';
  max_users: number;
  max_projects: number;
  created_at: string;
}

const OrganizationSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [organization, setOrganization] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadOrganizationSettings();
  }, []);

  const loadOrganizationSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/organizations/settings');
      setOrganization(response.data);
    } catch (error) {
      console.error('Error loading organization settings:', error);
      addToast('error', t('organization.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<OrganizationSettings>) => {
    if (!organization) return;

    try {
      const response = await api.put('/api/v1/organizations/settings', updates);
      setOrganization(response.data);
      addToast('success', t('organization.updateSuccess'));
    } catch (error: any) {
      const message = error.response?.data?.detail || t('organization.updateError');
      addToast('error', message);
      throw error;
    }
  };

  const tabs = [
    {
      id: 'general',
      name: t('organization.generalSettings'),
      icon: Building,
      current: activeTab === 'general'
    },
    {
      id: 'branding',
      name: t('organization.branding'),
      icon: Palette,
      current: activeTab === 'branding'
    },
    {
      id: 'subscription',
      name: t('organization.subscription'),
      icon: CreditCard,
      current: activeTab === 'subscription'
    },
    {
      id: 'members',
      name: t('organization.members'),
      icon: Users,
      current: activeTab === 'members'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('organization.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('organization.settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('organization.settingsDescription')}
          </p>
        </div>
      </div>

      {/* Organization Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <Building className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {organization.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {organization.description || t('organization.noDescription')}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('organization.plan')}: {t(`plans.${organization.subscription_tier}`)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('organization.members')}: {organization.max_users === -1 ? t('common.unlimited') : organization.max_users}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('organization.projects')}: {organization.max_projects === -1 ? t('common.unlimited') : organization.max_projects}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  tab.current
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'general' && (
          <GeneralSettings organization={organization} onUpdate={handleUpdateSettings} />
        )}

        {activeTab === 'branding' && (
          <BrandingSettings organization={organization} onUpdate={handleUpdateSettings} />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionSettings organization={organization} />
        )}

        {activeTab === 'members' && (
          <MembersSettings organization={organization} />
        )}
      </div>
    </div>
  );
};

// General Settings Component
const GeneralSettings: React.FC<{
  organization: OrganizationSettings;
  onUpdate: (updates: Partial<OrganizationSettings>) => Promise<void>;
}> = ({ organization, onUpdate }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: organization.name,
    slug: organization.slug,
    description: organization.description || '',
    website_url: organization.website_url || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdate(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('organization.generalSettings')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
          {t('organization.generalDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('organization.name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('organization.slug')} *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="company-name"
              pattern="[a-z0-9-]+"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('organization.slugHelp')}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('organization.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            rows={3}
            placeholder={t('organization.descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('organization.website')}
          </label>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="https://company.com"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{t('common.save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// Subscription Settings Component
const SubscriptionSettings: React.FC<{ organization: OrganizationSettings }> = ({ organization }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('organization.subscription')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
          {t('organization.subscriptionDescription')}
        </p>
      </div>

      <div className="p-6">
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('organization.subscriptionManagement')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('organization.currentPlan')}: <strong>{t(`plans.${organization.subscription_tier}`)}</strong>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('organization.subscriptionNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

// Members Settings Component
const MembersSettings: React.FC<{ organization: OrganizationSettings }> = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('organization.members')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
          {t('organization.membersDescription')}
        </p>
      </div>

      <div className="p-6">
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('organization.teamManagement')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('organization.teamManagementDescription')}
          </p>
          <button
            onClick={() => window.location.href = '/team'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {t('organization.goToTeamManagement')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettingsPage;