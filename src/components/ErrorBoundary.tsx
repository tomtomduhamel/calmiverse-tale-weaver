import React from 'react';
import { errorMonitor } from '@/utils/errorMonitor';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorMonitor.captureReactError(error, { componentStack: errorInfo.componentStack || '' });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center">
      <h1 className="text-2xl font-bold text-destructive mb-4">Erreur inattendue</h1>
      <p className="text-muted-foreground mb-6">
        Une erreur s'est produite dans l'application. Nos équipes ont été notifiées.
      </p>
      <div className="space-y-3">
        <button
          onClick={retry}
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Réessayer
        </button>
        <button
          onClick={() => {
            // Navigation directe - plus fiable en cas d'erreur
            window.location.href = '/';
          }}
          className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
      <div className="mt-4 text-left p-2 bg-red-50 border border-red-100 rounded text-xs text-red-800 font-mono overflow-auto max-h-[200px]">
        <strong>Error:</strong> {error.message}
        <br />
        <pre className="mt-1 opacity-70">{error.stack}</pre>
      </div>
    </div>
  </div>
);

export default ErrorBoundary;