
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Wifi, Database, Volume2, AlertCircle, CheckCircle, Clock, Settings, Bug, Zap } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface DiagnosticStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
  duration?: number;
}

interface AdvancedElevenLabsDiagnosticProps {
  isDarkMode?: boolean;
}

export const AdvancedElevenLabsDiagnostic: React.FC<AdvancedElevenLabsDiagnosticProps> = ({
  isDarkMode = false
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [diagnosticSteps, setDiagnosticSteps] = useState<DiagnosticStep[]>([]);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const initializeDiagnosticSteps = (): DiagnosticStep[] => [
    { name: 'Authentification utilisateur', status: 'pending' },
    { name: 'Test de ping Edge Function', status: 'pending' },
    { name: 'Configuration des secrets', status: 'pending' },
    { name: 'Test API ElevenLabs', status: 'pending' },
    { name: 'Génération audio test', status: 'pending' },
    { name: 'Test de performance', status: 'pending' }
  ];

  const updateStep = (stepName: string, updates: Partial<DiagnosticStep>) => {
    setDiagnosticSteps(prev => prev.map(step => 
      step.name === stepName ? { ...step, ...updates } : step
    ));
  };

  const runComprehensiveDiagnostic = async () => {
    setIsRunning(true);
    setProgress(0);
    const steps = initializeDiagnosticSteps();
    setDiagnosticSteps(steps);

    try {
      console.log('🔍 [AdvancedDiagnostic] Début du diagnostic technique complet...');

      // Étape 1: Vérification de l'authentification
      setCurrentStep('Authentification utilisateur');
      setProgress(15);
      updateStep('Authentification utilisateur', { status: 'running' });
      
      const startTime1 = Date.now();
      if (!user) {
        updateStep('Authentification utilisateur', {
          status: 'error',
          message: 'Utilisateur non connecté',
          duration: Date.now() - startTime1
        });
        throw new Error('Authentification requise');
      }
      
      updateStep('Authentification utilisateur', {
        status: 'success',
        message: `Connecté: ${user.email}`,
        duration: Date.now() - startTime1
      });

      // Étape 2: Test de ping Edge Function
      setCurrentStep('Test de ping Edge Function');
      setProgress(30);
      updateStep('Test de ping Edge Function', { status: 'running' });
      
      const startTime2 = Date.now();
      try {
        console.log('🏓 Testing ping with supabase.functions.invoke...');
        
        const { data: pingData, error: pingError } = await supabase.functions.invoke('tts-elevenlabs', {
          body: { ping: true }
        });
        
        if (pingError) {
          console.error('❌ Ping error:', pingError);
          updateStep('Test de ping Edge Function', {
            status: 'error',
            message: `Erreur ping: ${pingError.message}`,
            details: pingError,
            duration: Date.now() - startTime2
          });
        } else {
          console.log('✅ Ping successful:', pingData);
          updateStep('Test de ping Edge Function', {
            status: 'success',
            message: 'Edge Function accessible',
            details: pingData,
            duration: Date.now() - startTime2
          });
        }
      } catch (error: any) {
        console.error('💥 Ping exception:', error);
        updateStep('Test de ping Edge Function', {
          status: 'error',
          message: `Exception ping: ${error.message}`,
          details: error,
          duration: Date.now() - startTime2
        });
      }

      // Étape 3: Configuration des secrets
      setCurrentStep('Configuration des secrets');
      setProgress(45);
      updateStep('Configuration des secrets', { status: 'running' });
      
      const startTime3 = Date.now();
      try {
        console.log('🔐 Testing secrets configuration...');
        
        const { data: secretsTest, error: secretsError } = await supabase.functions.invoke('tts-elevenlabs', {
          body: { testSecrets: true }
        });
        
        if (secretsError) {
          console.error('❌ Secrets error:', secretsError);
          updateStep('Configuration des secrets', {
            status: 'error',
            message: `Erreur secrets: ${secretsError.message}`,
            details: secretsError,
            duration: Date.now() - startTime3
          });
        } else {
          console.log('✅ Secrets test result:', secretsTest);
          updateStep('Configuration des secrets', {
            status: secretsTest?.success ? 'success' : 'error',
            message: secretsTest?.success ? 'Secrets configurés correctement' : 'Problème de configuration des secrets',
            details: secretsTest,
            duration: Date.now() - startTime3
          });
        }
      } catch (error: any) {
        console.error('💥 Secrets exception:', error);
        updateStep('Configuration des secrets', {
          status: 'error',
          message: `Exception secrets: ${error.message}`,
          details: error,
          duration: Date.now() - startTime3
        });
      }

      // Étape 4: Test API ElevenLabs
      setCurrentStep('Test API ElevenLabs');
      setProgress(60);
      updateStep('Test API ElevenLabs', { status: 'running' });
      
      const startTime4 = Date.now();
      try {
        console.log('🎤 Testing ElevenLabs API connection...');
        
        const { data: elevenLabsTest, error: elevenLabsError } = await supabase.functions.invoke('tts-elevenlabs', {
          body: { testConnection: true }
        });
        
        if (elevenLabsError) {
          console.error('❌ ElevenLabs API error:', elevenLabsError);
          updateStep('Test API ElevenLabs', {
            status: 'error',
            message: `API Test échoué: ${elevenLabsError.message}`,
            details: elevenLabsError,
            duration: Date.now() - startTime4
          });
        } else {
          console.log('✅ ElevenLabs API test result:', elevenLabsTest);
          updateStep('Test API ElevenLabs', {
            status: elevenLabsTest?.success ? 'success' : 'error',
            message: elevenLabsTest?.message || 'Test API réalisé',
            details: elevenLabsTest,
            duration: Date.now() - startTime4
          });
        }
      } catch (error: any) {
        console.error('💥 ElevenLabs API exception:', error);
        updateStep('Test API ElevenLabs', {
          status: 'error',
          message: `Exception API: ${error.message}`,
          details: error,
          duration: Date.now() - startTime4
        });
      }

      // Étape 5: Génération audio test
      setCurrentStep('Génération audio test');
      setProgress(80);
      updateStep('Génération audio test', { status: 'running' });
      
      const startTime5 = Date.now();
      try {
        console.log('🎵 Testing audio generation...');
        
        const { data: audioTest, error: audioError } = await supabase.functions.invoke('tts-elevenlabs', {
          body: { 
            text: 'Test diagnostic Calmiverse.',
            voiceId: '9BWtsMINqrJLrRacOk9x',
            modelId: 'eleven_multilingual_v2'
          }
        });
        
        if (audioError) {
          console.error('❌ Audio generation error:', audioError);
          updateStep('Génération audio test', {
            status: 'error',
            message: `Génération échouée: ${audioError.message}`,
            details: audioError,
            duration: Date.now() - startTime5
          });
        } else {
          console.log('✅ Audio generation result:', audioTest);
          const audioSize = audioTest?.audioContent?.length || 0;
          updateStep('Génération audio test', {
            status: audioTest?.success ? 'success' : 'error',
            message: audioTest?.success ? `Audio généré: ${Math.round(audioSize / 1024)}KB` : 'Génération échouée',
            details: { ...audioTest, audioSizeKB: Math.round(audioSize / 1024) },
            duration: Date.now() - startTime5
          });
        }
      } catch (error: any) {
        console.error('💥 Audio generation exception:', error);
        updateStep('Génération audio test', {
          status: 'error',
          message: `Exception audio: ${error.message}`,
          details: error,
          duration: Date.now() - startTime5
        });
      }

      // Étape 6: Test de performance
      setCurrentStep('Test de performance');
      setProgress(100);
      updateStep('Test de performance', { status: 'running' });
      
      const startTime6 = Date.now();
      try {
        console.log('⚡ Testing performance...');
        
        const performanceResults = [];
        for (let i = 0; i < 3; i++) {
          const testStart = Date.now();
          try {
            await supabase.functions.invoke('tts-elevenlabs', {
              body: { ping: true }
            });
            performanceResults.push(Date.now() - testStart);
          } catch (e) {
            performanceResults.push(-1);
          }
        }
        
        const validResults = performanceResults.filter(r => r > 0);
        const avgLatency = validResults.length > 0 ? validResults.reduce((a, b) => a + b, 0) / validResults.length : -1;
        
        updateStep('Test de performance', {
          status: avgLatency > 0 ? 'success' : 'error',
          message: avgLatency > 0 ? `Latence moyenne: ${Math.round(avgLatency)}ms` : 'Tests de performance échoués',
          details: { latencies: performanceResults, average: avgLatency },
          duration: Date.now() - startTime6
        });
      } catch (error: any) {
        console.error('💥 Performance test exception:', error);
        updateStep('Test de performance', {
          status: 'error',
          message: `Exception performance: ${error.message}`,
          details: error,
          duration: Date.now() - startTime6
        });
      }

      toast({
        title: "Diagnostic terminé",
        description: "Analyse technique complète effectuée",
      });

    } catch (error: any) {
      console.error('💥 [AdvancedDiagnostic] Erreur:', error);
      toast({
        title: "Erreur de diagnostic",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  const getStepIcon = (step: DiagnosticStep) => {
    switch (step.status) {
      case 'running': return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStepBadgeVariant = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'running': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Bug className="h-4 w-4" />
          Diagnostic Technique Avancé ElevenLabs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connectez-vous pour effectuer le diagnostic complet
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button 
            onClick={runComprehensiveDiagnostic}
            disabled={isRunning || !user}
            className={`${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`}
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Diagnostic en cours... ({Math.round(progress)}%)
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Lancer le diagnostic complet
              </>
            )}
          </Button>
        </div>

        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentStep && `Étape actuelle: ${currentStep}`}
            </div>
          </div>
        )}

        {diagnosticSteps.length > 0 && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="details">Détails techniques</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-2">
              {diagnosticSteps.map((step, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getStepIcon(step)}
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {step.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {step.duration && (
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {step.duration}ms
                      </span>
                    )}
                    <Badge variant={getStepBadgeVariant(step.status)}>
                      {step.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="details" className="space-y-3">
              {diagnosticSteps.filter(step => step.details || step.message).map((step, index) => (
                <div key={index} className={`p-3 border rounded ${
                  step.status === 'error' ? 'border-red-200 bg-red-50' : 
                  step.status === 'success' ? 'border-green-200 bg-green-50' : 
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getStepIcon(step)}
                    <span className="font-medium text-sm">{step.name}</span>
                  </div>
                  {step.message && (
                    <div className="text-sm mb-2">{step.message}</div>
                  )}
                  {step.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium">Détails techniques</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
