
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

// Types pour notre état et actions
export type StoryFormState = {
  selectedChildrenIds: string[];
  selectedObjective: string;
  isSubmitting: boolean;
  formError: string | null;
  showChildForm: boolean;
  debugInfo: Record<string, any>;
};

export type StoryFormAction =
  | { type: "SELECT_CHILD"; childId: string }
  | { type: "SELECT_OBJECTIVE"; objective: string }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "TOGGLE_CHILD_FORM"; show: boolean }
  | { type: "RESET_FORM" }
  | { type: "UPDATE_DEBUG_INFO"; info: Record<string, any> };

// Type pour le contexte
export interface StoryFormContextType {
  state: StoryFormState;
  handleChildSelect: (childId: string) => void;
  handleObjectiveSelect: (objective: string) => void;
  handleFormSubmit: (e: React.FormEvent) => Promise<string | undefined>;
  setShowChildForm: (show: boolean) => void;
  resetForm: () => void;
  isGenerateButtonDisabled: boolean;
  user: any;
  authLoading: boolean;
  updateDebugInfo: (info: Record<string, any>) => void;
}

// Props pour le provider
export interface StoryFormProviderProps {
  children: React.ReactNode;
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>;
  availableChildren: Child[];
  onStoryCreated: (story: Story) => void;
}
