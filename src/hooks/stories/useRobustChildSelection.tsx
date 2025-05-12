
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Un hook robuste pour gérer la sélection d'enfants avec vérification d'état
 * et mécanismes de récupération en cas d'état incohérent
 */
export const useRobustChildSelection = (initialSelectedIds: string[] = []) => {
  // État principal de sélection
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>(initialSelectedIds);
  
  // Référence pour suivre l'état entre les rendus
  const selectedIdsRef = useRef<string[]>(initialSelectedIds);
  
  // Compteur de rendus pour le débogage
  const renderCountRef = useRef(0);
  
  // État pour détecter les incohérences
  const [hasInconsistency, setHasInconsistency] = useState(false);
  
  // Toast pour notifications
  const { toast } = useToast();
  
  // Garder la référence à jour avec l'état
  useEffect(() => {
    renderCountRef.current += 1;
    selectedIdsRef.current = [...selectedChildrenIds]; // Copie pour éviter des références partagées
    
    console.log(`[useRobustChildSelection] Rendu #${renderCountRef.current} - État mis à jour:`, {
      selectedChildrenIds,
      selectedIdsRef: selectedIdsRef.current,
      timestamp: new Date().toISOString()
    });
  }, [selectedChildrenIds]);
  
  // Fonction sécurisée pour gérer la sélection d'enfants avec double traçage
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) {
      console.error("[useRobustChildSelection] ID d'enfant invalide fourni");
      return;
    }
    
    console.log("[useRobustChildSelection] Demande de sélection pour:", childId, {
      etatActuel: selectedIdsRef.current,
      estDejaSelectionne: selectedIdsRef.current.includes(childId)
    });
    
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
      
      console.log("[useRobustChildSelection] Mise à jour selection:", {
        avant: prev,
        apres: newSelection,
        action: isSelected ? "suppression" : "ajout",
        childId
      });
      
      // Mettre également à jour la référence immédiatement
      selectedIdsRef.current = [...newSelection];
      
      return newSelection;
    });
    
    // Vérification asynchrone pour confirmer la mise à jour
    setTimeout(() => {
      const isInState = selectedChildrenIds.includes(childId);
      const isInRef = selectedIdsRef.current.includes(childId);
      
      console.log("[useRobustChildSelection] Vérification post-sélection:", {
        childId,
        presentDansState: isInState,
        presentDansRef: isInRef,
        etatComplet: selectedChildrenIds,
        refComplete: selectedIdsRef.current
      });
      
      // Détection d'incohérence
      if (isInState !== isInRef) {
        console.warn("[useRobustChildSelection] Incohérence détectée entre state et ref!");
        setHasInconsistency(true);
      }
    }, 100);
  }, [selectedChildrenIds]);
  
  // Fonction pour garantir la cohérence de l'état
  const ensureSelection = useCallback((childId: string, shouldBeSelected: boolean) => {
    console.log("[useRobustChildSelection] Vérification forcée pour:", childId, {
      doitEtreSelectionne: shouldBeSelected,
      estActuellementSelectionne: selectedChildrenIds.includes(childId),
      etatComplet: selectedChildrenIds
    });
    
    const isCurrentlySelected = selectedChildrenIds.includes(childId);
    
    if (shouldBeSelected && !isCurrentlySelected) {
      console.log("[useRobustChildSelection] Correction: ajout forcé de", childId);
      setSelectedChildrenIds(prev => {
        const newSelection = [...prev, childId];
        selectedIdsRef.current = [...newSelection];
        return newSelection;
      });
      
      // Notification pour la transparence
      toast({
        title: "Correction automatique",
        description: "Une incohérence dans la sélection a été corrigée.",
        variant: "default",
      });
    } else if (!shouldBeSelected && isCurrentlySelected) {
      console.log("[useRobustChildSelection] Correction: suppression forcée de", childId);
      setSelectedChildrenIds(prev => {
        const newSelection = prev.filter(id => id !== childId);
        selectedIdsRef.current = [...newSelection];
        return newSelection;
      });
    }
  }, [selectedChildrenIds, toast]);
  
  // Fonction pour forcer une sélection initiale à partir des DOM elements
  const forceInitialSelection = useCallback(() => {
    // Recherche dans le DOM les éléments qui semblent être sélectionnés
    const selectedDomElements = document.querySelectorAll('[data-selected="true"]');
    const selectedIdsFromDom: string[] = [];
    
    selectedDomElements.forEach(el => {
      const childId = el.getAttribute('data-child-id');
      if (childId) selectedIdsFromDom.push(childId);
    });
    
    console.log("[useRobustChildSelection] Force initialisation from DOM:", {
      selectedElementsFound: selectedDomElements.length,
      idsFound: selectedIdsFromDom,
      currentSelection: selectedChildrenIds
    });
    
    // Si des éléments sélectionnés sont trouvés dans le DOM mais pas dans l'état
    if (selectedIdsFromDom.length > 0 && selectedChildrenIds.length === 0) {
      console.log("[useRobustChildSelection] Initialisation forcée avec:", selectedIdsFromDom);
      setSelectedChildrenIds(selectedIdsFromDom);
      selectedIdsRef.current = [...selectedIdsFromDom];
      
      toast({
        title: "Sélection récupérée",
        description: "Nous avons détecté et restauré votre sélection précédente.",
        variant: "default",
      });
    }
  }, [selectedChildrenIds, toast]);
  
  // Fonction pour vérifier et récupérer l'état actuel, garantissant sa cohérence
  const getSelectedIds = useCallback(() => {
    // Combiner les deux sources pour une sélection maximale
    const allPossibleIds = new Set([...selectedChildrenIds, ...selectedIdsRef.current]);
    
    // Vérifier l'état DOM comme source de vérité supplémentaire
    const selectedDomElements = document.querySelectorAll('[data-selected="true"]');
    selectedDomElements.forEach(el => {
      const childId = el.getAttribute('data-child-id');
      if (childId) allPossibleIds.add(childId);
    });
    
    console.log("[useRobustChildSelection] getSelectedIds - sources combinées:", {
      fromState: selectedChildrenIds,
      fromRef: selectedIdsRef.current,
      fromDOM: Array.from(selectedDomElements).map(el => el.getAttribute('data-child-id')),
      combined: Array.from(allPossibleIds)
    });
    
    // Vérifier si les deux sources d'état sont cohérentes
    const stateIds = selectedChildrenIds.sort().join(',');
    const refIds = selectedIdsRef.current.sort().join(',');
    
    if (stateIds !== refIds) {
      console.warn("[useRobustChildSelection] Incohérence détectée entre l'état et la référence!");
      console.log("État:", selectedChildrenIds);
      console.log("Référence:", selectedIdsRef.current);
      
      // Union des deux sources pour maximiser la fiabilité
      const combinedIds = Array.from(allPossibleIds);
      
      // Mise à jour pour aligner les sources
      setSelectedChildrenIds([...combinedIds]);
      selectedIdsRef.current = [...combinedIds];
      
      return combinedIds;
    }
    
    return selectedChildrenIds;
  }, [selectedChildrenIds]);
  
  // Effet pour détecter les états dans le DOM et les synchroniser si nécessaire
  useEffect(() => {
    const syncTimerId = setTimeout(() => {
      // Analyse du DOM pour trouver les éléments sélectionnés visuellement
      const selectedDomElements = document.querySelectorAll('[data-selected="true"]');
      if (selectedDomElements.length > 0) {
        console.log("[useRobustChildSelection] Éléments visuellement sélectionnés trouvés:", 
          Array.from(selectedDomElements).map(el => ({
            childId: el.getAttribute('data-child-id'),
            isInState: el.getAttribute('data-child-id') ? 
              selectedChildrenIds.includes(el.getAttribute('data-child-id')!) : false
          }))
        );
        
        // Récupération d'état si nécessaire
        if (selectedChildrenIds.length === 0 && selectedDomElements.length > 0) {
          forceInitialSelection();
        }
      }
    }, 500);
    
    return () => clearTimeout(syncTimerId);
  }, [selectedChildrenIds, forceInitialSelection]);

  return {
    selectedChildrenIds,
    handleChildSelect,
    ensureSelection,
    getSelectedIds,
    forceInitialSelection,
    // Expose également la référence pour usage direct
    selectedIdsRef,
    hasInconsistency
  };
};
