
/**
 * Génère un token aléatoire sécurisé pour le partage d'histoires
 * @returns string Un token unique de 32 caractères
 */
export const generateToken = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let token = '';
  
  // Utilisation de crypto.getRandomValues pour une génération sécurisée
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  
  randomValues.forEach(value => {
    token += characters.charAt(value % characters.length);
  });
  
  return token;
};
