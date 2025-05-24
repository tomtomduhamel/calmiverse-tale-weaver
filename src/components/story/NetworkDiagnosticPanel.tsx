
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Zap, Network, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiagnosticResult {
  test: string;
  success: boolean;
  duration?: number;
  details?: any;
  error?: string;
}

export const NetworkDiagnosticPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const { toast } = useToast();

  const runCompleteDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    const diagnosticResults: DiagnosticResult[] = [];

    console.log('🔍 [DIAGNOSTIC] Début du diagnostic complet - Phase 1');

    // Test 1: Vérification de la session utilisateur
    try {
      console.log('🔍 [DIAGNOSTIC] Test 1 - Session utilisateur');
      const startTime = Date.now();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const duration = Date.now() - startTime;

      if (sessionError || !session) {
        diagnosticResults.push({
          test: "Session utilisateur",
          success: false,
          duration,
          error: sessionError?.message || "Pas de session active"
        });
      } else {
        diagnosticResults.push({
          test: "Session utilisateur",
          success: true,
          duration,
          details: { userId: session.user.id, hasToken: !!session.access_token }
        });
      }
    } catch (error: any) {
      diagnosticResults.push({
        test: "Session utilisateur",
        success: false,
        error: error.message
      });
    }

    // Test 2: Test de connectivité réseau de base
    try {
      console.log('🔍 [DIAGNOSTIC] Test 2 - Connectivité réseau');
      const startTime = Date.now();
      const response = await fetch('https://httpbin.org/status/200', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      const duration = Date.now() - startTime;

      diagnosticResults.push({
        test: "Connectivité réseau",
        success: response.ok,
        duration,
        details: { status: response.status, statusText: response.statusText }
      });
    } catch (error: any) {
      diagnosticResults.push({
        test: "Connectivité réseau",
        success: false,
        error: error.message
      });
    }

    // Test 3: Test OPTIONS vers generateStory
    try {
      console.log('🔍 [DIAGNOSTIC] Test 3 - OPTIONS vers generateStory');
      const startTime = Date.now();
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generateStory`, {
        method: 'OPTIONS',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      const duration = Date.now() - startTime;

      diagnosticResults.push({
        test: "OPTIONS generateStory",
        success: response.ok,
        duration,
        details: { 
          status: response.status, 
          headers: Object.fromEntries(response.headers.entries())
        }
      });
    } catch (error: any) {
      diagnosticResults.push({
        test: "OPTIONS generateStory",
        success: false,
        error: error.message
      });
    }

    // Test 4: Test POST direct vers generateStory (critique)
    try {
      console.log('🔍 [DIAGNOSTIC] Test 4 - POST direct vers generateStory');
      const startTime = Date.now();
      const session = await supabase.auth.getSession();
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generateStory`, {
        method: 'POST',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
          'x-client-info': 'calmiverse-web'
        },
        body: JSON.stringify({
          test: true,
          storyId: `diagnostic-${Date.now()}`,
          objective: "Test diagnostic réseau",
          childrenNames: ["DiagnosticChild"]
        }),
        signal: AbortSignal.timeout(15000)
      });
      const duration = Date.now() - startTime;

      let responseBody = null;
      try {
        responseBody = await response.text();
      } catch (e) {
        responseBody = "Impossible de lire la réponse";
      }

      diagnosticResults.push({
        test: "POST direct generateStory",
        success: response.ok,
        duration,
        details: { 
          status: response.status,
          statusText: response.statusText,
          responseBody: responseBody?.substring(0, 500),
          headers: Object.fromEntries(response.headers.entries())
        },
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined
      });
    } catch (error: any) {
      diagnosticResults.push({
        test: "POST direct generateStory",
        success: false,
        error: error.message,
        details: { errorType: error.constructor.name }
      });
    }

    // Test 5: Test via supabase.functions.invoke (méthode recommandée)
    try {
      console.log('🔍 [DIAGNOSTIC] Test 5 - supabase.functions.invoke');
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('generateStory', {
        body: {
          test: true,
          storyId: `diagnostic-invoke-${Date.now()}`,
          objective: "Test via invoke",
          childrenNames: ["InvokeChild"]
        }
      });
      const duration = Date.now() - startTime;

      diagnosticResults.push({
        test: "supabase.functions.invoke",
        success: !error,
        duration,
        details: { data, error: error?.message },
        error: error?.message
      });
    } catch (error: any) {
      diagnosticResults.push({
        test: "supabase.functions.invoke",
        success: false,
        error: error.message
      });
    }

    // Test 6: Test de la fonction testConnection
    try {
      console.log('🔍 [DIAGNOSTIC] Test 6 - testConnection');
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('testConnection', {
        body: { diagnostic: true, timestamp: new Date().toISOString() }
      });
      const duration = Date.now() - startTime;

      diagnosticResults.push({
        test: "testConnection",
        success: !error,
        duration,
        details: { data, error: error?.message },
        error: error?.message
      });
    } catch (error: any) {
      diagnosticResults.push({
        test: "testConnection",
        success: false,
        error: error.message
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);

    // Analyser les résultats
    const failedTests = diagnosticResults.filter(r => !r.success);
    const successfulTests = diagnosticResults.filter(r => r.success);

    console.log('📊 [DIAGNOSTIC] Résultats:', {
      total: diagnosticResults.length,
      success: successfulTests.length,
      failed: failedTests.length,
      results: diagnosticResults
    });

    if (failedTests.length === 0) {
      toast({
        title: "✅ Diagnostic complet",
        description: "Tous les tests sont passés avec succès",
      });
    } else {
      toast({
        title: "⚠️ Problèmes détectés",
        description: `${failedTests.length} test(s) ont échoué`,
        variant: "destructive"
      });
    }
  };

  const getIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Network className="h-5 w-5" />
          🔍 Diagnostic Réseau Complet - Phase 1
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Objectif:</strong> Identifier précisément où se situe le blocage dans la chaîne de génération d'histoires.
          </div>
        </div>

        <Button 
          onClick={runCompleteDiagnostic}
          disabled={isRunning}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Zap className="h-4 w-4 mr-2" />
          {isRunning ? "Diagnostic en cours..." : "Lancer le diagnostic complet"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Résultats du diagnostic:</h3>
            
            {results.map((result, index) => (
              <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(result.success)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "SUCCÈS" : "ÉCHEC"}
                    </Badge>
                    {result.duration && (
                      <Badge variant="secondary">{result.duration}ms</Badge>
                    )}
                  </div>
                </div>
                
                {result.error && (
                  <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                    ❌ Erreur: {result.error}
                  </div>
                )}
                
                {result.details && (
                  <details className="text-xs text-gray-600 dark:text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                      Détails techniques
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Analyse:</strong> Examinez les tests échoués pour identifier le point de blocage.
                {results.filter(r => !r.success).length === 0 && (
                  <span className="text-green-700 dark:text-green-300"> ✅ Tous les tests passent - le problème pourrait être dans la logique métier.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkDiagnosticPanel;
