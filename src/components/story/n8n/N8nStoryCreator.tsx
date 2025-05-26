
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, Loader2 } from "lucide-react";
import { useN8nStoryCreation } from "@/hooks/stories/useN8nStoryCreation";
import { useN8nFormState } from "@/hooks/stories/n8n/useN8nFormState";
import N8nWebhookUrlInput from "./N8nWebhookUrlInput";
import N8nChildrenSelector from "./N8nChildrenSelector";
import N8nObjectiveSelector from "./N8nObjectiveSelector";
import N8nInfoPanels from "./N8nInfoPanels";
import N8nDebugPanel from "./N8nDebugPanel";
import type { Child } from "@/types/child";

interface N8nStoryCreatorProps {
  children: Child[];
  onStoryCreated?: (storyId: string) => void;
}

const N8nStoryCreator: React.FC<N8nStoryCreatorProps> = ({
  children,
  onStoryCreated
}) => {
  const { createStoryWithN8n, isGenerating } = useN8nStoryCreation();
  
  const {
    webhookUrl,
    setWebhookUrl,
    selectedChildrenIds,
    selectedObjective,
    setSelectedObjective,
    handleChildSelect,
    resetForm,
    isFormValid,
    hasChildren
  } = useN8nFormState({ children });

  // Debug initial au rendu
  console.log('[N8nStoryCreator] Rendu avec props:', {
    childrenReceived: !!children,
    childrenType: typeof children,
    childrenIsArray: Array.isArray(children),
    childrenCount: children?.length || 0,
    childrenData: children?.map(c => ({ id: c.id, name: c.name })) || [],
    onStoryCreatedDefined: !!onStoryCreated,
    timestamp: new Date().toISOString()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!webhookUrl) {
      console.error("[N8nStoryCreator] URL webhook manquante");
      return;
    }

    if (selectedChildrenIds.length === 0) {
      console.error("[N8nStoryCreator] Aucun enfant sélectionné");
      return;
    }

    if (!selectedObjective) {
      console.error("[N8nStoryCreator] Aucun objectif sélectionné");
      return;
    }

    try {
      console.log("[N8nStoryCreator] Soumission avec:", {
        selectedChildrenIds,
        selectedObjective,
        childrenData: children?.filter(c => selectedChildrenIds.includes(c.id)) || []
      });

      const result = await createStoryWithN8n({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective,
        webhookUrl
      }, children);

      if (result && onStoryCreated) {
        onStoryCreated(result.storyId || 'n8n-pending');
      }

      resetForm();
    } catch (error) {
      console.error('Erreur création histoire n8n:', error);
    }
  };

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
          <N8nWebhookUrlInput
            webhookUrl={webhookUrl}
            onWebhookUrlChange={setWebhookUrl}
          />

          <N8nChildrenSelector
            children={children}
            selectedChildrenIds={selectedChildrenIds}
            onChildSelect={handleChildSelect}
            hasChildren={hasChildren}
          />

          <N8nObjectiveSelector
            selectedObjective={selectedObjective}
            onObjectiveSelect={setSelectedObjective}
          />

          <Button 
            type="submit" 
            disabled={!isFormValid || isGenerating || !hasChildren}
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

        <N8nInfoPanels />
        
        <N8nDebugPanel
          children={children}
          selectedChildrenIds={selectedChildrenIds}
          hasChildren={hasChildren}
          isFormValid={isFormValid}
        />
      </CardContent>
    </Card>
  );
};

export default N8nStoryCreator;
