
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FunctionStatus {
  name: string;
  accessible: boolean;
  corsEnabled: boolean;
  authRequired: boolean;
  responseTime?: number;
  error?: string;
  lastResponse?: any;
}

export const EdgeFunctionStatusPanel: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [functionStatuses, setFunctionStatuses] = useState<FunctionStatus[]>([]);
  const { toast } = useToast();

  const checkEdgeFunctions = async () => {
    setIsChecking(true);
    setFunctionStatuses([]);
    
    console.log('🔍 [EDGE-DIAGNOSTIC] Début de la vérification des Edge Functions');
    
    const functionsToTest = ['generateStory', 'testConnection', 'regenerateStory'];
    const statuses: FunctionStatus[] = [];

    for (const functionName of functionsToTest) {
      console.log(`🔍 [EDGE-DIAGNOSTIC] Test de la fonction: ${functionName}`);
      
      try {
        // Test CORS (OPTIONS)
        const corsStartTime = Date.now();
        const corsResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/${functionName}`, {
          method: 'OPTIONS',
          headers: {
            'apikey': supabase.supabaseKey,
            'Origin': window.location.origin
          },
          signal: AbortSignal.timeout(5000)
        });
        const corsResponseTime = Date.now() - corsStartTime;

        // Test d'accessibilité (POST avec données minimales)
        const accessStartTime = Date.now();
        let accessResponse;
        let accessError;
        
        try {
          const session = await supabase.auth.getSession();
          accessResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: {
              'apikey': supabase.supabaseKey,
              'Authorization': `Bearer ${session.data.session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              test: true,
              diagnostic: true,
              timestamp: new Date().toISOString()
            }),
            signal: AbortSignal.timeout(10000)
          });
        } catch (error: any) {
          accessError = error.message;
        }
        
        const accessResponseTime = Date.now() - accessStartTime;

        // Test via supabase.functions.invoke
        const invokeStartTime = Date.now();
        let invokeResult;
        let invokeError;
        
        try {
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: {
              test: true,
              diagnostic: true,
              source: 'EdgeFunctionStatusPanel'
            }
          });
          invokeResult = { data, error: error?.message };
          if (error) invokeError = error.message;
        } catch (error: any) {
          invokeError = error.message;
        }
        
        const invokeResponseTime = Date.now() - invokeStartTime;

        statuses.push({
          name: functionName,
          accessible: (accessResponse?.ok || !accessError) ?? false,
          corsEnabled: corsResponse.ok,
          authRequired: accessResponse?.status !== 401,
          responseTime: Math.min(corsResponseTime, accessResponseTime, invokeResponseTime),
          error: accessError || invokeError,
          lastResponse: {
            cors: {
              status: corsResponse.status,
              headers: Object.fromEntries(corsResponse.headers.entries())
            },
            access: accessResponse ? {
              status: accessResponse.status,
              statusText: accessResponse.statusText
            } : { error: accessError },
            invoke: invokeResult || { error: invokeError }
          }
        });

      } catch (error: any) {
        console.error(`❌ [EDGE-DIAGNOSTIC] Erreur pour ${functionName}:`, error);
        statuses.push({
          name: functionName,
          accessible: false,
          corsEnabled: false,
          authRequired: true,
          error: error.message
        });
      }
    }

    setFunctionStatuses(statuses);
    setIsChecking(false);

    const failedFunctions = statuses.filter(s => !s.accessible);
    if (failedFunctions.length === 0) {
      toast({
        title: "✅ Toutes les Edge Functions sont accessibles",
        description: "Aucun problème détecté au niveau des fonctions",
      });
    } else {
      toast({
        title: "⚠️ Problèmes détectés",
        description: `${failedFunctions.length} fonction(s) inaccessible(s)`,
        variant: "destructive"
      });
    }

    console.log('📊 [EDGE-DIAGNOSTIC] Résultats:', statuses);
  };

  const getStatusIcon = (accessible: boolean) => {
    return accessible ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <Server className="h-5 w-5" />
          🔧 État des Edge Functions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded border border-purple-300">
          <div className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Objectif:</strong> Vérifier l'accessibilité, CORS et authentification des Edge Functions
          </div>
        </div>

        <Button 
          onClick={checkEdgeFunctions}
          disabled={isChecking}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? "Vérification en cours..." : "Vérifier les Edge Functions"}
        </Button>

        {functionStatuses.length > 0 && (
          <div className="space-y-3">
            {functionStatuses.map((status, index) => (
              <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.accessible)}
                    <span className="font-medium">{status.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={status.accessible ? "default" : "destructive"}>
                      {status.accessible ? "ACCESSIBLE" : "BLOQUÉE"}
                    </Badge>
                    {status.responseTime && (
                      <Badge variant="secondary">{status.responseTime}ms</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    {status.corsEnabled ? 
                      <CheckCircle className="h-3 w-3 text-green-500" /> : 
                      <XCircle className="h-3 w-3 text-red-500" />
                    }
                    <span>CORS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {status.authRequired ? 
                      <CheckCircle className="h-3 w-3 text-green-500" /> : 
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    }
                    <span>Auth</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!status.error ? 
                      <CheckCircle className="h-3 w-3 text-green-500" /> : 
                      <XCircle className="h-3 w-3 text-red-500" />
                    }
                    <span>Réponse</span>
                  </div>
                </div>

                {status.error && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                    ❌ {status.error}
                  </div>
                )}

                {status.lastResponse && (
                  <details className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                      Détails des réponses
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                      {JSON.stringify(status.lastResponse, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EdgeFunctionStatusPanel;
