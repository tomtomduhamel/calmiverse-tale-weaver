
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Terminal, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EdgeFunctionLoggerProps {
  isDarkMode?: boolean;
}

export const EdgeFunctionLogger: React.FC<EdgeFunctionLoggerProps> = ({
  isDarkMode = false
}) => {
  const [logs, setLogs] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      console.log('📋 [EdgeFunctionLogger] Tentative de récupération des logs...');
      
      // Effectuer plusieurs appels pour générer des logs
      const testCalls = [
        { text: 'Test 1', testConnection: true },
        { text: 'Test 2 avec plus de texte pour voir la différence', voiceId: '9BWtsMINqrJLrRacOk9x' },
        { ping: true },
        { testSecrets: true }
      ];

      const results = [];
      
      for (const [index, body] of testCalls.entries()) {
        console.log(`🔄 [EdgeFunctionLogger] Appel ${index + 1}/4:`, body);
        
        try {
          const { data, error } = await supabase.functions.invoke('tts-elevenlabs', { body });
          
          results.push({
            call: index + 1,
            body,
            success: !error,
            result: error || data,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ [EdgeFunctionLogger] Appel ${index + 1} terminé:`, { data, error });
        } catch (e: any) {
          results.push({
            call: index + 1,
            body,
            success: false,
            result: e.message,
            timestamp: new Date().toISOString()
          });
          
          console.error(`❌ [EdgeFunctionLogger] Appel ${index + 1} échoué:`, e);
        }
        
        // Petite pause entre les appels
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const logOutput = results.map(r => 
        `[${r.timestamp}] Appel ${r.call} ${r.success ? '✅' : '❌'}\n` +
        `Body: ${JSON.stringify(r.body, null, 2)}\n` +
        `Result: ${JSON.stringify(r.result, null, 2)}\n` +
        `${'='.repeat(50)}\n`
      ).join('\n');
      
      setLogs(logOutput);
      
      toast({
        title: "Logs générés",
        description: `${results.length} appels de test effectués`,
      });
      
    } catch (error: any) {
      console.error('💥 [EdgeFunctionLogger] Erreur:', error);
      setLogs(`Erreur lors de la génération des logs:\n${error.message}\n\nStack trace:\n${error.stack || 'N/A'}`);
      
      toast({
        title: "Erreur",
        description: "Impossible de générer les logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs);
    toast({
      title: "Copié",
      description: "Logs copiés dans le presse-papiers",
    });
  };

  return (
    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Terminal className="h-4 w-4" />
          Logs Edge Function
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchLogs}
            disabled={isLoading}
            size="sm"
            className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Terminal className="h-3 w-3 mr-1" />
                Générer les logs
              </>
            )}
          </Button>
          
          {logs && (
            <Button
              onClick={copyLogs}
              size="sm"
              variant="outline"
              className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copier
            </Button>
          )}
        </div>

        {logs && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {logs.split('Appel').length - 1} appels de test
              </Badge>
              <Badge variant={logs.includes('❌') ? 'destructive' : 'default'}>
                {logs.includes('❌') ? 'Erreurs détectées' : 'Tous les tests OK'}
              </Badge>
            </div>
            
            <Textarea
              value={logs}
              readOnly
              className={`font-mono text-xs min-h-[300px] ${
                isDarkMode ? 'bg-gray-900 text-green-400 border-gray-600' : 'bg-gray-50'
              }`}
              placeholder="Les logs apparaîtront ici..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
