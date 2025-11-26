import React, { useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { TtsConfigPanel } from '@/components/admin/TtsConfigPanel';
import { TtsMetrics } from '@/components/admin/TtsMetrics';

const TtsConfig: React.FC = () => {
  useEffect(() => {
    document.title = 'Configuration TTS | Calmiverse Admin';
  }, []);

  return (
    <AdminGuard>
      <main className="p-4 md:p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Configuration Text-to-Speech</h1>
          <p className="text-sm text-muted-foreground">
            Gérez le provider TTS actif (ElevenLabs / Speechify) et consultez les métriques de performance.
          </p>
        </header>

        <section className="space-y-6">
          <TtsConfigPanel />
          <TtsMetrics />
        </section>
      </main>
    </AdminGuard>
  );
};

export default TtsConfig;
