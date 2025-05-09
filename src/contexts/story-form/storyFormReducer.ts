
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

// Reducer pour la gestion d'état
export function storyFormReducer(state: StoryFormState, action: StoryFormAction): StoryFormState {
  console.log("[StoryFormContext] Action:", action.type, action);

  switch (action.type) {
    case "SELECT_CHILD": {
      const childId = action.childId;
      const isSelected = state.selectedChildrenIds.includes(childId);
      
      const selectedChildrenIds = isSelected
        ? state.selectedChildrenIds.filter(id => id !== childId)
        : [...state.selectedChildrenIds, childId];
        
      console.log("[StoryFormContext] Child selection updated:", {
        childId,
        isSelected,
        newSelection: selectedChildrenIds
      });

      return { ...state, selectedChildrenIds };
    }
    
    case "SELECT_OBJECTIVE":
      return { ...state, selectedObjective: action.objective };
      
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting };
      
    case "SET_ERROR":
      return { ...state, formError: action.error };
      
    case "TOGGLE_CHILD_FORM":
      return { ...state, showChildForm: action.show };
      
    case "RESET_FORM":
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
