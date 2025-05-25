
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, ExternalLink, Loader2, AlertCircle, UserPlus } from "lucide-react";
import { useN8nStoryCreation } from "@/hooks/stories/useN8nStoryCreation";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import type { Child } from "@/types/child";

interface N8nStoryCreatorProps {
  children: Child[];
  onStoryCreated?: (storyId: string) => void;
}

const N8nStoryCreator: React.FC<N8nStoryCreatorProps> = ({
  children,
  onStoryCreated
}) => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState("");
  
  const { createStoryWithN8n, isGenerating } = useN8nStoryCreation();
  const { objectives } = useStoryObjectives();

  // Debug: Afficher les informations sur les enfants reçus
  console.log('[N8nStoryCreator] Props children reçues:', {
    childrenCount: children?.length || 0,
    children: children?.map(c => ({ id: c.id, name: c.name })) || [],
    childrenArray: children,
    selectedChildrenIds,
    selectedObjective
  });

  const defaultObjectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];

  const objectivesToUse = objectives || defaultObjectives;

  const handleChildSelect = (childId: string) => {
    console.log('[N8nStoryCreator] Sélection enfant:', childId);
    setSelectedChildrenIds(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!webhookUrl) {
      return;
    }

    if (selectedChildrenIds.length === 0) {
      return;
    }

    if (!selectedObjective) {
      return;
    }

    try {
      const result = await createStoryWithN8n({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective,
        webhookUrl
      }, children);

      if (result && onStoryCreated) {
        onStoryCreated(result.storyId || 'n8n-pending');
      }

      // Réinitialiser le formulaire
      setSelectedChildrenIds([]);
      setSelectedObjective("");
    } catch (error) {
      console.error('Erreur création histoire n8n:', error);
    }
  };

  const isFormValid = webhookUrl && selectedChildrenIds.length > 0 && selectedObjective;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Webhook className="h-5 w-5" />
          Création d'histoire via n8n
          <Badge variant="secondary" className="ml-2">EXPÉRIMENTAL</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Webhook n8n */}
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL Webhook n8n</Label>
            <Input
              id="webhookUrl"
              type="url"
              placeholder="https://votre-instance.n8n.cloud/webhook/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              L'URL du webhook de votre workflow n8n pour la génération d'histoires
            </p>
          </div>

          {/* Sélection des enfants */}
          <div className="space-y-2">
            <Label>Enfants sélectionnés</Label>
            {children && children.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {children.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => handleChildSelect(child.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedChildrenIds.includes(child.id)
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{child.name}</span>
                    {selectedChildrenIds.includes(child.id) && (
                      <span className="ml-2 text-xs text-blue-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Aucun profil d'enfant disponible. Créez d'abord un profil pour pouvoir générer une histoire.</span>
                  <Link to="/children">
                    <Button variant="outline" size="sm" className="ml-2">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Créer un profil
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sélection de l'objectif */}
          <div className="space-y-2">
            <Label>Objectif de l'histoire</Label>
            <div className="grid grid-cols-2 gap-2">
              {objectivesToUse.map((objective) => (
                <div
                  key={objective.id}
                  onClick={() => setSelectedObjective(objective.value)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedObjective === objective.value
                      ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">{objective.label}</span>
                  {selectedObjective === objective.value && (
                    <span className="ml-2 text-xs text-blue-600">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bouton de soumission */}
          <Button 
            type="submit" 
            disabled={!isFormValid || isGenerating || !children || children.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Déclenchement n8n...
              </>
            ) : (
              <>
                <Webhook className="h-4 w-4 mr-2" />
                Déclencher la génération n8n
              </>
            )}
          </Button>
        </form>

        {/* Informations sur les données envoyées */}
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>💡 Données envoyées à n8n :</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>userId, userEmail</li>
              <li>objective, childrenNames, childrenIds</li>
              <li>timestamp, requestId</li>
            </ul>
          </div>
        </div>

        {/* URL du webhook de retour */}
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300">
          <div className="text-sm text-green-800 dark:text-green-200">
            <strong>🔗 Webhook de retour pour n8n :</strong>
            <div className="mt-1 font-mono text-xs break-all">
              {`${window.location.origin}/supabase/functions/n8n-story-webhook`}
            </div>
            <p className="mt-1">
              Configurez n8n pour envoyer l'histoire complète à cette URL
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default N8nStoryCreator;
