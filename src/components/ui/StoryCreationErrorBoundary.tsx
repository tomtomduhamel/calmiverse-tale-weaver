import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface StoryCreationErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<{
    error: Error | null;
    retry: () => void;
  }>;
}

/**
 * ErrorBoundary spécialisé pour la création d'histoires
 * Offre une récupération gracieuse et des options de débogage
 */
export class StoryCreationErrorBoundary extends React.Component<
  StoryCreationErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: StoryCreationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[StoryCreationErrorBoundary] Erreur capturée:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      error,
      errorInfo
    });

    // Émettre un événement pour le debugging
    const errorEvent = new CustomEvent('story-creation-error', {
      detail: {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      }
    });
    document.dispatchEvent(errorEvent);
  }

  handleRetry = () => {
    console.log('[StoryCreationErrorBoundary] Tentative de récupération');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    // Navigation via événement custom pour éviter reload
    const navEvent = new CustomEvent('calmi-navigate', { detail: { path: '/' } });
    window.dispatchEvent(navEvent);
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le composant de fallback personnalisé si fourni
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Interface d'erreur par défaut
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Erreur inattendue
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Une erreur s'est produite lors de la création de votre histoire.
                  </p>
                </div>

                {this.state.error && (
                  <details className="text-left bg-muted p-3 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium mb-2">
                      Détails techniques
                    </summary>
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={this.handleGoHome}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Accueil
                  </Button>
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default StoryCreationErrorBoundary;