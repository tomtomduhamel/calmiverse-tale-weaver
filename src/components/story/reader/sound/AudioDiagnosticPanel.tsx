
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, Database, Volume2 } from "lucide-react";

interface AudioDiagnosticPanelProps {
  diagnosticInfo?: any;
  onRunDiagnostic: () => void;
  onClearCache: () => void;
  soundDetails?: any;
}

export const AudioDiagnosticPanel: React.FC<AudioDiagnosticPanelProps> = ({
  diagnosticInfo,
  onRunDiagnostic,
  onClearCache,
  soundDetails
}) => {
  if (!diagnosticInfo) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Diagnostic Audio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={onRunDiagnostic} size="sm" className="w-full">
            <RefreshCw className="h-3 w-3 mr-2" />
            Lancer le diagnostic
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Diagnostic Audio Détaillé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* État réseau */}
        <div className="flex items-center justify-between">
          <span className="text-xs flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            Réseau
          </span>
          <Badge variant={diagnosticInfo.networkOk ? "default" : "destructive"}>
            {diagnosticInfo.networkOk ? "OK" : "KO"}
          </Badge>
        </div>

        {/* État Supabase */}
        <div className="flex items-center justify-between">
          <span className="text-xs flex items-center gap-1">
            <Database className="h-3 w-3" />
            Supabase
          </span>
          <Badge variant={diagnosticInfo.supabaseOk ? "default" : "destructive"}>
            {diagnosticInfo.supabaseOk ? "OK" : "KO"}
          </Badge>
        </div>

        {/* URL Audio */}
        {diagnosticInfo.audioUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">URL Audio</span>
              <Badge variant={diagnosticInfo.audioUrl.isValid ? "default" : "destructive"}>
                {diagnosticInfo.audioUrl.isValid ? "Valide" : "Invalide"}
              </Badge>
            </div>
            
            {diagnosticInfo.audioUrl.responseTime && (
              <div className="text-xs text-gray-500">
                Temps de réponse: {diagnosticInfo.audioUrl.responseTime}ms
              </div>
            )}
            
            {diagnosticInfo.audioUrl.error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {diagnosticInfo.audioUrl.error}
              </div>
            )}
          </div>
        )}

        {/* Cache */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs">Cache</span>
            <span className="text-xs text-gray-500">
              {diagnosticInfo.cacheStats.validEntries}/{diagnosticInfo.cacheStats.size}
            </span>
          </div>
        </div>

        {/* Détails du son */}
        {soundDetails && (
          <div className="space-y-1 border-t pt-2">
            <div className="text-xs font-medium">Son actuel:</div>
            <div className="text-xs text-gray-600">{soundDetails.title}</div>
            <div className="text-xs text-gray-500">{soundDetails.file_path}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onRunDiagnostic} size="sm" variant="outline" className="flex-1">
            <RefreshCw className="h-3 w-3 mr-1" />
            Tester
          </Button>
          <Button onClick={onClearCache} size="sm" variant="outline" className="flex-1">
            Vider cache
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
