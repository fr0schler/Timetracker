import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paperclip,
  File,
  Image,
  FileText,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { FileUploadService, FileUploadProgress } from '../../services/fileUpload';
import { TaskAttachment } from '../../types';

interface AttachmentUploadProps {
  attachments: TaskAttachment[];
  onAttachmentsChange: (attachments: TaskAttachment[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
}

export default function AttachmentUpload({
  attachments,
  onAttachmentsChange,
  disabled = false,
  maxFiles = 10,
  maxFileSize = 25 * 1024 * 1024 // 25MB
}: AttachmentUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: FileUploadProgress }>({});
  const [dragOver, setDragOver] = useState(false);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    return FileUploadService.formatFileSize(bytes);
  };

  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Check limits
    if (attachments.length + fileArray.length > maxFiles) {
      alert(t('tasks.attachments.tooManyFiles', { max: maxFiles }));
      return;
    }

    fileArray.forEach(async (file) => {
      // Validate file
      const validation = FileUploadService.validateFile(file, {
        maxSize: maxFileSize,
        allowedTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv'
        ]
      });

      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      const tempId = `temp_${Date.now()}_${Math.random()}`;

      // Add temporary attachment for immediate UI feedback
      const tempAttachment: TaskAttachment = {
        id: 0,
        filename: tempId,
        original_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_url: URL.createObjectURL(file),
        uploaded_by_id: 0,
        uploaded_at: new Date().toISOString()
      };

      onAttachmentsChange([...attachments, tempAttachment]);

      try {
        // Upload file
        const response = await FileUploadService.uploadAttachment(
          file,
          { type: 'task', id: 0 }, // Will be updated when task is created
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [tempId]: progress
            }));
          }
        );

        // Replace temporary attachment with real one
        const realAttachment: TaskAttachment = {
          id: 0, // Will be set by backend
          filename: response.filename,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          file_url: response.url,
          uploaded_by_id: 0, // Will be set by backend
          uploaded_at: new Date().toISOString()
        };

        const updatedAttachments = attachments.map((att: TaskAttachment) =>
          att.filename === tempId ? realAttachment : att
        );
        onAttachmentsChange(updatedAttachments);

        // Clean up progress
        setUploadProgress(prev => {
          const { [tempId]: _, ...rest } = prev;
          return rest;
        });

      } catch (error) {
        console.error('File upload failed:', error);
        // Remove temporary attachment on error
        const filteredAttachments = attachments.filter((att: TaskAttachment) => att.filename !== tempId);
        onAttachmentsChange(filteredAttachments);

        // Clean up progress
        setUploadProgress(prev => {
          const { [tempId]: _, ...rest } = prev;
          return rest;
        });

        alert(t('tasks.attachments.uploadError'));
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const triggerFileSelect = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeAttachment = (attachment: TaskAttachment) => {
    onAttachmentsChange(attachments.filter(att => att !== attachment));

    // Clean up progress if it exists
    setUploadProgress(prev => {
      const { [attachment.filename]: _, ...rest } = prev;
      return rest;
    });
  };

  const downloadAttachment = (attachment: TaskAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.file_url;
    link.download = attachment.original_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
            : 'border-gray-300 dark:border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileSelect}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {t('tasks.attachments.dragDrop')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {t('tasks.attachments.maxSize', { size: formatFileSize(maxFileSize) })}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {t('tasks.attachments.maxFiles', { count: maxFiles })}
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Paperclip className="h-4 w-4 mr-1" />
            {t('tasks.attachments.title')} ({attachments.length})
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {attachments.map((attachment, index) => {
              const FileIcon = getFileIcon(attachment.mime_type);
              const progress = uploadProgress[attachment.filename];
              const isUploading = !!progress;

              return (
                <div
                  key={`${attachment.filename}_${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {attachment.original_name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatFileSize(attachment.file_size)}</span>
                        {isUploading && (
                          <span>• {t('common.uploading')} {progress.percentage}%</span>
                        )}
                      </div>
                      {isUploading && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                          <div
                            className="bg-primary-500 h-1 rounded-full transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-3">
                    {!isUploading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadAttachment(attachment);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        title={t('tasks.attachments.download')}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}

                    {!disabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(attachment);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                        title={t('tasks.attachments.remove')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}