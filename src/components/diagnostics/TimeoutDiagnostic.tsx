import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { fetchWithRetry } from '@/utils/retryUtils';

interface DiagnosticResult {
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  duration?: number;
  error?: string;
  details?: string;
}

export const TimeoutDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([
    { name: 'Test Webhook n8n Titres', status: 'idle' },
    { name: 'Test Webhook n8n Histoire', status: 'idle' },
    { name: 'Test Timeout Court (5s)', status: 'idle' },
    { name: 'Test Retry Automatique', status: 'idle' }
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (index: number, update: Partial<DiagnosticResult>) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, ...update } : r));
  };

  const testWebhookTitles = async (index: number) => {
    updateResult(index, { status: 'running' });
    const startTime = Date.now();
    
    try {
      const testPayload = {
        action: 'generate_titles',
        objective: 'fun',
        childrenIds: ['test-id'],
        childrenNames: ['Test'],
        childrenGenders: ['boy'],
        requestType: 'diagnostic_test'
      };

      const response = await fetchWithRetry(
        'https://n8n.srv856374.hstgr.cloud/webhook/067eebcf-cb14-4e1b-8b6b-b21e872c1d60',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        },
        { maxRetries: 1, timeoutMs: 60000 } // Test avec timeout court
      );

      const duration = Date.now() - startTime;
      
      if (response.ok) {
        updateResult(index, { 
          status: 'success', 
          duration,
          details: `Webhook titres fonctionnel (${(duration/1000).toFixed(1)}s)`
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult(index, { 
        status: 'error', 
        duration,
        error: error.message,
        details: `Échec après ${(duration/1000).toFixed(1)}s`
      });
    }
  };

  const testWebhookStory = async (index: number) => {
    updateResult(index, { status: 'running' });
    const startTime = Date.now();
    
    try {
      const testPayload = {
        action: 'create_story_from_title',
        selectedTitle: 'Test Histoire',
        objective: 'fun',
        childrenNames: ['Test'],
        requestType: 'diagnostic_test'
      };

      const response = await fetchWithRetry(
        'https://n8n.srv856374.hstgr.cloud/webhook/816f3f78-bbdc-4b51-88b6-13232fcf3c78',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        },
        { maxRetries: 1, timeoutMs: 60000 }
      );

      const duration = Date.now() - startTime;
      
      if (response.ok) {
        updateResult(index, { 
          status: 'success', 
          duration,
          details: `Webhook histoire fonctionnel (${(duration/1000).toFixed(1)}s)`
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult(index, { 
        status: 'error', 
        duration,
        error: error.message,
        details: `Échec après ${(duration/1000).toFixed(1)}s`
      });
    }
  };

  const testTimeout = async (index: number) => {
    updateResult(index, { status: 'running' });
    const startTime = Date.now();
    
    try {
      // Test avec une URL qui timeout intentionnellement
      await fetchWithRetry(
        'https://httpstat.us/200?sleep=10000',
        { method: 'GET' },
        { maxRetries: 0, timeoutMs: 5000 }
      );
      
      updateResult(index, { status: 'error', error: 'Le timeout n\'a pas fonctionné' });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      if (error.message.includes('timeout') || error.message.includes('délai')) {
        updateResult(index, { 
          status: 'success', 
          duration,
          details: `Timeout détecté correctement après ${(duration/1000).toFixed(1)}s`
        });
      } else {
        updateResult(index, { 
          status: 'error', 
          duration,
          error: error.message 
        });
      }
    }
  };

  const testRetry = async (index: number) => {
    updateResult(index, { status: 'running' });
    const startTime = Date.now();
    
    try {
      // URL qui retourne 500 pour tester le retry
      await fetchWithRetry(
        'https://httpstat.us/500',
        { method: 'GET' },
        { maxRetries: 2, timeoutMs: 10000 }
      );
      
      updateResult(index, { status: 'error', error: 'Le retry n\'a pas échoué comme attendu' });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      if (duration > 4000) { // Si ça a pris plus de 4s, c'est qu'il y a eu des retries
        updateResult(index, { 
          status: 'success', 
          duration,
          details: `Système de retry fonctionnel (${(duration/1000).toFixed(1)}s avec retries)`
        });
      } else {
        updateResult(index, { 
          status: 'error', 
          duration,
          error: 'Retry trop rapide' 
        });
      }
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Reset tous les résultats
    setResults(prev => prev.map(r => ({ ...r, status: 'idle' as const, error: undefined, details: undefined })));
    
    // Lancer les tests séquentiellement
    await testWebhookTitles(0);
    await testWebhookStory(1);
    await testTimeout(2);
    await testRetry(3);
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 text-muted-foreground animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      idle: 'secondary',
      running: 'default',
      success: 'default',
      error: 'destructive'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Diagnostic Timeout & Retry
        </CardTitle>
        <CardDescription>
          Testez les timeouts, le système de retry et la connectivité n8n
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}
        </Button>
        
        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={result.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <div className="font-medium">{result.name}</div>
                  {result.details && (
                    <div className="text-sm text-muted-foreground">{result.details}</div>
                  )}
                  {result.error && (
                    <div className="text-sm text-red-500">Erreur: {result.error}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {result.duration && (
                  <span className="text-sm text-muted-foreground">
                    {(result.duration / 1000).toFixed(1)}s
                  </span>
                )}
                {getStatusBadge(result.status)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-muted-foreground mt-4">
          <p><strong>Tests effectués :</strong></p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Connectivité webhook n8n pour génération titres</li>
            <li>Connectivité webhook n8n pour création histoire</li>
            <li>Fonctionnement du système de timeout (5s)</li>
            <li>Fonctionnement du système de retry automatique</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};