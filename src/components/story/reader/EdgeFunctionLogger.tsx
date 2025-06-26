
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Terminal, Copy, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
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
      console.log('📋 [EdgeFunctionLogger] Génération de logs de test...');
      
      // Tests séquentiels avec supabase.functions.invoke uniquement
      const testCalls = [
        { 
          name: 'Test Ping', 
          body: { ping: true },
          description: 'Test de connectivité basique'
        },
        { 
          name: 'Test Secrets', 
          body: { testSecrets: true },
          description: 'Vérification de la configuration des secrets'
        },
        { 
          name: 'Test API ElevenLabs', 
          body: { testConnection: true },
          description: 'Test de connexion à l\'API ElevenLabs'
        },
        { 
          name: 'Test Génération Audio', 
          body: { 
            text: 'Test de génération audio Calmiverse.',
            voiceId: '9BWtsMINqrJLrRacOk9x',
            modelId: 'eleven_multilingual_v2'
          },
          description: 'Test de génération audio complète'
        }
      ];

      const results = [];
      
      for (const [index, testCall] of testCalls.entries()) {
        console.log(`🔄 [EdgeFunctionLogger] ${testCall.name} (${index + 1}/${testCalls.length})`);
        
        const startTime = Date.now();
        
        try {
          const { data, error } = await supabase.functions.invoke('tts-elevenlabs', { 
            body: testCall.body 
          });
          
          const duration = Date.now() - startTime;
          
          results.push({
            name: testCall.name,
            description: testCall.description,
            call: index + 1,
            body: testCall.body,
            success: !error,
            data: data,
            error: error,
            duration: duration,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ [EdgeFunctionLogger] ${testCall.name} réussi (${duration}ms):`, { data, error });
        } catch (e: any) {
          const duration = Date.now() - startTime;
          
          results.push({
            name: testCall.name,
            description: testCall.description,
            call: index + 1,
            body: testCall.body,
            success: false,
            data: null,
            error: { message: e.message, details: e },
            duration: duration,
            timestamp: new Date().toISOString()
          });
          
          console.error(`❌ [EdgeFunctionLogger] ${testCall.name} échoué (${duration}ms):`, e);
        }
        
        // Petite pause entre les appels
        if (index < testCalls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Génération du rapport de logs
      const logOutput = results.map(r => {
        const status = r.success ? '✅ SUCCÈS' : '❌ ÉCHEC';
        const header = `[${r.timestamp}] ${r.name} ${status} (${r.duration}ms)`;
        const description = `Description: ${r.description}`;
        const bodyLog = `Requête: ${JSON.stringify(r.body, null, 2)}`;
        
        let responseLog = '';
        if (r.success && r.data) {
          responseLog = `Réponse: ${JSON.stringify(r.data, null, 2)}`;
        } else if (r.error) {
          responseLog = `Erreur: ${JSON.stringify(r.error, null, 2)}`;
        }
        
        return [header, description, bodyLog, responseLog, '='.repeat(80)].join('\n');
      }).join('\n\n');
      
      const summary = `RÉSUMÉ DU DIAGNOSTIC TTS ELEVENLABS
Tests effectués: ${results.length}
Succès: ${results.filter(r => r.success).length}
Échecs: ${results.filter(r => !r.success).length}
Durée totale: ${results.reduce((acc, r) => acc + r.duration, 0)}ms
Date: ${new Date().toLocaleString()}

${'='.repeat(80)}

DÉTAILS DES TESTS:

${logOutput}`;
      
      setLogs(summary);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      toast({
        title: "Logs générés",
        description: `${successCount} succès, ${failureCount} échecs sur ${results.length} tests`,
        variant: failureCount > 0 ? "destructive" : "default"
      });
      
    } catch (error: any) {
      console.error('💥 [EdgeFunctionLogger] Erreur:', error);
      setLogs(`ERREUR LORS DE LA GÉNÉRATION DES LOGS
${new Date().toLocaleString()}

Message: ${error.message}
Stack: ${error.stack || 'N/A'}

Cette erreur indique un problème avec le système de diagnostic lui-même.
Vérifiez votre connexion et authentification Supabase.`);
      
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

  const getStatusInfo = () => {
    if (!logs) return null;
    
    const successMatch = logs.match(/Succès: (\d+)/);
    const failureMatch = logs.match(/Échecs: (\d+)/);
    
    const successCount = successMatch ? parseInt(successMatch[1]) : 0;
    const failureCount = failureMatch ? parseInt(failureMatch[1]) : 0;
    
    return { successCount, failureCount };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Terminal className="h-4 w-4" />
          Logs Edge Function TTS
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

        {statusInfo && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {statusInfo.successCount} succès
            </Badge>
            {statusInfo.failureCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {statusInfo.failureCount} échecs
              </Badge>
            )}
          </div>
        )}

        {logs && (
          <Textarea
            value={logs}
            readOnly
            className={`font-mono text-xs min-h-[300px] ${
              isDarkMode ? 'bg-gray-900 text-green-400 border-gray-600' : 'bg-gray-50'
            }`}
            placeholder="Les logs apparaîtront ici..."
          />
        )}
      </CardContent>
    </Card>
  );
};
