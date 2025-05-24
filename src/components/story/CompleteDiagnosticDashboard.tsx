
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Target } from "lucide-react";
import NetworkDiagnosticPanel from "./NetworkDiagnosticPanel";
import EdgeFunctionStatusPanel from "./EdgeFunctionStatusPanel";
import StoryCreationDiagnostic from "./StoryCreationDiagnostic";
import ConnectionTestPanel from "./ConnectionTestPanel";

export const CompleteDiagnosticDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-4">
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <Target className="h-5 w-5" />
            🚨 Phase 1 - Diagnostic Complet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded border border-red-300">
            <div className="text-sm text-red-800 dark:text-red-200 space-y-2">
              <div><strong>Problème:</strong> Génération d'histoires non fonctionnelle depuis les corrections RLS/Security</div>
              <div><strong>Symptômes:</strong> POST requests n'atteignent pas les Edge Functions</div>
              <div><strong>Objectif Phase 1:</strong> Identifier précisément le point de blocage</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <Badge variant="outline" className="text-xs">
              ⏱️ Tests de connectivité réseau
            </Badge>
            <Badge variant="outline" className="text-xs">
              🔧 État des Edge Functions
            </Badge>
            <Badge variant="outline" className="text-xs">
              📖 Processus de création d'histoire
            </Badge>
            <Badge variant="outline" className="text-xs">
              🔗 Tests de connexion existants
            </Badge>
          </div>

          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300">
            <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span><strong>Instructions:</strong> Lancez tous les diagnostics ci-dessous pour collecter les données de Phase 1</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <NetworkDiagnosticPanel />
        <EdgeFunctionStatusPanel />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <StoryCreationDiagnostic />
        <ConnectionTestPanel />
      </div>

      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            ✅ Prochaines Étapes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
            <div><strong>1.</strong> Exécutez tous les diagnostics ci-dessus</div>
            <div><strong>2.</strong> Analysez les résultats pour identifier le(s) point(s) de blocage</div>
            <div><strong>3.</strong> Reportez les résultats pour passer à la Phase 2 (Solutions Progressives)</div>
            <div><strong>4.</strong> En cas d'échec de la Phase 2, nous passerons à la Phase 3 (Solutions Radicales)</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteDiagnosticDashboard;
