import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GlobalThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

/**
 * Global theme toggle component using next-themes
 * Works across the entire application for consistent theming
 */
export const GlobalThemeToggle: React.FC<GlobalThemeToggleProps> = ({ 
  variant = 'ghost', 
  size = 'icon',
  showLabel = false 
}) => {
  const { theme, setTheme, systemTheme } = useTheme();

  const currentIcon = () => {
    if (theme === 'dark') return <Moon className="h-4 w-4" />;
    if (theme === 'light') return <Sun className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const currentLabel = () => {
    if (theme === 'dark') return 'Mode sombre';
    if (theme === 'light') return 'Mode clair';
    return 'Système';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="transition-colors"
          aria-label={`Theme actuel: ${currentLabel()}`}
        >
          {currentIcon()}
          {showLabel && <span className="ml-2">{currentLabel()}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          Clair
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          Sombre
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          Système
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GlobalThemeToggle;