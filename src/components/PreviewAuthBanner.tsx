import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, X, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PreviewAuthBannerProps {
  status: 'loading' | 'authenticated' | 'demo';
  userEmail?: string | null;
}

/**
 * 🎭 PREVIEW AUTH BANNER
 * Bannière informative montrant l'état d'authentification en mode preview mobile
 */
export const PreviewAuthBanner: React.FC<PreviewAuthBannerProps> = ({ 
  status, 
  userEmail 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) return null;

  const handleLogin = () => {
    navigate('/auth');
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />,
          text: 'Tentative de connexion...',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
          showLoginButton: false
        };
      case 'authenticated':
        return {
          icon: <CheckCircle className="h-4 w-4 flex-shrink-0" />,
          text: `Connecté en tant que ${userEmail}`,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          showLoginButton: false
        };
      case 'demo':
      default:
        return {
          icon: <AlertCircle className="h-4 w-4 flex-shrink-0" />,
          text: 'Mode démo - Données de démonstration',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          showLoginButton: true
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} border-b ${config.borderColor} sticky top-0 z-50`}>
      <div className={`flex items-center justify-between gap-2 px-4 py-2 ${config.textColor}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {config.icon}
          <span className="text-sm font-medium truncate">{config.text}</span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {config.showLoginButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogin}
              className="h-7 text-xs"
            >
              <LogIn className="h-3 w-3 mr-1" />
              Se connecter
            </Button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="hover:opacity-70 transition-opacity"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
