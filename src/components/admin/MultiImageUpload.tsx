import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiImageUploadProps {
  value: string[];
  onChange: (files: File[], previewUrls: string[]) => void;
  onRemove: (index: number) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  maxImages?: number;
  required?: boolean;
}

export function MultiImageUpload({
  value,
  onChange,
  onRemove,
  className,
  accept = "image/*",
  maxSize = 10,
  maxImages = 5,
  required = false
}: MultiImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFiles = (files: File[]): boolean => {
    if (value.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return false;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        return false;
      }

      if (file.size > maxSize * 1024 * 1024) {
        setError(`Each file must be less than ${maxSize}MB`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleFiles = useCallback((files: File[]) => {
    if (!validateFiles(files)) return;

    const newFiles = Array.from(files);
    const previewUrls: string[] = [];

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewUrls.push(event.target?.result as string);
        if (previewUrls.length === newFiles.length) {
          onChange(newFiles, previewUrls);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [onChange, value.length, maxImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  const canAddMore = value.length < maxImages;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Existing Images Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {value.map((imageUrl, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={imageUrl}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2">
                <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
            isDragOver ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-red-400",
            required && value.length === 0 && "border-red-300",
            !canAddMore && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragOver ? (
                <Upload className="w-12 h-12 text-red-500" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">
                {isDragOver ? 'Drop images here' : 'Add more images'}
              </p>
              <p className="text-gray-600 text-sm">
                Drag and drop or click to browse • PNG, JPG up to {maxSize}MB each
                {required && value.length === 0 && <span className="text-red-500 ml-1">*</span>}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {value.length}/{maxImages} images uploaded
              </p>
            </div>
            <label className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 cursor-pointer transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Choose Files
              <input
                type="file"
                accept={accept}
                multiple
                onChange={handleFileInput}
                className="hidden"
                required={required && value.length === 0}
              />
            </label>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </div>
        </div>
      )}

      {!canAddMore && (
        <p className="text-gray-500 text-sm text-center">
          Maximum {maxImages} images reached
        </p>
      )}
    </div>
  );
}