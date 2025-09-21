import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Crop, Save, RotateCcw, X } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  cropSize?: { width: number; height: number };
}

export default function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  cropSize = { width: 200, height: 200 }
}: ImageCropperProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
    width: cropSize.width,
    height: cropSize.height
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageElement(img);

    // Center the crop area initially
    const centerX = (img.naturalWidth - cropSize.width) / 2;
    const centerY = (img.naturalHeight - cropSize.height) / 2;
    setCrop({
      x: Math.max(0, centerX),
      y: Math.max(0, centerY),
      width: cropSize.width,
      height: cropSize.height
    });
  }, [cropSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - crop.x,
      y: e.clientY - crop.y
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageElement) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Constrain crop area within image bounds
    const maxX = imageElement.naturalWidth - crop.width;
    const maxY = imageElement.naturalHeight - crop.height;

    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    }));
  }, [isDragging, dragStart, crop.width, crop.height, imageElement]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getCroppedImage = useCallback(async () => {
    if (!imageElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to crop size
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Draw the cropped portion of the image
    ctx.drawImage(
      imageElement,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.9);
  }, [imageElement, crop, onCropComplete]);

  const resetCrop = () => {
    if (!imageElement) return;

    const centerX = (imageElement.naturalWidth - cropSize.width) / 2;
    const centerY = (imageElement.naturalHeight - cropSize.height) / 2;
    setCrop({
      x: Math.max(0, centerX),
      y: Math.max(0, centerY),
      width: cropSize.width,
      height: cropSize.height
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-screen overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('imageCropper.title')}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative inline-block mb-4">
          <img
            src={imageUrl}
            alt="Crop preview"
            onLoad={handleImageLoad}
            className="max-w-full max-h-96 object-contain"
            style={{ display: imageElement ? 'block' : 'none' }}
          />

          {imageElement && (
            <div
              className="absolute border-2 border-primary-500 cursor-move"
              style={{
                left: crop.x * (imageElement.offsetWidth / imageElement.naturalWidth),
                top: crop.y * (imageElement.offsetHeight / imageElement.naturalHeight),
                width: crop.width * (imageElement.offsetWidth / imageElement.naturalWidth),
                height: crop.height * (imageElement.offsetHeight / imageElement.naturalHeight),
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Crop overlay */}
              <div className="absolute inset-0 bg-primary-500 bg-opacity-20" />

              {/* Corner handles */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary-500 border border-white rounded-full cursor-nw-resize" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 border border-white rounded-full cursor-ne-resize" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary-500 border border-white rounded-full cursor-sw-resize" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 border border-white rounded-full cursor-se-resize" />
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('imageCropper.preview')}
          </h4>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600">
              {imageElement && (
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-cover"
                  width={crop.width}
                  height={crop.height}
                />
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('imageCropper.previewDescription')}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <Crop className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">{t('imageCropper.instructions')}</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>{t('imageCropper.dragToMove')}</li>
                <li>{t('imageCropper.dragCornersToResize')}</li>
                <li>{t('imageCropper.optimalSize')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={resetCrop}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t('imageCropper.reset')}</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="btn btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={getCroppedImage}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{t('imageCropper.cropAndSave')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}