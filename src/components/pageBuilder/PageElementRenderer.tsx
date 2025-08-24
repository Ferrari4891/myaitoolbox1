import React from 'react';
import { PageElement } from '@/types/pageBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash2, Move } from 'lucide-react';

interface PageElementRendererProps {
  element: PageElement;
  isEditing?: boolean;
  onEdit?: (element: PageElement) => void;
  onDuplicate?: (element: PageElement) => void;
  onDelete?: (elementId: string) => void;
  onMove?: (elementId: string, direction: 'up' | 'down') => void;
}

export const PageElementRenderer: React.FC<PageElementRendererProps> = ({
  element,
  isEditing = false,
  onEdit,
  onDuplicate,
  onDelete,
  onMove
}) => {
  const renderElement = () => {
    switch (element.type) {
      case 'hero':
        return (
          <div 
            className="relative bg-gradient-subtle text-white flex items-center justify-center border-8 border-white"
            style={{ 
              height: `${element.position.height}px`,
              backgroundImage: element.content.backgroundImage ? `url(${element.content.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="text-center z-10">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {element.content.title || 'Hero Title'}
              </h1>
              <p className="text-xl md:text-2xl">
                {element.content.subtitle || 'Hero Subtitle'}
              </p>
            </div>
            {element.content.backgroundImage && (
              <div className="absolute inset-0 bg-black/40" />
            )}
          </div>
        );

      case 'content-card':
        return (
          <Card className="h-full">
            {element.content.image && (
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={element.content.image} 
                  alt={element.content.title || 'Card image'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="card-text-limit">{element.content.title || 'Card Title'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="text-muted-foreground card-text-limit prose max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: element.content.description || 'Card description goes here.' 
                }}
              />
            </CardContent>
          </Card>
        );

      case 'text-block':
        return (
          <Card className="h-full">
            <CardHeader>
              {element.content.title && (
                <CardTitle className="card-text-limit">{element.content.title}</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none card-text-limit"
                dangerouslySetInnerHTML={{ 
                  __html: element.content.content || '<p>Text content goes here.</p>' 
                }}
              />
            </CardContent>
          </Card>
        );

      case 'image-block':
        return (
          <div className="text-center">
            {element.content.image ? (
              <img 
                src={element.content.image} 
                alt={element.content.caption || 'Image'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">Image placeholder</p>
              </div>
            )}
            {element.content.caption && (
              <p className="mt-2 text-sm text-muted-foreground card-text-limit">
                {element.content.caption}
              </p>
            )}
          </div>
        );

      default:
        return <div>Unknown element type</div>;
    }
  };

  return (
    <div 
      className={`relative ${isEditing ? 'border-2 border-dashed border-primary/50 hover:border-primary' : ''}`}
      style={{
        gridColumn: `span ${element.position.width}`,
        minHeight: `${element.position.height}px`
      }}
    >
      {renderElement()}
      
      {isEditing && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white shadow-lg rounded p-1">
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(element)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDuplicate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDuplicate(element)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onMove && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMove(element.id, 'up')}
                className="h-8 w-8 p-0"
              >
                <Move className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMove(element.id, 'down')}
                className="h-8 w-8 p-0"
              >
                <Move className="h-4 w-4" />
              </Button>
            </>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(element.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};