
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Un hook robuste pour gérer la sélection d'enfants avec vérification d'état
 * et mécanismes de récupération en cas d'état incohérent
 */
export const useRobustChildSelection = (initialSelectedIds: string[] = []) => {
  // État principal de sélection
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>(initialSelectedIds);
  
  // Référence pour suivre l'état entre les rendus
  const selectedIdsRef = useRef<string[]>(initialSelectedIds);
  
  // Garder la référence à jour avec l'état
  useEffect(() => {
    selectedIdsRef.current = selectedChildrenIds;
    console.log("[useRobustChildSelection] État mis à jour:", selectedChildrenIds);
  }, [selectedChildrenIds]);
  
  // Fonction sécurisée pour gérer la sélection d'enfants
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) {
      console.error("[useRobustChildSelection] ID d'enfant invalide fourni");
      return;
    }
    
    console.log("[useRobustChildSelection] Sélection d'enfant:", childId);
    
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
      
      console.log("[useRobustChildSelection] Nouvelle sélection:", newSelection);
      
      // Mettre également à jour la référence
      selectedIdsRef.current = newSelection;
      
      return newSelection;
    });
  }, []);
  
  // Fonction pour garantir la cohérence de l'état
  const ensureSelection = useCallback((childId: string, shouldBeSelected: boolean) => {
    const isCurrentlySelected = selectedChildrenIds.includes(childId);
    
    if (shouldBeSelected && !isCurrentlySelected) {
      console.log("[useRobustChildSelection] Correction: ajout forcé de", childId);
      setSelectedChildrenIds(prev => [...prev, childId]);
      selectedIdsRef.current = [...selectedIdsRef.current, childId];
    } else if (!shouldBeSelected && isCurrentlySelected) {
      console.log("[useRobustChildSelection] Correction: suppression forcée de", childId);
      setSelectedChildrenIds(prev => prev.filter(id => id !== childId));
      selectedIdsRef.current = selectedIdsRef.current.filter(id => id !== childId);
    }
  }, [selectedChildrenIds]);
  
  // Fonction pour vérifier et récupérer l'état actuel, garantissant sa cohérence
  const getSelectedIds = useCallback(() => {
    // Vérifier si les deux sources d'état sont cohérentes
    const stateIds = selectedChildrenIds.sort().join(',');
    const refIds = selectedIdsRef.current.sort().join(',');
    
    if (stateIds !== refIds) {
      console.warn("[useRobustChildSelection] Incohérence détectée entre l'état et la référence!");
      console.log("État:", selectedChildrenIds);
      console.log("Référence:", selectedIdsRef.current);
      
      // Préférer la référence car elle est mise à jour plus de façon plus fiable
      setSelectedChildrenIds([...selectedIdsRef.current]);
      return selectedIdsRef.current;
    }
    
    return selectedChildrenIds;
  }, [selectedChildrenIds]);

  return {
    selectedChildrenIds,
    handleChildSelect,
    ensureSelection,
    getSelectedIds,
    // Expose également la référence pour usage direct
    selectedIdsRef
  };
};
