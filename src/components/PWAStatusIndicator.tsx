import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Check, 
  AlertCircle, 
  Download, 
  Bell,
  Wifi,
  Shield
} from 'lucide-react';
import { usePWAStatus } from '@/hooks/usePWAStatus';

export const PWAStatusIndicator: React.FC = () => {
  const { isFullyOptimized, features, score, recommendations } = usePWAStatus();

  const getScoreColor = () => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = () => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Statut PWA</CardTitle>
          <Badge variant={getScoreVariant()}>
            {score}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score global */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Optimisation PWA</span>
            <span className={getScoreColor()}>{score}%</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {/* Fonctionnalités */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            {features.installed ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Download className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Installée</span>
          </div>

          <div className="flex items-center gap-2">
            {features.offline ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Wifi className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Hors ligne</span>
          </div>

          <div className="flex items-center gap-2">
            {features.notifications ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Bell className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Notifications</span>
          </div>

          <div className="flex items-center gap-2">
            {features.caching ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Shield className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Cache</span>
          </div>
        </div>

        {/* Recommandations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Recommandations
            </div>
            <div className="space-y-1">
              {recommendations.map((rec, index) => (
                <div key={index} className="text-xs text-muted-foreground pl-6">
                  • {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statut optimisé */}
        {isFullyOptimized && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              PWA entièrement optimisée !
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};