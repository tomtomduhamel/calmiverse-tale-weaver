import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ExternalLink, Settings, Zap, Server, ShieldCheck } from 'lucide-react';
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
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Architecture TTS Active (Multi-Pipeline)</h2>
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

      {/* 3 Blocs Pipelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Voix Standards (VPS Kokoro-82M) */}
        <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-500" />
              Voix Standards
            </span>
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
              0.00 $ / histoire
            </Badge>
          </div>
          <p className="font-semibold text-sm">Kokoro-82M (VPS Hostinger)</p>
          <p className="text-xs text-muted-foreground">Inférence CPU ultra-rapide (~20s) pour les histoires sans clone vocal.</p>
          {config.standardWebhookUrl && (
            <div className="font-mono text-[11px] bg-background/80 p-1.5 rounded truncate text-muted-foreground">
              {config.standardWebhookUrl}
            </div>
          )}
        </div>

        {/* Clones Vocaux (Modal GPU CosyVoice 2) */}
        <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              Studio Familial
            </span>
            <Badge variant="outline" className="border-purple-500/50 text-purple-600 dark:text-purple-400 font-mono text-[10px]">
              ~0.05 $ / histoire
            </Badge>
          </div>
          <p className="font-semibold text-sm">CosyVoice 2 EU (Modal GPU L4)</p>
          <p className="text-xs text-muted-foreground">Zero-shot voice cloning ultra-rapide (~2 min) pour Papa, Maman, etc.</p>
          {config.modalWebhookUrl && (
            <div className="font-mono text-[11px] bg-background/80 p-1.5 rounded truncate text-muted-foreground">
              {config.modalWebhookUrl}
            </div>
          )}
        </div>

        {/* Fallback Secours (OpenAI TTS) */}
        <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Secours Immédiat
            </span>
            <Badge variant="secondary" className="text-[10px] font-mono">
              Automatique
            </Badge>
          </div>
          <p className="font-semibold text-sm">OpenAI TTS (Edge Function)</p>
          <p className="text-xs text-muted-foreground">Bascule automatique instantanée si le VPS ou le GPU est indisponible.</p>
          <div className="font-mono text-[11px] bg-background/80 p-1.5 rounded truncate text-muted-foreground">
            generate-openai-tts
          </div>
        </div>
      </div>

      {/* Détails Techniques & Fast-Play */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Mode Fast-Play (First-Chunk)</label>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              ⚡ Actif (&lt; 4s avant première écoute)
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Voix Standard par Défaut</label>
          <div className="font-mono text-xs bg-muted p-2 rounded">
            {config.voiceId || "standard-french-female"}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Configuration gérée par les variables Supabase (<code className="bg-muted px-1 rounded">TTS_PROVIDER</code>, <code className="bg-muted px-1 rounded">MODAL_TTS_WEBHOOK_URL</code>, <code className="bg-muted px-1 rounded">VPS_KOKORO_WEBHOOK_URL</code>).
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open('https://supabase.com/dashboard/project/ioeihnoxvtpxtqhxklpw/settings/functions', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Secrets Supabase
        </Button>
      </div>
    </Card>
  );
};
