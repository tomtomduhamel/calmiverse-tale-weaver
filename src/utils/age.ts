
/**
 * Calcule l'âge en années à partir d'une date de naissance
 * @param birthDate Date de naissance (string ou Date)
 * @returns Âge en années
 */
export function calculateAge(birthDate: string | Date): number {
  const birth = new Date(birthDate);
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // Si l'anniversaire n'est pas encore passé cette année
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Formate l'âge pour l'affichage en fonction de l'âge en années
 * @param age Âge en années
 * @returns Âge formaté pour l'affichage (ex: "3 ans" ou "18 mois" pour les jeunes enfants)
 */
export function formatAge(age: number): string {
  if (age < 0) return "Âge invalide";
  
  // Pour les bébés et très jeunes enfants, afficher en mois jusqu'à 3 ans
  if (age < 3) {
    const months = Math.round(age * 12);
    return `${months} ${months <= 1 ? 'mois' : 'mois'}`;
  }
  
  // Pour les enfants plus âgés, afficher en années
  return `${age} ${age <= 1 ? 'an' : 'ans'}`;
}
