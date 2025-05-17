
// Fonctions utilitaires générales qui pourraient être ajoutées à l'avenir

/**
 * Génère une chaîne aléatoire qui peut être utilisée comme identifiant
 * @param length Longueur de la chaîne à générer
 * @returns Chaîne aléatoire
 */
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Formatte une date en format lisible
 * @param date Date à formatter
 * @returns Date formattée
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
