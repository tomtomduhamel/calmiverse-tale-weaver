import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ExternalLink, Settings } from 'lucide-react';
import { useTtsConfig } from '@/hooks/admin/useTtsConfig';

export const TtsConfigPanel: React.FC = () => {
  const { config, loading, refreshing, refreshConfig } = useTtsConfig();

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Chargement de la configuration...</p>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="p-6">
        <p className="text-destructive">Erreur : Configuration TTS introuvable</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Configuration TTS Active</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshConfig}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Provider actif</label>
          <div className="flex items-center gap-2">
            <Badge variant={config.provider === 'elevenlabs' ? 'default' : 'secondary'} className="text-base px-3 py-1">
              {config.provider === 'elevenlabs' ? 'ElevenLabs' : 'Speechify'}
            </Badge>
          </div>
        </div>

        {config.voiceId && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Voice ID</label>
            <div className="font-mono text-sm bg-muted p-2 rounded">
              {config.voiceId}
            </div>
          </div>
        )}

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Webhook URL</label>
          <div className="font-mono text-sm bg-muted p-2 rounded break-all">
            {config.webhookUrl.substring(0, 60)}...
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <strong>Comment changer de provider :</strong>
          </p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Accédez aux <strong>Secrets Supabase</strong> de votre projet</li>
            <li>Modifiez la valeur du secret <code className="bg-muted px-1 rounded">TTS_PROVIDER</code></li>
            <li>Définissez <code className="bg-muted px-1 rounded">'elevenlabs'</code> ou <code className="bg-muted px-1 rounded">'speechify'</code></li>
            <li>Actualisez cette page pour voir le changement</li>
          </ol>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/ioeihnoxvtpxtqhxklpw/settings/functions', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir Supabase Secrets
          </Button>
        </div>
      </div>
    </Card>
  );
};
