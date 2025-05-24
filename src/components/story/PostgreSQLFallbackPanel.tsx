
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle, XCircle, Settings, RefreshCw } from "lucide-react";
import { usePostgreSQLFallback } from "@/hooks/stories/usePostgreSQLFallback";
import { useToast } from "@/hooks/use-toast";

export const PostgreSQLFallbackPanel: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const { toast } = useToast();
  const { 
    activateFallbackMode, 
    deactivateFallbackMode, 
    getHealthStatus,
    generateStoryWithFallback,
    isGenerating
  } = usePostgreSQLFallback();

  useEffect(() => {
    updateHealthStatus();
    const interval = setInterval(updateHealthStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateHealthStatus = () => {
    const status = getHealthStatus();
    setHealthStatus(status);
  };

  const handleActivateFallback = () => {
    activateFallbackMode();
    updateHealthStatus();
    toast({
      title: "Fallback PostgreSQL activé",
      description: "Le système utilisera PostgreSQL pour la génération d'histoires",
    });
  };

  const handleDeactivateFallback = () => {
    deactivateFallbackMode();
    updateHealthStatus();
    toast({
      title: "Fallback PostgreSQL désactivé",
      description: "Le système utilisera les Edge Functions par défaut",
    });
  };

  const handleTestFallback = async () => {
    try {
      const testStoryId = await generateStoryWithFallback({
        objective: 'fun',
        childrenNames: ['TestFallback']
      });
      
      toast({
        title: "Test réussi",
        description: `Histoire de test créée: ${testStoryId}`,
      });
    } catch (error: any) {
      toast({
        title: "Test échoué",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <Database className="h-5 w-5" />
          🐘 PostgreSQL Fallback - RLS Sécurisé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded border border-purple-300">
          <div className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Objectif:</strong> Système de contournement PostgreSQL avec politiques RLS corrigées
          </div>
        </div>

        {/* Statut du fallback */}
        {healthStatus && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Statut Fallback:</span>
              <div className="flex items-center gap-2">
                {healthStatus.isFallbackMode ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-500" />
                )}
                <Badge variant={healthStatus.isFallbackMode ? "default" : "secondary"}>
                  {healthStatus.isFallbackMode ? "ACTIF" : "INACTIF"}
                </Badge>
              </div>
            </div>

            {healthStatus.activatedAt && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Activé le: {healthStatus.activatedAt.toLocaleString()}
              </div>
            )}

            {healthStatus.isGenerating && (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Génération en cours...
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button 
            onClick={handleActivateFallback}
            disabled={healthStatus?.isFallbackMode || isGenerating}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Activer
          </Button>
          
          <Button 
            onClick={handleDeactivateFallback}
            disabled={!healthStatus?.isFallbackMode || isGenerating}
            variant="outline"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Désactiver
          </Button>
          
          <Button 
            onClick={handleTestFallback}
            disabled={!healthStatus?.isFallbackMode || isGenerating}
            variant="secondary"
          >
            <Database className="h-4 w-4 mr-2" />
            Test
          </Button>
        </div>

        {/* Informations système */}
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300">
          <div className="text-sm text-green-800 dark:text-green-200">
            <strong>✅ Phase 4 Implémentée:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Politiques RLS corrigées avec WITH CHECK</li>
              <li>Trigger auto-assignation authorid</li>
              <li>Gestion erreurs RLS dans fallback</li>
              <li>Validation sécurité utilisateur</li>
              <li>Nettoyage histoires en erreur</li>
            </ul>
          </div>
        </div>

        {/* Instructions d'utilisation */}
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>💡 Utilisation:</strong> Ce système contourne les problèmes Edge Functions en utilisant PostgreSQL directement avec les politiques RLS corrigées.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostgreSQLFallbackPanel;
