import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PhotoIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { useToastStore } from '../../store/toastStore';

interface OrganizationSettings {
  id: number;
  name: string;
  logo_url?: string;
  brand_color?: string;
  website_url?: string;
}

interface BrandingSettingsProps {
  organization: OrganizationSettings;
  onUpdate: (updates: Partial<OrganizationSettings>) => Promise<void>;
}

const BrandingSettings: React.FC<BrandingSettingsProps> = ({ organization, onUpdate }) => {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    brand_color: organization.brand_color || '#3B82F6',
    logo_url: organization.logo_url || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization.logo_url || null);

  const colorPresets = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, brand_color: color });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast(t('branding.logoInvalidType'), 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast(t('branding.logoTooLarge'), 'error');
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logoUrl = formData.logo_url;

      // Upload logo if a new file was selected
      if (logoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('logo', logoFile);

        // TODO: Replace with actual logo upload endpoint
        // const uploadResponse = await api.post('/api/v1/organizations/logo', formDataUpload, {
        //   headers: { 'Content-Type': 'multipart/form-data' }
        // });
        // logoUrl = uploadResponse.data.url;

        // For now, use the preview URL (this would be the actual uploaded URL in production)
        logoUrl = logoPreview || '';
      }

      await onUpdate({
        brand_color: formData.brand_color,
        logo_url: logoUrl
      });

      // Reset logo file state
      setLogoFile(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData({ ...formData, logo_url: '' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('branding.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
          {t('branding.description')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            {t('branding.logo')}
          </label>

          <div className="flex items-start space-x-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 object-contain rounded-lg"
                  />
                ) : (
                  <PhotoIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <label className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                  {t('branding.uploadLogo')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                  >
                    {t('branding.removeLogo')}
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('branding.logoRequirements')}
              </p>
            </div>
          </div>
        </div>

        {/* Brand Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            {t('branding.primaryColor')}
          </label>

          <div className="space-y-4">
            {/* Color Presets */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('branding.colorPresets')}
              </p>
              <div className="flex flex-wrap gap-3">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      formData.brand_color === color
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {formData.brand_color === color && (
                      <div className="w-full h-full rounded-md flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Input */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('branding.customColor')}
              </p>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="color"
                    value={formData.brand_color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-12 h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                  />
                  <SwatchIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-white pointer-events-none" />
                </div>
                <input
                  type="text"
                  value={formData.brand_color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('branding.preview')}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                style={{ backgroundColor: formData.brand_color }}
                className="px-4 py-2 text-white rounded-lg font-medium"
              >
                {t('branding.primaryButton')}
              </button>
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: formData.brand_color }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('branding.accentColor')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-2"
            style={{ backgroundColor: formData.brand_color }}
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

export default BrandingSettings;