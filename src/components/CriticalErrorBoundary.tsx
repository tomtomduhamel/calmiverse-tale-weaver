import React, { Component, ReactNode } from 'react';
import { errorMonitor } from '@/utils/errorMonitor';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Enhanced ErrorBoundary with inline fallback for critical failures
const CriticalErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: 'system-ui, sans-serif'
  }}>
    <div style={{ textAlign: 'center', maxWidth: '500px' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
        ✨ Calmi - Chargement en cours
      </h1>
      <p style={{ marginBottom: '1.5rem', color: '#666666' }}>
        Une erreur s'est produite lors du chargement de l'application.
      </p>
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1rem', 
        borderRadius: '8px',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        fontFamily: 'monospace',
        border: '1px solid #dee2e6'
      }}>
        {error.message}
      </div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={retry}
          style={{
            backgroundColor: '#A8DADC',
            color: '#2c3e50',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🔄 Réessayer
        </button>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#457B9D',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🔃 Recharger
        </button>
        <button 
          onClick={() => {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(reg => reg.unregister());
                window.location.reload();
              });
            }
          }}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🧹 Nettoyer cache
        </button>
      </div>
    </div>
  </div>
);

class CriticalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 CriticalErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 CriticalErrorBoundary componentDidCatch:', error, errorInfo);
    try {
      errorMonitor?.captureReactError?.(error, { 
        componentStack: errorInfo.componentStack || '' 
      });
    } catch (e) {
      console.warn('Could not capture error to errorMonitor:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || CriticalErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          retry={() => {
            console.log('🔄 Retrying after error...');
            this.setState({ hasError: false, error: null });
          }} 
        />
      );
    }

    return this.props.children;
  }
}

export default CriticalErrorBoundary;