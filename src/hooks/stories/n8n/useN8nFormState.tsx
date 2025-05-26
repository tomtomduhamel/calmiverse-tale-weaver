
import { useState, useEffect } from "react";
import type { Child } from "@/types/child";

interface UseN8nFormStateProps {
  children: Child[];
}

export const useN8nFormState = ({ children }: UseN8nFormStateProps) => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState("");

  // Debug logging when props change
  useEffect(() => {
    console.log('[N8nFormState] useEffect - Props children mises à jour:', {
      children: children,
      childrenCount: children?.length || 0,
      childrenArray: Array.isArray(children),
      childrenData: children?.map(c => ({ id: c.id, name: c.name, authorId: c.authorId })) || [],
      selectedChildrenIds,
      selectedObjective,
      timestamp: new Date().toISOString()
    });
  }, [children, selectedChildrenIds, selectedObjective]);

  const handleChildSelect = (childId: string) => {
    if (!childId) {
      console.error("[N8nFormState] Tentative de sélection avec ID vide");
      return;
    }
    
    console.log('[N8nFormState] Sélection enfant:', {
      childId,
      isAlreadySelected: selectedChildrenIds?.includes(childId),
      currentSelection: selectedChildrenIds,
      availableChildren: children?.map(c => c.id) || []
    });
    
    setSelectedChildrenIds(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const resetForm = () => {
    setSelectedChildrenIds([]);
    setSelectedObjective("");
  };

  const isFormValid = webhookUrl && selectedChildrenIds.length > 0 && selectedObjective;
  const hasChildren = children && Array.isArray(children) && children.length > 0;

  return {
    webhookUrl,
    setWebhookUrl,
    selectedChildrenIds,
    selectedObjective,
    setSelectedObjective,
    handleChildSelect,
    resetForm,
    isFormValid,
    hasChildren
  };
};
