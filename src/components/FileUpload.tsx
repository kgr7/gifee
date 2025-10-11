import { useState, useCallback } from 'react';
import { Card, Button } from '@heroui/react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { validateVideoFile } from '@/utils/videoHelpers';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validationError = validateVideoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(file);
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateVideoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(file);
  }, [onFileSelect]);

  return (
    <Card
      className={`p-8 text-center ${
        isDragging ? 'border-primary' : ''
      }`}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center gap-4 cursor-pointer"
      >
        <CloudArrowUpIcon className="w-16 h-16 text-gray-400" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            Drag and drop your video here
          </p>
          <p className="text-sm text-gray-500">
            or
          </p>
          <label>
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              as="span"
              color="primary"
            >
              Select a video
            </Button>
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Supports MP4 and WebM formats
          </p>
        </div>
        {error && (
          <p className="text-sm text-danger mt-2">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}