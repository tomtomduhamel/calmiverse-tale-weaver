
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestTube, Zap, CheckCircle, XCircle, Wrench } from "lucide-react";
import { useConnectionTest } from "@/hooks/stories/useConnectionTest";

export const ConnectionTestPanel: React.FC = () => {
  const { testConnection, testGenerateStoryDirect, isTesting, lastTestResult } = useConnectionTest();

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <Wrench className="h-5 w-5" />
          ✅ Test de Connexion - NOM CORRIGÉ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300">
          <div className="text-sm text-green-800 dark:text-green-200">
            🔧 <strong>Correction appliquée:</strong> Tous les appels utilisent maintenant "generateStory" (nom cohérent)
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            onClick={testConnection}
            disabled={isTesting}
            className="w-full"
            variant="outline"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test Connexion Base
          </Button>
          
          <Button 
            onClick={testGenerateStoryDirect}
            disabled={isTesting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Test generateStory FINAL
          </Button>
        </div>

        {lastTestResult && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded border">
            <div className="flex items-center gap-2 mb-2">
              {lastTestResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={lastTestResult.success ? "default" : "destructive"}>
                {lastTestResult.success ? "SUCCÈS" : "ÉCHEC"}
              </Badge>
              {lastTestResult.duration && (
                <Badge variant="secondary">{lastTestResult.duration}ms</Badge>
              )}
            </div>
            
            {lastTestResult.success ? (
              <div className="text-sm text-green-700 dark:text-green-300">
                ✅ Connexion fonctionnelle - Les appels POST atteignent generateStory avec le nom correct
              </div>
            ) : (
              <div className="text-sm text-red-700 dark:text-red-300">
                ❌ {lastTestResult.error || "Connexion encore bloquée"}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-green-600 dark:text-green-300 p-2 bg-green-100 dark:bg-green-900/30 rounded">
          <strong>Correction Finale:</strong> Le nom de fonction est maintenant cohérent partout. 
          Si les tests échouent encore, le problème est ailleurs (réseau/CORS/déploiement).
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionTestPanel;
