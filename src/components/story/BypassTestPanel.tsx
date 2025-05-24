
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Zap, Router } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BypassTestResult {
  test: string;
  method: string;
  success: boolean;
  duration?: number;
  details?: any;
  error?: string;
  response?: any;
}

// Configuration Supabase hardcodée
const SUPABASE_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

export const BypassTestPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BypassTestResult[]>([]);
  const { toast } = useToast();

  const runBypassTests = async () => {
    setIsRunning(true);
    setResults([]);
    const testResults: BypassTestResult[] = [];

    console.log('🔬 [BYPASS-TESTS] Début des tests de contournement Phase 2');

    // Test 1: Fetch direct avec URL complète (sans auth)
    try {
      console.log('🔬 [BYPASS-TESTS] Test 1 - Fetch direct sans auth');
      const startTime = Date.now();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generateStory`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'x-test-source': 'bypass-direct-noauth'
        },
        body: JSON.stringify({
          test: true,
          source: 'bypass-test-1',
          storyId: `bypass-test-${Date.now()}`,
          objective: 'Test bypass direct',
          childrenNames: ['TestBypass']
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

      testResults.push({
        test: "Fetch direct sans auth",
        method: "fetch POST",
        success: response.ok,
        duration,
        details: { 
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          responsePreview: responseBody?.substring(0, 300)
        },
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
        response: responseBody
      });

    } catch (error: any) {
      testResults.push({
        test: "Fetch direct sans auth",
        method: "fetch POST",
        success: false,
        error: error.message,
        details: { errorType: error.constructor.name, errorStack: error.stack?.substring(0, 200) }
      });
    }

    // Test 2: XMLHttpRequest direct (pour contourner fetch)
    try {
      console.log('🔬 [BYPASS-TESTS] Test 2 - XMLHttpRequest direct');
      const startTime = Date.now();
      
      const xhr = new XMLHttpRequest();
      const xhrPromise = new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            const duration = Date.now() - startTime;
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({
                success: true,
                status: xhr.status,
                statusText: xhr.statusText,
                response: xhr.responseText,
                duration
              });
            } else {
              resolve({
                success: false,
                status: xhr.status,
                statusText: xhr.statusText,
                response: xhr.responseText,
                duration
              });
            }
          }
        };
        xhr.onerror = () => reject(new Error('Erreur réseau XHR'));
        xhr.ontimeout = () => reject(new Error('Timeout XHR'));
      });

      xhr.open('POST', `${SUPABASE_URL}/functions/v1/generateStory`);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Origin', window.location.origin);
      xhr.setRequestHeader('x-test-source', 'bypass-xhr');
      xhr.timeout = 15000;
      
      xhr.send(JSON.stringify({
        test: true,
        source: 'bypass-test-2-xhr',
        storyId: `bypass-xhr-${Date.now()}`,
        objective: 'Test XHR direct',
        childrenNames: ['TestXHR']
      }));

      const xhrResult = await xhrPromise as any;
      
      testResults.push({
        test: "XMLHttpRequest direct",
        method: "XMLHttpRequest POST",
        success: xhrResult.success,
        duration: xhrResult.duration,
        details: {
          status: xhrResult.status,
          statusText: xhrResult.statusText,
          responsePreview: xhrResult.response?.substring(0, 300)
        },
        error: !xhrResult.success ? `XHR ${xhrResult.status}: ${xhrResult.statusText}` : undefined,
        response: xhrResult.response
      });

    } catch (error: any) {
      testResults.push({
        test: "XMLHttpRequest direct",
        method: "XMLHttpRequest POST",
        success: false,
        error: error.message,
        details: { errorType: error.constructor.name }
      });
    }

    // Test 3: Test avec différents domaines (CDN/Edge)
    try {
      console.log('🔬 [BYPASS-TESTS] Test 3 - Test via edge subdomain');
      const startTime = Date.now();
      
      const edgeUrl = SUPABASE_URL.replace('supabase.co', 'supabase.com');
      const response = await fetch(`${edgeUrl}/functions/v1/generateStory`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'x-test-source': 'bypass-edge-domain'
        },
        body: JSON.stringify({
          test: true,
          source: 'bypass-test-3-edge',
          storyId: `bypass-edge-${Date.now()}`,
          objective: 'Test edge domain',
          childrenNames: ['TestEdge']
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

      testResults.push({
        test: "Test edge subdomain",
        method: "fetch POST (edge)",
        success: response.ok,
        duration,
        details: { 
          status: response.status,
          statusText: response.statusText,
          testedUrl: edgeUrl,
          responsePreview: responseBody?.substring(0, 300)
        },
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
        response: responseBody
      });

    } catch (error: any) {
      testResults.push({
        test: "Test edge subdomain",
        method: "fetch POST (edge)",
        success: false,
        error: error.message,
        details: { errorType: error.constructor.name }
      });
    }

    // Test 4: Test avec méthode alternative (testConnection)
    try {
      console.log('🔬 [BYPASS-TESTS] Test 4 - testConnection function');
      const startTime = Date.now();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/testConnection`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'x-test-source': 'bypass-testconnection'
        },
        body: JSON.stringify({
          test: true,
          source: 'bypass-test-4-testconnection',
          timestamp: new Date().toISOString()
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

      testResults.push({
        test: "testConnection function",
        method: "fetch POST (testConnection)",
        success: response.ok,
        duration,
        details: { 
          status: response.status,
          statusText: response.statusText,
          responsePreview: responseBody?.substring(0, 300)
        },
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
        response: responseBody
      });

    } catch (error: any) {
      testResults.push({
        test: "testConnection function",
        method: "fetch POST (testConnection)",
        success: false,
        error: error.message,
        details: { errorType: error.constructor.name }
      });
    }

    setResults(testResults);
    setIsRunning(false);

    // Analyser les résultats
    const successfulTests = testResults.filter(r => r.success);
    const failedTests = testResults.filter(r => !r.success);

    console.log('🔬 [BYPASS-TESTS] Résultats Phase 2:', {
      total: testResults.length,
      success: successfulTests.length,
      failed: failedTests.length,
      results: testResults
    });

    if (successfulTests.length > 0) {
      toast({
        title: `✅ ${successfulTests.length} test(s) de contournement réussi(s)`,
        description: "Certaines méthodes bypassing fonctionnent - analyse du blocage en cours",
      });
    } else {
      toast({
        title: "❌ Tous les tests de contournement ont échoué",
        description: "Blocage complet des requêtes POST - problème critique identifié",
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
    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Router className="h-5 w-5" />
          🔬 Phase 2 - Tests de Contournement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300">
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Phase 2:</strong> Tests bypassing pour identifier le point exact de blocage des requêtes POST
          </div>
        </div>

        <Button 
          onClick={runBypassTests}
          disabled={isRunning}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          size="lg"
        >
          <Zap className="h-4 w-4 mr-2" />
          {isRunning ? "Tests de contournement en cours..." : "Lancer les tests Phase 2"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Résultats des tests de contournement:</h3>
            
            {results.map((result, index) => (
              <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(result.success)}
                    <span className="font-medium">{result.test}</span>
                    <Badge variant="outline" className="text-xs">{result.method}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "CONTOURNEMENT OK" : "BLOQUÉ"}
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
                      Détails du test de contournement
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}

                {result.response && (
                  <details className="text-xs text-gray-600 dark:text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                      Réponse complète du serveur
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto max-h-40">
                      {typeof result.response === 'string' ? result.response : JSON.stringify(result.response, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Analyse Phase 2:</strong> Ces tests identifient si le blocage vient du client Supabase, du routage, ou du serveur lui-même.
                {results.filter(r => r.success).length > 0 && (
                  <span className="text-green-700 dark:text-green-300"> ✅ Certains contournements fonctionnent - le problème est spécifique.</span>
                )}
                {results.filter(r => r.success).length === 0 && (
                  <span className="text-red-700 dark:text-red-300"> ❌ Blocage total - problème critique au niveau serveur/réseau.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BypassTestPanel;
