
// Fichier principal d'export pour les utilitaires d'histoire
import { corsHeaders } from "./cors-config.ts";
import { initializeSupabase, initializeOpenAI } from "./clients.ts";
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
} from "./openai-operations.ts";

// Exporter toutes les fonctions et constantes
export {
  corsHeaders,
  initializeSupabase,
  initializeOpenAI,
  validateInput,
  fetchStoryDataFromDb,
  checkStoryExists,
  updateStoryInDb,
  generateStoryText,
  generateSummary,
  generateTitle
};
