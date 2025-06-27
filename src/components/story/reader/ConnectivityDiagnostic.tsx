
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, Network } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/integrations/supabase/client';
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
      diagnosticResults.push(`URL Supabase: ${supabaseUrl}`);
      diagnosticResults.push(`Clé publique: ${supabaseAnonKey.substring(0, 20)}...`);
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
      }

      // Test 3: Test de base de données
      diagnosticResults.push(`\n3️⃣ TEST DE BASE DE DONNÉES`);
      try {
        const { data, error } = await supabase.from('stories').select('count').limit(1);
        if (error) {
          diagnosticResults.push(`❌ Erreur base de données: ${error.message}`);
        } else {
          diagnosticResults.push(`✅ Base de données accessible`);
        }
      } catch (dbError: any) {
        diagnosticResults.push(`💥 Exception base de données: ${dbError.message}`);
      }

      // Test 4: Test de fonction Edge
      diagnosticResults.push(`\n4️⃣ TEST DE FONCTION EDGE`);
      try {
        const { data: connectivityData, error: connectivityError } = await supabase.functions.invoke('connectivity-test', {
          body: { test: 'diagnostic', timestamp: new Date().toISOString() }
        });

        if (connectivityError) {
          diagnosticResults.push(`❌ Erreur fonction Edge: ${connectivityError.message}`);
        } else {
          diagnosticResults.push(`✅ Fonction Edge accessible`);
          diagnosticResults.push(`Réponse: ${JSON.stringify(connectivityData)}`);
        }
      } catch (funcError: any) {
        diagnosticResults.push(`💥 Exception fonction Edge: ${funcError.message}`);
      }

      diagnosticResults.push(`\n${'='.repeat(50)}`);
      diagnosticResults.push(`Diagnostic terminé à: ${new Date().toLocaleString()}`);

    } catch (error: any) {
      diagnosticResults.push(`\n💥 ERREUR CRITIQUE DU DIAGNOSTIC:`);
      diagnosticResults.push(`Message: ${error.message}`);
      
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
