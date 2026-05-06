import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string;
  onChange: (file: File | null, previewUrl: string) => void;
  onRemove: () => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  required?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  accept = "image/*",
  maxSize = 10,
  required = false
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return false;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onChange(file, result);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  if (value) {
    return (
      <div className={cn("relative group", className)}>
        <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
            Preview
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
        isDragOver ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-red-400",
        required && !value && "border-red-300",
        className
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
            {isDragOver ? 'Drop image here' : 'Upload item image'}
          </p>
          <p className="text-gray-600 text-sm">
            Drag and drop or click to browse • PNG, JPG up to {maxSize}MB
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
        </div>
        <label className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 cursor-pointer transition-colors">
          <Upload className="w-4 h-4 mr-2" />
          Choose File
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            required={required && !value}
          />
        </label>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}