import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageElement } from '@/types/pageBuilder';
import { ImageUpload } from '@/components/ui/image-upload';

interface ElementEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  element: PageElement | null;
  onSave: (element: PageElement) => void;
}

export const ElementEditDialog: React.FC<ElementEditDialogProps> = ({
  isOpen,
  onClose,
  element,
  onSave
}) => {
  const [editedElement, setEditedElement] = useState<PageElement | null>(null);

  useEffect(() => {
    if (element) {
      setEditedElement({ ...element });
    }
  }, [element]);

  const handleSave = () => {
    if (editedElement) {
      onSave(editedElement);
      onClose();
    }
  };

  const updateContent = (field: string, value: string) => {
    if (editedElement) {
      setEditedElement({
        ...editedElement,
        content: {
          ...editedElement.content,
          [field]: value
        }
      });
    }
  };

  const updatePosition = (field: string, value: number) => {
    if (editedElement) {
      setEditedElement({
        ...editedElement,
        position: {
          ...editedElement.position,
          [field]: value
        }
      });
    }
  };

  const handleImageUpload = (field: string) => (url: string) => {
    updateContent(field, url);
  };

  if (!editedElement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {editedElement.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Content Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Content</h3>
            
            {(editedElement.type === 'hero' || editedElement.type === 'content-card' || editedElement.type === 'text-block') && (
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedElement.content.title || ''}
                  onChange={(e) => updateContent('title', e.target.value)}
                />
              </div>
            )}

            {editedElement.type === 'hero' && (
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={editedElement.content.subtitle || ''}
                  onChange={(e) => updateContent('subtitle', e.target.value)}
                />
              </div>
            )}

            {editedElement.type === 'content-card' && (
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedElement.content.description || ''}
                  onChange={(e) => updateContent('description', e.target.value)}
                />
              </div>
            )}

            {editedElement.type === 'text-block' && (
              <div>
                <Label htmlFor="content">Content (HTML)</Label>
                <Textarea
                  id="content"
                  value={editedElement.content.content || ''}
                  onChange={(e) => updateContent('content', e.target.value)}
                  rows={6}
                />
              </div>
            )}

            {editedElement.type === 'image-block' && (
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={editedElement.content.caption || ''}
                  onChange={(e) => updateContent('caption', e.target.value)}
                />
              </div>
            )}

            {/* Image Uploads */}
            {(editedElement.type === 'content-card' || editedElement.type === 'image-block') && (
              <div>
                <Label>Image</Label>
                <ImageUpload
                  onImageUploaded={handleImageUpload('image')}
                  currentImage={editedElement.content.image}
                  onImageRemoved={() => updateContent('image', '')}
                  label="Upload Image"
                />
              </div>
            )}

            {editedElement.type === 'hero' && (
              <div>
                <Label>Background Image</Label>
                <ImageUpload
                  onImageUploaded={handleImageUpload('backgroundImage')}
                  currentImage={editedElement.content.backgroundImage}
                  onImageRemoved={() => updateContent('backgroundImage', '')}
                  label="Upload Background Image"
                />
              </div>
            )}
          </div>

          {/* Position & Size */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Layout</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width (1-12 columns)</Label>
                <Select
                  value={editedElement.position.width.toString()}
                  onValueChange={(value) => updatePosition('width', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} column{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="height">Height (pixels)</Label>
                <Input
                  id="height"
                  type="number"
                  value={editedElement.position.height}
                  onChange={(e) => updatePosition('height', parseInt(e.target.value))}
                  min="50"
                  step="50"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};