
import { useCallback, useState, useRef, useEffect } from "react";

/**
 * Hook amélioré pour gérer la sélection des enfants avec débogage avancé
 * et protection contre les problèmes de synchronisation d'état
 */
export const useChildSelection = (
  childrenIds: string[],
  onChange: (newChildrenIds: string[]) => void,
  resetError?: () => void
) => {
  // Référence pour le suivi des changements
  const selectionCountRef = useRef(0);
  const prevSelectionRef = useRef<string[]>([]);
  
  // État local pour le suivi des problèmes potentiels
  const [lastOperations, setLastOperations] = useState<Array<{
    timestamp: string;
    operation: 'add' | 'remove';
    childId: string;
    success: boolean;
  }>>([]);
  
  // Suivre les changements dans les IDs d'enfants externes
  useEffect(() => {
    // Vérifier si la sélection externe a changé
    const isEqual = prevSelectionRef.current.length === childrenIds.length && 
      prevSelectionRef.current.every(id => childrenIds.includes(id));
    
    if (!isEqual) {
      console.log("[useChildSelection] Mise à jour externe détectée", {
        ancienneSelection: prevSelectionRef.current,
        nouvelleSelection: childrenIds,
        différent: !isEqual,
        timestamp: new Date().toISOString()
      });
      
      // Mettre à jour la référence
      prevSelectionRef.current = [...childrenIds];
    }
  }, [childrenIds]);
  
  // Gestionnaire optimisé pour la sélection d'un enfant
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) {
      console.warn("[useChildSelection] Appelé sans childId valide");
      return false;
    }
    
    // Incrémenter le compteur d'opérations
    selectionCountRef.current++;
    
    console.log("[useChildSelection] Sélection enfant #" + selectionCountRef.current, {
      childId, 
      selectionActuelle: childrenIds
    });
    
    // On crée un nouvel array à chaque fois pour éviter les problèmes de référence
    const currentIds = Array.isArray(childrenIds) ? [...childrenIds] : [];
    const isSelected = currentIds.includes(childId);
    
    const newIds = isSelected
      ? currentIds.filter(id => id !== childId)
      : [...currentIds, childId];
    
    console.log("[useChildSelection] Nouvelle sélection:", {
      avant: currentIds,
      après: newIds,
      opération: isSelected ? 'remove' : 'add',
      childId,
      timestamp: new Date().toISOString()
    });
    
    // Enregistrer l'opération
    const newOperation = {
      timestamp: new Date().toISOString(),
      operation: isSelected ? 'remove' as const : 'add' as const,
      childId,
      success: true
    };
    
    // Appeler le callback de changement
    try {
      onChange(newIds);
      
      // Mettre à jour l'historique des opérations
      setLastOperations(prev => [newOperation, ...prev.slice(0, 4)]);
      
      // Si une fonction resetError est fournie, on l'appelle après un court délai
      // pour éviter les boucles de mises à jour d'état
      if (resetError) {
        setTimeout(resetError, 0);
      }
      
      // Mettre à jour la référence avec délai pour vérifier la synchronisation
      setTimeout(() => {
        // Vérifier si la sélection a été correctement appliquée
        const expectedResult = isSelected
          ? !childrenIds.includes(childId)
          : childrenIds.includes(childId);
        
        console.log("[useChildSelection] Vérification de sélection:", {
          childId,
          opération: isSelected ? 'remove' : 'add',
          résultatAttendu: isSelected ? "retiré" : "ajouté",
          résultatActuel: childrenIds.includes(childId) ? "présent" : "absent",
          estCorrect: expectedResult,
          selectionActuelle: childrenIds
        });
        
        if (!expectedResult) {
          console.warn("[useChildSelection] Problème potentiel de synchronisation d'état détecté!");
        }
        
        // Mise à jour de la référence
        prevSelectionRef.current = [...childrenIds];
      }, 100);
      
      return true;
    } catch (error) {
      // En cas d'erreur, on met à jour l'historique avec le statut d'échec
      console.error("[useChildSelection] Erreur lors de la mise à jour:", error);
      newOperation.success = false;
      setLastOperations(prev => [newOperation, ...prev.slice(0, 4)]);
      return false;
    }
  }, [childrenIds, onChange, resetError]);

  return {
    handleChildSelect,
    operations: lastOperations,
    selectionCount: selectionCountRef.current
  };
};
