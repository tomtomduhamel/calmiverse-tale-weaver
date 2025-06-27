
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Loader2, Network, User, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConnectivityDiagnosticProps {
  isDarkMode?: boolean;
}

export const ConnectivityDiagnostic: React.FC<ConnectivityDiagnosticProps> = ({
  isDarkMode = false
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string>('');
  const { toast } = useToast();

  const runDiagnostic = async () => {
    setIsRunning(true);
    const diagnosticResults: string[] = [];
    
    try {
      diagnosticResults.push(`🔧 DIAGNOSTIC DE CONNECTIVITÉ SUPABASE`);
      diagnosticResults.push(`Démarré à: ${new Date().toLocaleString()}`);
      diagnosticResults.push(`=${'='.repeat(50)}`);

      // Test 1: Configuration du client Supabase
      diagnosticResults.push(`\n1️⃣ TEST DE CONFIGURATION CLIENT`);
      const supabaseUrl = supabase.supabaseUrl;
      const supabaseKey = supabase.supabaseKey;
      
      diagnosticResults.push(`URL Supabase: ${supabaseUrl}`);
      diagnosticResults.push(`Clé publique: ${supabaseKey.substring(0, 20)}...`);
      
      if (!supabaseUrl || !supabaseKey) {
        diagnosticResults.push(`❌ Configuration Supabase manquante`);
        throw new Error('Configuration Supabase invalide');
      }
      diagnosticResults.push(`✅ Configuration client OK`);

      // Test 2: Authentification utilisateur
      diagnosticResults.push(`\n2️⃣ TEST D'AUTHENTIFICATION`);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        diagnosticResults.push(`❌ Erreur de session: ${sessionError.message}`);
      } else if (!session) {
        diagnosticResults.push(`⚠️ Aucune session active (non connecté)`);
      } else {
        diagnosticResults.push(`✅ Session active pour: ${session.user?.email}`);
        diagnosticResults.push(`Token expire à: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
      }

      // Test 3: Fonction Edge publique (sans authentification)
      diagnosticResults.push(`\n3️⃣ TEST DE FONCTION EDGE PUBLIQUE`);
      try {
        const startTime = Date.now();
        const { data: connectivityData, error: connectivityError } = await supabase.functions.invoke('connectivity-test', {
          body: { test: 'public-connectivity', timestamp: new Date().toISOString() }
        });
        const duration = Date.now() - startTime;

        if (connectivityError) {
          diagnosticResults.push(`❌ Erreur fonction publique: ${JSON.stringify(connectivityError)}`);
          diagnosticResults.push(`Type d'erreur: ${connectivityError.name || 'Unknown'}`);
          diagnosticResults.push(`Message: ${connectivityError.message || 'No message'}`);
        } else {
          diagnosticResults.push(`✅ Fonction Edge publique accessible (${duration}ms)`);
          diagnosticResults.push(`Réponse: ${JSON.stringify(connectivityData)}`);
        }
      } catch (funcError: any) {
        diagnosticResults.push(`💥 Exception fonction publique: ${funcError.message}`);
      }

      // Test 4: Fonction TTS avec authentification
      diagnosticResults.push(`\n4️⃣ TEST DE FONCTION TTS (avec auth)`);
      if (session) {
        try {
          const startTime = Date.now();
          const { data: ttsData, error: ttsError } = await supabase.functions.invoke('tts-test', {
            body: { ping: true }
          });
          const duration = Date.now() - startTime;

          if (ttsError) {
            diagnosticResults.push(`❌ Erreur fonction TTS: ${JSON.stringify(ttsError)}`);
          } else {
            diagnosticResults.push(`✅ Fonction TTS accessible (${duration}ms)`);
            diagnosticResults.push(`Réponse: ${JSON.stringify(ttsData)}`);
          }
        } catch (ttsError: any) {
          diagnosticResults.push(`💥 Exception fonction TTS: ${ttsError.message}`);
        }
      } else {
        diagnosticResults.push(`⚠️ Impossible de tester TTS (non connecté)`);
      }

      // Test 5: Informations réseau
      diagnosticResults.push(`\n5️⃣ INFORMATIONS RÉSEAU`);
      diagnosticResults.push(`User Agent: ${navigator.userAgent}`);
      diagnosticResults.push(`Online: ${navigator.onLine ? 'Oui' : 'Non'}`);
      diagnosticResults.push(`URL actuelle: ${window.location.href}`);
      
      diagnosticResults.push(`\n${'='.repeat(50)}`);
      diagnosticResults.push(`Diagnostic terminé à: ${new Date().toLocaleString()}`);

    } catch (error: any) {
      diagnosticResults.push(`\n💥 ERREUR CRITIQUE DU DIAGNOSTIC:`);
      diagnosticResults.push(`Message: ${error.message}`);
      diagnosticResults.push(`Stack: ${error.stack || 'N/A'}`);
      
      toast({
        title: "Erreur de diagnostic",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setResults(diagnosticResults.join('\n'));
      setIsRunning(false);
    }
  };

  const copyResults = () => {
    navigator.clipboard.writeText(results);
    toast({
      title: "Copié",
      description: "Résultats du diagnostic copiés",
    });
  };

  return (
    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Network className="h-4 w-4" />
          Diagnostic de Connectivité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={runDiagnostic}
            disabled={isRunning}
            size="sm"
            className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Diagnostic...
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Lancer le diagnostic
              </>
            )}
          </Button>
          
          {results && (
            <Button
              onClick={copyResults}
              size="sm"
              variant="outline"
              className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
            >
              Copier résultats
            </Button>
          )}
        </div>

        {results && (
          <Textarea
            value={results}
            readOnly
            className={`font-mono text-xs min-h-[400px] ${
              isDarkMode ? 'bg-gray-900 text-green-400 border-gray-600' : 'bg-gray-50'
            }`}
            placeholder="Les résultats du diagnostic apparaîtront ici..."
          />
        )}
      </CardContent>
    </Card>
  );
};
