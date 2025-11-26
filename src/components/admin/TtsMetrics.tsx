import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Clock, HardDrive, CheckCircle } from 'lucide-react';
import { useTtsConfig } from '@/hooks/admin/useTtsConfig';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TtsMetrics: React.FC = () => {
  const { metrics, loading, refreshMetrics } = useTtsConfig();

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Chargement des métriques...</p>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Aucune métrique disponible</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Métriques de Performance TTS</h2>
        </div>
        <Button variant="outline" size="sm" onClick={refreshMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.provider} className="p-5 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg capitalize">{metric.provider}</h3>
              <Badge variant={metric.provider === 'elevenlabs' ? 'default' : 'secondary'}>
                {metric.total_generations} générations
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Durée moy.</span>
                </div>
                <p className="text-2xl font-bold">{metric.avg_duration}s</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <HardDrive className="h-4 w-4" />
                  <span>Taille moy.</span>
                </div>
                <p className="text-2xl font-bold">{metric.avg_file_size} KB</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Taux succès</span>
                </div>
                <p className="text-2xl font-bold">{metric.success_rate}%</p>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">Dernière génération</div>
                <p className="text-sm font-medium">
                  {format(new Date(metric.last_generation), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          <strong>Note :</strong> Les métriques sont calculées sur les 100 dernières générations audio.
          Comparez les performances entre ElevenLabs et Speechify pour optimiser votre workflow.
        </p>
      </div>
    </Card>
  );
};
