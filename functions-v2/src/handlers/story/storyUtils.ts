
import * as admin from 'firebase-admin';

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Updates a story document with error status
 * @param storyId The ID of the story to update
 * @param error The error message or object
 */
export const updateStoryWithErrorStatus = async (storyId: string, error: any): Promise<void> => {
  try {
    await admin.firestore().collection('stories').doc(storyId).update({
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to generate story content',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Updated story ${storyId} with error status`);
  } catch (updateError: any) {
    console.error('Error updating story with error status:', updateError);
  }
};

/**
 * Creates a standardized error response
 * @param error The error object or message
 * @returns Formatted error message as a string
 */
export const createErrorResponse = (error: any): string => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'Une erreur inconnue est survenue';
  
  const errorCode = 'STORY_GENERATION_FAILED';
  
  // Log detailed error for debugging
  console.error(`${errorCode}: ${errorMessage}`, error);
  
  // Return a simplified error message
  return errorMessage;
};

/**
 * Extract objective and childrenNames from story data
 * @param storyData The story data object
 * @returns Object containing objective and childrenNames
 */
export const extractStoryParameters = (storyData: any): { objective: string, childrenNames: string[] } => {
  let objective: string = '';
  let childrenNames: string[] = [];
  
  if (typeof storyData.objective === 'string') {
    objective = storyData.objective.trim();
  } else if (storyData.objective && typeof storyData.objective === 'object' && 'value' in storyData.objective) {
    // Conversion explicite en chaîne et traitement de undefined/null
    objective = String(storyData.objective.value || '').trim();
  } else {
    throw new Error(`Format d'objectif invalide`);
  }
  
  if (Array.isArray(storyData.childrenNames)) {
    // Conversion explicite de chaque élément en chaîne avec typage explicite
    childrenNames = storyData.childrenNames.map((name: string | null | undefined) => String(name || '').trim());
  }
  
  if (!objective) {
    throw new Error("L'objectif est requis");
  }
  
  return { objective, childrenNames };
};

