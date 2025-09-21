import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Save, Mail, Clock, FileText } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { UpdateUserProfile } from '../types';
import AvatarUpload from '../components/UserProfile/AvatarUpload';

export default function UserProfilePage() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateUserProfile>({
    full_name: '',
    bio: '',
    timezone: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        bio: user.bio || '',
        timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      addToast('success', t('profile.updateSuccess'), t('profile.updateSuccessMessage'));
    } catch (error) {
      addToast('error', t('profile.updateError'), t('profile.updateErrorMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        bio: user.bio || '',
        timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
    setIsEditing(false);
  };

  const timezones = [
    'UTC',
    'Europe/Berlin',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('profile.title')}
              </h1>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>{t('profile.editProfile')}</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar Section */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <AvatarUpload
                  currentAvatarUrl={user.avatar_url}
                  onAvatarUpdate={() => {
                    // Handle avatar update
                    addToast('success', t('profile.avatarUpdated'), t('profile.avatarUpdatedMessage'));
                  }}
                  disabled={!isEditing}
                />
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {user.full_name || user.email}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('profile.memberSince')} {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    {t('profile.fullName')}
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input w-full"
                    placeholder={t('profile.fullNamePlaceholder')}
                    disabled={!isEditing}
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    {t('profile.email')}
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    className="input w-full bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('profile.emailCannotChange')}
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="h-4 w-4 inline mr-2" />
                    {t('profile.bio')}
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="input w-full resize-none"
                    placeholder={t('profile.bioPlaceholder')}
                    disabled={!isEditing}
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="h-4 w-4 inline mr-2" />
                    {t('profile.timezone')}
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="input w-full"
                    disabled={!isEditing}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isLoading ? t('common.saving') : t('common.save')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-secondary"
                      disabled={isLoading}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}