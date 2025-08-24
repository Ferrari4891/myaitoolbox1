import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageElement } from '@/types/pageBuilder';
import { Layout, Type, Image, Square } from 'lucide-react';

interface ComponentPaletteProps {
  onAddElement: (elementType: PageElement['type']) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddElement }) => {
  const components = [
    {
      type: 'hero' as const,
      name: 'Hero Section',
      description: 'Large banner with title and background',
      icon: Layout,
    },
    {
      type: 'content-card' as const,
      name: 'Content Card',
      description: 'Card with image, title, and description',
      icon: Square,
    },
    {
      type: 'text-block' as const,
      name: 'Text Block',
      description: 'Rich text content area',
      icon: Type,
    },
    {
      type: 'image-block' as const,
      name: 'Image Block',
      description: 'Image with optional caption',
      icon: Image,
    },
  ];

  return (
    <Card className="w-64 h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {components.map((component) => {
          const IconComponent = component.icon;
          return (
            <Button
              key={component.type}
              variant="outline"
              className="w-full justify-start h-auto p-3"
              onClick={() => onAddElement(component.type)}
            >
              <div className="flex items-start gap-3">
                <IconComponent className="h-5 w-5 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{component.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {component.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};