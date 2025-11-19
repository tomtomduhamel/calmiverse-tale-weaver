
// Fichier principal d'export pour les utilitaires d'histoire
import { corsHeaders } from "./cors-config.ts";
import { initializeSupabase, initializeLovableAI, initializeOpenAI } from "./clients.ts";
import { validateInput } from "./validation.ts";
import { 
  fetchStoryDataFromDb,
  checkStoryExists,
  updateStoryInDb
} from "./database-operations.ts";
import { 
  generateStoryText,
  generateSummary,
  generateTitle
} from "./ai-operations.ts";

// Exporter toutes les fonctions et constantes
export {
  corsHeaders,
  initializeSupabase,
  initializeLovableAI,
  initializeOpenAI, // Keep for backward compatibility
  validateInput,
  fetchStoryDataFromDb,
  checkStoryExists,
  updateStoryInDb,
  generateStoryText,
  generateSummary,
  generateTitle
};
