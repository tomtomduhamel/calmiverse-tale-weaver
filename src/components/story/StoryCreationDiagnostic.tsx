
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoryTestResult {
  step: string;
  success: boolean;
  duration?: number;
  details?: any;
  error?: string;
}

export const StoryCreationDiagnostic: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<StoryTestResult[]>([]);
  const { toast } = useToast();

  const runStoryCreationTest = async () => {
    setIsRunning(true);
    setResults([]);
    const testResults: StoryTestResult[] = [];

    console.log('📖 [STORY-DIAGNOSTIC] Début du test de création d\'histoire');

    // Étape 1: Vérifier la disponibilité des enfants
    try {
      console.log('📖 [STORY-DIAGNOSTIC] Étape 1 - Récupération des enfants');
      const startTime = Date.now();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }

      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('authorid', user.id)
        .limit(1);

      const duration = Date.now() - startTime;

      if (childrenError) {
        throw childrenError;
      }

      testResults.push({
        step: "Récupération des enfants",
        success: !childrenError && children && children.length > 0,
        duration,
        details: { 
          childrenCount: children?.length || 0,
          firstChild: children?.[0] ? { id: children[0].id, name: children[0].name } : null
        },
        error: !children || children.length === 0 ? "Aucun enfant trouvé" : undefined
      });

      if (!children || children.length === 0) {
        // Créer un enfant de test
        console.log('📖 [STORY-DIAGNOSTIC] Création d\'un enfant de test');
        const { data: newChild, error: createError } = await supabase
          .from('children')
          .insert({
            name: 'Enfant Test Diagnostic',
            birthdate: '2020-01-01',
            authorid: user.id,
            interests: [],
            gender: 'unknown'
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        testResults.push({
          step: "Création enfant de test",
          success: !createError,
          details: { childId: newChild?.id, childName: newChild?.name },
          error: createError?.message
        });
      }

    } catch (error: any) {
      testResults.push({
        step: "Récupération des enfants",
        success: false,
        error: error.message
      });
    }

    // Étape 2: Créer une entrée d'histoire en base
    let storyId: string | null = null;
    try {
      console.log('📖 [STORY-DIAGNOSTIC] Étape 2 - Création d\'histoire en base');
      const startTime = Date.now();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: `Test Diagnostic ${new Date().toISOString()}`,
          content: '',
          summary: '',
          preview: 'Test diagnostic de génération...',
          status: 'pending',
          childrenids: ['diagnostic-child'],
          childrennames: ['Enfant Diagnostic'],
          objective: 'diagnostic',
          authorid: user!.id
        })
        .select()
        .single();

      const duration = Date.now() - startTime;
      storyId = story?.id || null;

      testResults.push({
        step: "Création histoire en base",
        success: !storyError,
        duration,
        details: { storyId: story?.id, status: story?.status },
        error: storyError?.message
      });

    } catch (error: any) {
      testResults.push({
        step: "Création histoire en base",
        success: false,
        error: error.message
      });
    }

    // Étape 3: Appel à generateStory
    if (storyId) {
      try {
        console.log('📖 [STORY-DIAGNOSTIC] Étape 3 - Appel generateStory');
        const startTime = Date.now();
        
        const { data, error } = await supabase.functions.invoke('generateStory', {
          body: {
            storyId: storyId,
            objective: 'diagnostic',
            childrenNames: ['Enfant Diagnostic']
          }
        });

        const duration = Date.now() - startTime;

        testResults.push({
          step: "Appel generateStory",
          success: !error,
          duration,
          details: { data, error: error?.message },
          error: error?.message
        });

        // Étape 4: Vérifier l'état de l'histoire après l'appel
        if (!error) {
          console.log('📖 [STORY-DIAGNOSTIC] Étape 4 - Vérification état histoire');
          const checkStartTime = Date.now();
          
          // Attendre un peu puis vérifier
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: updatedStory, error: checkError } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();

          const checkDuration = Date.now() - checkStartTime;

          testResults.push({
            step: "Vérification état histoire",
            success: !checkError,
            duration: checkDuration,
            details: { 
              status: updatedStory?.status,
              hasContent: !!updatedStory?.content,
              contentLength: updatedStory?.content?.length || 0,
              error: updatedStory?.error
            },
            error: checkError?.message || updatedStory?.error
          });
        }

      } catch (error: any) {
        testResults.push({
          step: "Appel generateStory",
          success: false,
          error: error.message
        });
      }
    }

    setResults(testResults);
    setIsRunning(false);

    const failedSteps = testResults.filter(r => !r.success);
    const successfulSteps = testResults.filter(r => r.success);

    console.log('📊 [STORY-DIAGNOSTIC] Résultats complets:', {
      total: testResults.length,
      success: successfulSteps.length,
      failed: failedSteps.length,
      results: testResults
    });

    if (failedSteps.length === 0) {
      toast({
        title: "✅ Processus de création fonctionnel",
        description: "Toutes les étapes se sont déroulées correctement",
      });
    } else {
      toast({
        title: "⚠️ Étapes défaillantes détectées",
        description: `${failedSteps.length} étape(s) ont échoué`,
        variant: "destructive"
      });
    }
  };

  const getStepIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <BookOpen className="h-5 w-5" />
          📖 Test Processus de Création d'Histoire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded border border-orange-300">
          <div className="text-sm text-orange-800 dark:text-orange-200">
            <strong>Objectif:</strong> Tester le processus complet de création d'histoire étape par étape
          </div>
        </div>

        <Button 
          onClick={runStoryCreationTest}
          disabled={isRunning}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? "Test en cours..." : "Tester la création d'histoire"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-orange-800 dark:text-orange-200">Résultats du processus:</h3>
            
            {results.map((result, index) => (
              <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStepIcon(result.success)}
                    <span className="font-medium">Étape {index + 1}: {result.step}</span>
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
                      Détails de l'étape
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Analyse:</strong> Identifiez l'étape où le processus échoue pour cibler la correction.
                {results.filter(r => !r.success).length === 0 && (
                  <span className="text-green-700 dark:text-green-300"> ✅ Tout fonctionne correctement!</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoryCreationDiagnostic;
