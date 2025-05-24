
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestTube, Zap, CheckCircle, XCircle } from "lucide-react";
import { useConnectionTest } from "@/hooks/stories/useConnectionTest";

export const ConnectionTestPanel: React.FC = () => {
  const { testConnection, testGenerateStoryDirect, isTestingtConnection, lastTestResult } = useConnectionTest();

  return (
    <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <TestTube className="h-5 w-5" />
          Test de Connexion Radical - Phase 2
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            onClick={testConnection}
            disabled={isTestingtConnection}
            className="w-full"
            variant="outline"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test Connexion Base
          </Button>
          
          <Button 
            onClick={testGenerateStoryDirect}
            disabled={isTestingtConnection}
            className="w-full"
            variant="outline"
          >
            <Zap className="h-4 w-4 mr-2" />
            Test generateStory Direct
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
                ✅ Connexion fonctionnelle - Les appels POST atteignent la fonction
              </div>
            ) : (
              <div className="text-sm text-red-700 dark:text-red-300">
                ❌ {lastTestResult.error || "Connexion bloquée"}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-purple-600 dark:text-purple-300 p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
          <strong>Diagnostic Phase 2:</strong> Ce test va révéler si le problème vient des appels edge functions en général ou spécifiquement de generateStory
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionTestPanel;
