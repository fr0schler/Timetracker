import { useState, useRef } from 'react';
import { Camera, User, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageCropper from '../Common/ImageCropper';
import { FileUploadService, FileUploadProgress } from '../../services/fileUpload';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarUpdate: (url: string) => void;
  disabled?: boolean;
}

export default function AvatarUpload({ currentAvatarUrl, onAvatarUpdate, disabled = false }: AvatarUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = FileUploadService.validateFile(file, {
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSizeForImages: 5 * 1024 * 1024 // 5MB
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Show cropper with selected file
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);

    // Clear input value to allow re-selecting the same file
    event.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setIsUploading(true);
    setUploadProgress(null);

    try {
      const response = await FileUploadService.uploadAvatar(
        croppedBlob,
        (progress) => setUploadProgress(progress)
      );

      onAvatarUpdate(response.url);
      setPreviewUrl(response.url);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert(t('profile.avatarUploadError'));
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setPreviewUrl(null);
  };

  const triggerFileSelect = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="relative">
      {/* Avatar Display */}
      <div className="relative w-32 h-32 mx-auto">
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-600 shadow-lg">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={t('profile.avatar')}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button Overlay */}
        {!disabled && (
          <button
            onClick={triggerFileSelect}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full rounded-full bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center group"
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {isUploading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-1"></div>
                  {uploadProgress && (
                    <div className="text-white text-xs">
                      {uploadProgress.percentage}%
                    </div>
                  )}
                </div>
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </div>
          </button>
        )}
      </div>

      {/* Upload Instructions */}
      {!disabled && (
        <div className="mt-4 text-center">
          <button
            onClick={triggerFileSelect}
            disabled={isUploading}
            className="btn btn-secondary btn-sm flex items-center space-x-2 mx-auto"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? t('common.uploading') : t('profile.changeAvatar')}</span>
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {t('profile.avatarHelp')}
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Cropper Modal */}
      {showCropper && previewUrl && (
        <ImageCropper
          imageUrl={previewUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          cropSize={{ width: 200, height: 200 }}
        />
      )}
    </div>
  );
}