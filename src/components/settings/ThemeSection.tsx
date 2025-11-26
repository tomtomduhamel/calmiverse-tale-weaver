import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SimpleThemeToggle } from '@/components/ui/SimpleThemeToggle';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Palette } from 'lucide-react';

export const ThemeSection: React.FC = () => {
  const { theme, mounted } = useAppTheme();

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Apparence
        </CardTitle>
        <CardDescription>
          Personnalisez l'apparence de l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Thème</Label>
            <p className="text-sm text-muted-foreground">
              {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
            </p>
          </div>
          <SimpleThemeToggle size="default" variant="outline" />
        </div>
      </CardContent>
    </Card>
  );
};
