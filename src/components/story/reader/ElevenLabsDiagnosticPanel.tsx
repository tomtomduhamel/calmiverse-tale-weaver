
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, Volume2, AlertCircle, CheckCircle, Clock, User } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface DiagnosticResult {
  status: 'checking' | 'success' | 'error';
  message: string;
  details?: any;
}

interface ElevenLabsDiagnosticPanelProps {
  isDarkMode?: boolean;
}

export const ElevenLabsDiagnosticPanel: React.FC<ElevenLabsDiagnosticPanelProps> = ({
  isDarkMode = false
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResult({ status: 'checking', message: 'Vérification de l\'authentification...' });

    try {
      console.log('🔍 Début du diagnostic ElevenLabs...');
      
      // Vérifier d'abord l'authentification
      if (!user) {
        setResult({
          status: 'error',
          message: 'Utilisateur non connecté. Veuillez vous connecter pour utiliser cette fonctionnalité.',
          details: { authRequired: true }
        });
        return;
      }

      console.log('✅ Utilisateur connecté:', user.email);
      setResult({ status: 'checking', message: 'Test de connexion ElevenLabs en cours...' });
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { 
          text: 'Test de connexion',
          testConnection: true
        }
      });

      console.log('📡 Réponse diagnostic:', { data, error });

      if (error) {
        console.error('❌ Erreur détaillée:', error);
        
        let errorMessage = `Erreur de connexion: ${error.message}`;
        let details = error;
        
        // Messages d'erreur spécifiques selon le type d'erreur
        if (error.message?.includes('Failed to send a request')) {
          errorMessage = 'Impossible de contacter la fonction ElevenLabs. Vérifiez que la fonction est déployée.';
        } else if (error.message?.includes('JWT')) {
          errorMessage = 'Problème d\'authentification. Essayez de vous reconnecter.';
        } else if (error.message?.includes('Network')) {
          errorMessage = 'Problème de réseau. Vérifiez votre connexion internet.';
        }
        
        setResult({
          status: 'error',
          message: errorMessage,
          details
        });
        return;
      }

      if (data?.success) {
        setResult({
          status: 'success',
          message: data.message || 'Connexion ElevenLabs réussie',
          details: data
        });
        
        toast({
          title: "Diagnostic réussi",
          description: "La connexion ElevenLabs fonctionne correctement",
        });
      } else {
        setResult({
          status: 'error',
          message: data?.message || 'Échec de la connexion ElevenLabs',
          details: data
        });
      }

    } catch (error: any) {
      console.error('💥 Erreur diagnostic:', error);
      setResult({
        status: 'error',
        message: `Erreur inattendue: ${error.message}`,
        details: error
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = () => {
    if (isRunning) return <Clock className="h-4 w-4 animate-spin" />;
    if (!result) return <Volume2 className="h-4 w-4" />;
    
    switch (result.status) {
      case 'checking': return <Clock className="h-4 w-4 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Volume2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    if (!result) return 'secondary';
    
    switch (result.status) {
      case 'checking': return 'secondary';
      case 'success': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Volume2 className="h-4 w-4" />
          Diagnostic ElevenLabs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* État de l'authentification */}
        <div className="flex items-center justify-between">
          <span className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <User className="h-3 w-3" />
            Authentification
          </span>
          <Badge variant={user ? 'default' : 'destructive'}>
            {user ? 'Connecté' : 'Non connecté'}
          </Badge>
        </div>

        {/* État de la connexion API */}
        <div className="flex items-center justify-between">
          <span className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <Wifi className="h-3 w-3" />
            Connexion API
          </span>
          <Badge variant={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">
              {isRunning ? 'Test...' : result ? result.status : 'Non testé'}
            </span>
          </Badge>
        </div>

        {/* Message de résultat */}
        {result && (
          <div className={`p-2 rounded text-xs ${
            result.status === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : result.status === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {result.message}
          </div>
        )}

        {/* Informations détaillées en cas d'erreur */}
        {result?.status === 'error' && result.details && (
          <details className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <summary className="cursor-pointer">Détails techniques</summary>
            <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-20">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </details>
        )}

        {/* Recommandation si utilisateur non connecté */}
        {!user && (
          <div className="p-2 rounded text-xs bg-yellow-50 text-yellow-800 border border-yellow-200">
            💡 Connectez-vous pour tester la synthèse vocale ElevenLabs
          </div>
        )}

        {/* Actions */}
        <Button 
          onClick={runDiagnostic}
          disabled={isRunning || !user}
          size="sm" 
          variant="outline" 
          className={`w-full ${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`}
        >
          {isRunning ? (
            <>
              <Clock className="h-3 w-3 mr-2 animate-spin" />
              Test en cours...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-2" />
              Tester la connexion
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
