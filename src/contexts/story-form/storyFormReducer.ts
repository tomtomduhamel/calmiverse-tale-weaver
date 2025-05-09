
import { StoryFormState, StoryFormAction } from "./types";

// État initial
export const initialState: StoryFormState = {
  selectedChildrenIds: [],
  selectedObjective: "",
  isSubmitting: false,
  formError: null,
  showChildForm: false,
  debugInfo: {},
};

// Reducer pour la gestion d'état avec logs améliorés
export function storyFormReducer(state: StoryFormState, action: StoryFormAction): StoryFormState {
  console.log("[StoryFormReducer] Action reçue:", action.type, action);

  switch (action.type) {
    case "SELECT_CHILD": {
      const childId = action.childId;
      const isSelected = state.selectedChildrenIds.includes(childId);
      
      // Créer un nouveau tableau pour éviter les problèmes de référence
      const selectedChildrenIds = isSelected
        ? state.selectedChildrenIds.filter(id => id !== childId)
        : [...state.selectedChildrenIds, childId];
        
      console.log("[StoryFormReducer] Sélection d'enfant mise à jour:", {
        childId,
        isAlreadySelected: isSelected,
        ancienneSélection: state.selectedChildrenIds,
        nouvelleSélection: selectedChildrenIds,
        timestamp: new Date().toISOString()
      });
      
      // Si nous avons sélectionné au moins un enfant et qu'il y avait une erreur liée aux enfants,
      // effacer automatiquement l'erreur
      let updatedError = state.formError;
      if (selectedChildrenIds.length > 0 && 
          state.formError && 
          state.formError.toLowerCase().includes('enfant')) {
        console.log("[StoryFormReducer] Effacement automatique de l'erreur suite à la sélection d'un enfant");
        updatedError = null;
      }

      return { 
        ...state, 
        selectedChildrenIds,
        formError: updatedError
      };
    }
    
    case "SELECT_OBJECTIVE": {
      console.log("[StoryFormReducer] Sélection d'objectif:", {
        ancieneObjectif: state.selectedObjective,
        nouvelObjectif: action.objective
      });
      
      // Effacer automatiquement l'erreur liée aux objectifs si présente
      let updatedError = state.formError;
      if (action.objective && 
          state.formError && 
          state.formError.toLowerCase().includes('objectif')) {
        console.log("[StoryFormReducer] Effacement automatique de l'erreur suite à la sélection d'un objectif");
        updatedError = null;
      }
      
      return { 
        ...state, 
        selectedObjective: action.objective,
        formError: updatedError
      };
    }
      
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting };
      
    case "SET_ERROR":
      console.log("[StoryFormReducer] Définition de l'erreur:", {
        ancienneErreur: state.formError,
        nouvelleErreur: action.error,
        timestamp: new Date().toISOString()
      });
      return { ...state, formError: action.error };
      
    case "TOGGLE_CHILD_FORM":
      return { ...state, showChildForm: action.show };
      
    case "RESET_FORM":
      console.log("[StoryFormReducer] Réinitialisation du formulaire");
      return { ...initialState };
      
    case "UPDATE_DEBUG_INFO":
      return { 
        ...state, 
        debugInfo: { ...state.debugInfo, ...action.info } 
      };
      
    default:
      return state;
  }
}
