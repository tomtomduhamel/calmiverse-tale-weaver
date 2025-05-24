
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Package, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RedeploymentResult {
  action: string;
  success: boolean;
  duration?: number;
  details?: any;
  error?: string;
}

export const ForcedRedeploymentPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RedeploymentResult[]>([]);
  const { toast } = useToast();

  const runForcedRedeployment = async () => {
    setIsRunning(true);
    setResults([]);
    const deployResults: RedeploymentResult[] = [];

    console.log('🚀 [REDEPLOYMENT] Début du redéploiement forcé Phase 2');

    // Action 1: Créer une nouvelle fonction de test
    try {
      console.log('🚀 [REDEPLOYMENT] Action 1 - Test nouvelle fonction');
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('generateStoryV2', {
        body: {
          test: true,
          source: 'forced-redeployment-test',
          storyId: `redeploy-test-${Date.now()}`,
          objective: 'Test nouveau déploiement',
          childrenNames: ['TestRedeploy']
        }
      });
      
      const duration = Date.now() - startTime;

      deployResults.push({
        action: "Test generateStoryV2",
        success: !error,
        duration,
        details: { data, error: error?.message },
        error: error?.message
      });

    } catch (error: any) {
      deployResults.push({
        action: "Test generateStoryV2",
        success: false,
        error: error.message,
        details: { errorType: error.constructor.name }
      });
    }

    // Action 2: Tenter d'invoquer avec paramètres différents
    try {
      console.log('🚀 [REDEPLOYMENT] Action 2 - Test avec nouveaux paramètres');
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('generateStory', {
        body: {
          test: true,
          redeployment: true,
          version: 'v2.0',
          timestamp: new Date().toISOString(),
          source: 'forced-redeployment-v2',
          storyId: crypto.randomUUID(),
          objective: 'Test redéploiement forcé',
          childrenNames: ['TestForced']
        }
      });
      
      const duration = Date.now() - startTime;

      deployResults.push({
        action: "generateStory avec nouveaux paramètres",
        success: !error,
        duration,
        details: { data, error: error?.message },
        error: error?.message
      });

    } catch (error: any) {
      deployResults.push({
        action: "generateStory avec nouveaux paramètres",
        success: false,
        error: error.message,
        details: { errorType: error.constructor.name }
      });
    }

    // Action 3: Test direct avec un UUID valide de story existante
    try {
      console.log('🚀 [REDEPLOYMENT] Action 3 - Test avec story UUID existante');
      const startTime = Date.now();
      
      // D'abord, récupérer une story existante
      const { data: stories } = await supabase
        .from('stories')
        .select('id')
        .limit(1);
      
      const existingStoryId = stories?.[0]?.id || '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase.functions.invoke('generateStory', {
        body: {
          storyId: existingStoryId,
          objective: 'Test avec story existante',
          childrenNames: ['TestExisting'],
          redeploymentTest: true
        }
      });
      
      const duration = Date.now() - startTime;

      deployResults.push({
        action: "Test avec story UUID existante",
        success: !error,
        duration,
        details: { 
          data, 
          error: error?.message,
          storyId: existingStoryId
        },
        error: error?.message
      });

    } catch (error: any) {
      deployResults.push({
        action: "Test avec story UUID existante",
        success: false,
        error: error.message,
        details: { errorType: error.constructor.name }
      });
    }

    // Action 4: Test de connectivité de base
    try {
      console.log('🚀 [REDEPLOYMENT] Action 4 - Test connectivité base');
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('testConnection', {
        body: {
          redeploymentTest: true,
          timestamp: new Date().toISOString()
        }
      });
      
      const duration = Date.now() - startTime;

      deployResults.push({
        action: "Test connectivité testConnection",
        success: !error,
        duration,
        details: { data, error: error?.message },
        error: error?.message
      });

    } catch (error: any) {
      deployResults.push({
        action: "Test connectivité testConnection",
        success: false,
        error: error.message,
        details: { errorType: error.constructor.name }
      });
    }

    setResults(deployResults);
    setIsRunning(false);

    // Analyser les résultats
    const successfulActions = deployResults.filter(r => r.success);
    const failedActions = deployResults.filter(r => !r.success);

    console.log('🚀 [REDEPLOYMENT] Résultats redéploiement forcé:', {
      total: deployResults.length,
      success: successfulActions.length,
      failed: failedActions.length,
      results: deployResults
    });

    if (successfulActions.length > 0) {
      toast({
        title: `✅ ${successfulActions.length} action(s) de redéploiement réussie(s)`,
        description: "Certaines fonctions répondent - diagnostiquons la différence",
      });
    } else {
      toast({
        title: "❌ Redéploiement forcé échoué",
        description: "Toutes les tentatives ont échoué - problème système critique",
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
    <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
          <Package className="h-5 w-5" />
          🚀 Phase 2 - Redéploiement Forcé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded border border-indigo-300">
          <div className="text-sm text-indigo-800 dark:text-indigo-200">
            <strong>Objectif:</strong> Forcer le redéploiement et tester différentes variations pour contourner le blocage
          </div>
        </div>

        <Button 
          onClick={runForcedRedeployment}
          disabled={isRunning}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          size="lg"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? "Redéploiement en cours..." : "Lancer le redéploiement forcé"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-indigo-800 dark:text-indigo-200">Résultats du redéploiement:</h3>
            
            {results.map((result, index) => (
              <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(result.success)}
                    <span className="font-medium">{result.action}</span>
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
                      Détails du redéploiement
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300">
              <div className="text-sm text-green-800 dark:text-green-200">
                <strong>Analyse Redéploiement:</strong> Ces tests déterminent si un nouveau déploiement peut contourner le blocage.
                {results.filter(r => r.success).length > 0 && (
                  <span className="text-green-700 dark:text-green-300"> ✅ Certaines variantes fonctionnent - le problème est spécifique à la configuration.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForcedRedeploymentPanel;
