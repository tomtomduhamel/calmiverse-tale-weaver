import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SafeErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
  fallbackRender?: (error: Error, reset: () => void) => ReactNode;
  inline?: boolean;
}

interface SafeErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary granulaire pour isoler les sections sans crasher toute la SPA
 */
export class SafeErrorBoundary extends Component<SafeErrorBoundaryProps, SafeErrorBoundaryState> {
  constructor(props: SafeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SafeErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🛡️ [SafeErrorBoundary] Erreur interceptée avec succès:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackRender && this.state.error) {
        return this.props.fallbackRender(this.state.error, this.resetErrorBoundary);
      }

      if (this.props.inline) {
        return (
          <div className="flex items-center gap-2 p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/5 text-muted-foreground my-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="flex-1">{this.props.fallbackTitle || 'Contenu temporairement indisponible.'}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={this.resetErrorBoundary}
              className="h-7 px-2 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Réessayer
            </Button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm text-center my-4 space-y-3 shadow-sm max-w-lg mx-auto">
          <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {this.props.fallbackTitle || 'Affichage momentanément interrompu'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {this.props.fallbackDescription || "Une anomalie d'affichage est survenue sur cette section. Vous pouvez réessayer sans recharger la page."}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={this.resetErrorBoundary}
            className="mt-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Recharger cette section
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
