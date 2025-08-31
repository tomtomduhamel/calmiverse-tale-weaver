import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Wifi, 
  WifiOff, 
  Clock, 
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { usePWAMetrics } from '@/components/PWAMetrics';

export const PWAAnalyticsDashboard: React.FC = () => {
  const { metrics, flushEvents, eventQueue } = usePWAMetrics();

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceAverage = (name: string) => {
    const entries = metrics.performanceMetrics.filter(m => m.name === name);
    if (entries.length === 0) return 0;
    return entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics PWA</h2>
          <p className="text-muted-foreground">
            Métriques de performance et d'utilisation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {eventQueue} événements en attente
          </Badge>
          <Button onClick={flushEvents} size="sm" variant="outline">
            Synchroniser
          </Button>
        </div>
      </div>

      {/* Métriques d'installation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prompts d'installation
            </CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.installPromptShown}</div>
            <p className="text-xs text-muted-foreground">
              Affichages du prompt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Installations
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.installCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Apps installées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usage hors ligne
            </CardTitle>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.offlineUsage}</div>
            <p className="text-xs text-muted-foreground">
              Sessions hors ligne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
          <CardDescription>
            Métriques de performance moyennes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">First Contentful Paint</span>
                <Badge variant={getPerformanceAverage('FCP') < 1800 ? 'default' : 'destructive'}>
                  {formatDuration(getPerformanceAverage('FCP'))}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Temps jusqu'au premier contenu
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Largest Contentful Paint</span>
                <Badge variant={getPerformanceAverage('LCP') < 2500 ? 'default' : 'destructive'}>
                  {formatDuration(getPerformanceAverage('LCP'))}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Temps jusqu'au contenu principal
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Métriques totales</span>
                <Badge variant="outline">
                  {metrics.performanceMetrics.length}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Mesures enregistrées
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des performances récentes */}
      {metrics.performanceMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique récent</CardTitle>
            <CardDescription>
              Dernières mesures de performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.performanceMetrics.slice(-10).reverse().map((metric, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{metric.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(metric.value)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};