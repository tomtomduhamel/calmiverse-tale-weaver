
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Wifi, Network, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnvironmentalTestResult {
  test: string;
  success: boolean;
  duration?: number;
  details?: any;
  error?: string;
  recommendation?: string;
}

export const EnvironmentalDiagnosticPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<EnvironmentalTestResult[]>([]);
  const { toast } = useToast();

  const runEnvironmentalDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    const testResults: EnvironmentalTestResult[] = [];

    console.log('🌍 [ENV-DIAGNOSTIC] Début des diagnostics environnementaux Phase 3');

    // Test 1: Détection de l'environnement réseau
    try {
      console.log('🌍 [ENV-DIAGNOSTIC] Test 1 - Analyse environnement réseau');
      const startTime = Date.now();
      
      const networkInfo = {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        // @ts-ignore
        connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
      };

      // Test de connectivité basique
      const connectivityTest = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      const duration = Date.now() - startTime;

      testResults.push({
        test: "Analyse environnement réseau",
        success: connectivityTest.ok,
        duration,
        details: {
          networkInfo,
          httpbinStatus: connectivityTest.status,
          httpbinOk: connectivityTest.ok
        },
        recommendation: connectivityTest.ok 
          ? "Connectivité Internet OK" 
          : "Problème de connectivité réseau détecté"
      });

    } catch (error: any) {
      testResults.push({
        test: "Analyse environnement réseau",
        success: false,
        error: error.message,
        recommendation: "Connectivité Internet limitée ou bloquée"
      });
    }

    // Test 2: Test de proxy/firewall
    try {
      console.log('🌍 [ENV-DIAGNOSTIC] Test 2 - Détection proxy/firewall');
      const startTime = Date.now();
      
      // Test plusieurs endpoints pour détecter les blocages sélectifs
      const endpoints = [
        'https://api.github.com/zen',
        'https://httpbin.org/status/200',
        'https://jsonplaceholder.typicode.com/posts/1'
      ];

      const endpointResults = await Promise.allSettled(
        endpoints.map(url => fetch(url, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        }))
      );

      const duration = Date.now() - startTime;
      const successCount = endpointResults.filter(r => r.status === 'fulfilled').length;

      testResults.push({
        test: "Détection proxy/firewall",
        success: successCount >= 2,
        duration,
        details: {
          tested: endpoints.length,
          successful: successCount,
          results: endpointResults.map((result, i) => ({
            url: endpoints[i],
            status: result.status,
            success: result.status === 'fulfilled'
          }))
        },
        recommendation: successCount >= 2 
          ? "Pas de blocage proxy/firewall détecté" 
          : "Possible blocage proxy/firewall - testez depuis un autre réseau"
      });

    } catch (error: any) {
      testResults.push({
        test: "Détection proxy/firewall",
        success: false,
        error: error.message,
        recommendation: "Impossible de tester - probable blocage réseau"
      });
    }

    // Test 3: Test spécifique Supabase depuis différents chemins
    try {
      console.log('🌍 [ENV-DIAGNOSTIC] Test 3 - Test Supabase multi-chemins');
      const startTime = Date.now();
      
      // Test via différentes méthodes d'accès Supabase
      const supabaseTests = await Promise.allSettled([
        // Test REST API direct
        fetch(`https://ioeihnoxvtpxtqhxklpw.supabase.co/rest/v1/stories?select=count&limit=1`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro'
          },
          signal: AbortSignal.timeout(5000)
        }),
        
        // Test client Supabase
        supabase.from('stories').select('count').limit(1),
        
        // Test auth
        supabase.auth.getSession()
      ]);

      const duration = Date.now() - startTime;
      const successCount = supabaseTests.filter(r => r.status === 'fulfilled').length;

      testResults.push({
        test: "Test Supabase multi-chemins",
        success: successCount >= 2,
        duration,
        details: {
          restApiDirect: supabaseTests[0].status,
          supabaseClient: supabaseTests[1].status,
          supabaseAuth: supabaseTests[2].status,
          successCount
        },
        recommendation: successCount >= 2 
          ? "Supabase accessible - problème spécifique aux Edge Functions" 
          : "Blocage complet Supabase - problème réseau/firewall"
      });

    } catch (error: any) {
      testResults.push({
        test: "Test Supabase multi-chemins",
        success: false,
        error: error.message,
        recommendation: "Supabase inaccessible depuis cet environnement"
      });
    }

    // Test 4: Test Edge Functions avec différents domaines
    try {
      console.log('🌍 [ENV-DIAGNOSTIC] Test 4 - Edge Functions multi-domaines');
      const startTime = Date.now();
      
      const edgeFunctionUrls = [
        'https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/testConnection',
        'https://ioeihnoxvtpxtqhxklpw.functions.supabase.co/testConnection'
      ];

      const edgeTests = await Promise.allSettled(
        edgeFunctionUrls.map(url => fetch(url, {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: true, source: 'env-diagnostic' }),
          signal: AbortSignal.timeout(8000)
        }))
      );

      const duration = Date.now() - startTime;
      const successCount = edgeTests.filter(r => r.status === 'fulfilled').length;

      testResults.push({
        test: "Edge Functions multi-domaines",
        success: successCount > 0,
        duration,
        details: {
          testedUrls: edgeFunctionUrls,
          results: edgeTests.map((result, i) => ({
            url: edgeFunctionUrls[i],
            status: result.status,
            success: result.status === 'fulfilled'
          }))
        },
        recommendation: successCount > 0 
          ? "Edge Functions accessibles via domaine alternatif" 
          : "Blocage complet des Edge Functions POST"
      });

    } catch (error: any) {
      testResults.push({
        test: "Edge Functions multi-domaines",
        success: false,
        error: error.message,
        recommendation: "Edge Functions totalement inaccessibles"
      });
    }

    setResults(testResults);
    setIsRunning(false);

    // Analyser et recommander la suite
    const successfulTests = testResults.filter(r => r.success);
    const environmentalIssues = testResults.filter(r => !r.success);

    console.log('🌍 [ENV-DIAGNOSTIC] Résultats Phase 3:', {
      total: testResults.length,
      success: successfulTests.length,
      failed: environmentalIssues.length,
      results: testResults
    });

    if (successfulTests.length >= 3) {
      toast({
        title: "✅ Environnement stable détecté",
        description: "Le problème est spécifique aux Edge Functions - activation du fallback RPC",
      });
    } else if (successfulTests.length >= 1) {
      toast({
        title: "⚠️ Problème environnemental partiel",
        description: "Connectivité limitée - recommandation: testez depuis un autre réseau",
        variant: "default"
      });
    } else {
      toast({
        title: "❌ Problème environnemental critique",
        description: "Blocage réseau/firewall détecté - changez d'environnement réseau",
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
    <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <Globe className="h-5 w-5" />
          🌍 Phase 3 - Diagnostic Environnemental
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded border border-purple-300">
          <div className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Objectif:</strong> Détecter les blocages réseau, proxy, firewall et problèmes environnementaux
          </div>
        </div>

        <Button 
          onClick={runEnvironmentalDiagnostics}
          disabled={isRunning}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          size="lg"
        >
          <Network className="h-4 w-4 mr-2" />
          {isRunning ? "Diagnostic environnemental en cours..." : "Lancer diagnostic Phase 3"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200">Résultats diagnostic environnemental:</h3>
            
            {results.map((result, index) => (
              <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(result.success)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "ENVIRONNEMENT OK" : "PROBLÈME DÉTECTÉ"}
                    </Badge>
                    {result.duration && (
                      <Badge variant="secondary">{result.duration}ms</Badge>
                    )}
                  </div>
                </div>
                
                {result.recommendation && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                    💡 <strong>Recommandation:</strong> {result.recommendation}
                  </div>
                )}
                
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

            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Analyse Environnementale:</strong> Ces tests identifient si les problèmes viennent de votre environnement réseau, proxy, firewall ou de la configuration Supabase.
                {results.filter(r => r.success).length >= 3 && (
                  <span className="text-green-700 dark:text-green-300"> ✅ Environnement stable - problème spécifique Edge Functions.</span>
                )}
                {results.filter(r => r.success).length < 2 && (
                  <span className="text-red-700 dark:text-red-300"> ❌ Problème environnemental - testez depuis un autre réseau.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnvironmentalDiagnosticPanel;
