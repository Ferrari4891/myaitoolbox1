import React from 'react';
import { ImageUpload } from '@/components/ui/image-upload';

export const TestImageUpload: React.FC = () => {
  const handleImageUploaded = (url: string) => {
    console.log('Image uploaded:', url);
  };

  const handleImageRemoved = () => {
    console.log('Image removed');
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Test Enhanced Image Upload</h2>
      <ImageUpload
        onImageUploaded={handleImageUploaded}
        onImageRemoved={handleImageRemoved}
        label="Test Image Upload"
      />
    </div>
  );
};