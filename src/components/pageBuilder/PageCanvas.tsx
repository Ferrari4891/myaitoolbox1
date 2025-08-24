import React from 'react';
import { PageElement } from '@/types/pageBuilder';
import { PageElementRenderer } from './PageElementRenderer';

interface PageCanvasProps {
  elements: PageElement[];
  isEditing?: boolean;
  onEditElement?: (element: PageElement) => void;
  onDuplicateElement?: (element: PageElement) => void;
  onDeleteElement?: (elementId: string) => void;
  onMoveElement?: (elementId: string, direction: 'up' | 'down') => void;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({
  elements,
  isEditing = false,
  onEditElement,
  onDuplicateElement,
  onDeleteElement,
  onMoveElement
}) => {
  const sortedElements = [...elements].sort((a, b) => a.position.y - b.position.y);

  return (
    <div className="min-h-screen bg-background">
      {sortedElements.length === 0 ? (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          <p>No content yet. Add elements to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4 p-4">
          {sortedElements.map((element) => (
            <PageElementRenderer
              key={element.id}
              element={element}
              isEditing={isEditing}
              onEdit={onEditElement}
              onDuplicate={onDuplicateElement}
              onDelete={onDeleteElement}
              onMove={onMoveElement}
            />
          ))}
        </div>
      )}
    </div>
  );
};