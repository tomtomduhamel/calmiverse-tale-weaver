
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Bug } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import ConnectionTestPanel from "./ConnectionTestPanel";
import type { Story } from "@/types/story";

interface DiagnosticInfo {
  authStatus: 'checking' | 'authenticated' | 'error';
  edgeFunctionStatus: 'checking' | 'available' | 'error';
  lastError?: string;
  testResult?: 'success' | 'failed' | 'pending';
}

interface StoryGenerationDiagnosticProps {
  stories: Story[];
  onRecoveryComplete?: () => void;
}

/**
 * Composant de diagnostic pour la génération d'histoires
 */
export const StoryGenerationDiagnostic: React.FC<StoryGenerationDiagnosticProps> = ({
  stories,
  onRecoveryComplete
}) => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo>({
    authStatus: 'checking',
    edgeFunctionStatus: 'checking'
  });
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const { toast } = useToast();

  const stuckStories = stories.filter(s => {
    if (s.status !== 'pending') return false;
    const timeDiff = Date.now() - new Date(s.createdAt).getTime();
    return timeDiff > 5 * 60 * 1000; // Plus de 5 minutes
  });

  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    console.log('🔍 [Diagnostic] Début du diagnostic système...');

    try {
      // Test d'authentification
      console.log('🔍 [Diagnostic] Test d\'authentification...');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        setDiagnostic(prev => ({ 
          ...prev, 
          authStatus: 'error',
          lastError: 'Session expirée ou invalide'
        }));
        return;
      }

      setDiagnostic(prev => ({ ...prev, authStatus: 'authenticated' }));
      console.log('✅ [Diagnostic] Authentification OK');

      // Test de la fonction edge
      console.log('🔍 [Diagnostic] Test de la fonction edge...');
      try {
        const { data, error } = await supabase.functions.invoke('generateStory', {
          body: { 
            test: true,
            storyId: 'diagnostic-test',
            objective: 'Test de diagnostic',
            childrenNames: ['Test']
          }
        });

        if (error) {
          console.error('❌ [Diagnostic] Erreur fonction edge:', error);
          setDiagnostic(prev => ({ 
            ...prev, 
            edgeFunctionStatus: 'error',
            lastError: `Fonction edge: ${error.message}`
          }));
        } else {
          console.log('✅ [Diagnostic] Fonction edge accessible');
          setDiagnostic(prev => ({ 
            ...prev, 
            edgeFunctionStatus: 'available'
          }));
        }
      } catch (edgeError: any) {
        console.error('❌ [Diagnostic] Exception fonction edge:', edgeError);
        setDiagnostic(prev => ({ 
          ...prev, 
          edgeFunctionStatus: 'error',
          lastError: `Exception edge: ${edgeError.message}`
        }));
      }

    } catch (error: any) {
      console.error('💥 [Diagnostic] Erreur globale:', error);
      setDiagnostic(prev => ({ 
        ...prev, 
        lastError: `Erreur globale: ${error.message}`
      }));
    }

    setIsRunningDiagnostic(false);
  };

  const forceRetryStory = async (storyId: string) => {
    try {
      console.log(`🔄 [Diagnostic] Relance forcée de l'histoire: ${storyId}`);
      
      // Remettre en pending avec un nouveau timestamp
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          status: 'pending',
          updatedat: new Date().toISOString(),
          error: null
        })
        .eq('id', storyId);

      if (updateError) throw updateError;

      // Appeler directement generateStory
      const { error: retryError } = await supabase.functions.invoke('generateStory', {
        body: { storyId }
      });

      if (retryError) {
        console.error('❌ [Diagnostic] Erreur lors de la relance:', retryError);
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: `Relance échouée: ${retryError.message}`,
            updatedat: new Date().toISOString()
          })
          .eq('id', storyId);
        
        throw retryError;
      }

      toast({
        title: "Relance réussie",
        description: "L'histoire a été relancée avec succès",
      });

      if (onRecoveryComplete) {
        onRecoveryComplete();
      }

    } catch (error: any) {
      console.error('💥 [Diagnostic] Erreur lors de la relance forcée:', error);
      toast({
        title: "Erreur de relance",
        description: error.message || "Impossible de relancer l'histoire",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking': return <Clock className="h-4 w-4 animate-spin" />;
      case 'authenticated':
      case 'available': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checking': return 'secondary';
      case 'authenticated':
      case 'available': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Bug className="h-5 w-5" />
          Diagnostic de Génération d'Histoires
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut du système */}
        <div className="space-y-2">
          <h4 className="font-medium">État du Système</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
              <span className="text-sm">Authentification</span>
              <Badge variant={getStatusColor(diagnostic.authStatus)}>
                {getStatusIcon(diagnostic.authStatus)}
                <span className="ml-1 capitalize">{diagnostic.authStatus}</span>
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
              <span className="text-sm">Fonction Edge</span>
              <Badge variant={getStatusColor(diagnostic.edgeFunctionStatus)}>
                {getStatusIcon(diagnostic.edgeFunctionStatus)}
                <span className="ml-1 capitalize">{diagnostic.edgeFunctionStatus}</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Erreurs */}
        {diagnostic.lastError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Dernière erreur:</strong> {diagnostic.lastError}
            </p>
          </div>
        )}

        {/* Histoires bloquées */}
        {stuckStories.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Histoires Bloquées ({stuckStories.length})</h4>
            <div className="space-y-2">
              {stuckStories.slice(0, 3).map(story => (
                <div key={story.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{story.title}</span>
                    <span className="text-xs text-gray-500 truncate block">
                      ID: {story.id} • Créée il y a {Math.round((Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60))} min
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => forceRetryStory(story.id)}
                    className="ml-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Forcer
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t">
          <Button 
            onClick={runDiagnostic}
            disabled={isRunningDiagnostic}
            className="w-full"
            variant="outline"
          >
            {isRunningDiagnostic ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Diagnostic en cours...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Relancer le Diagnostic
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoryGenerationDiagnostic;
