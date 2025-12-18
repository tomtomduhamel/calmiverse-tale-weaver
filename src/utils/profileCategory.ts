import { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";
import { User, Heart, Cat, Dog, Sparkles, UserCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProfileCategory = 'child' | 'adult' | 'pet';

/**
 * Détermine la catégorie d'un profil basé sur le genre et l'âge
 * - 'pet' si gender === 'pet'
 * - 'adult' si âge >= 18
 * - 'child' sinon
 */
export const getProfileCategory = (child: Child): ProfileCategory => {
  if (child.gender === 'pet') return 'pet';
  const age = calculateAge(child.birthDate);
  return age >= 18 ? 'adult' : 'child';
};

export interface CategoryDisplay {
  icon: LucideIcon;
  label: string;
  color: string;
}

/**
 * Retourne l'icône, le label et la couleur appropriés selon la catégorie et le genre
 * - Enfants: icône garçon/fille selon le genre
 * - Adultes: icône générique (même pour homme/femme)
 * - Animaux: icône selon type d'animal
 */
export const getCategoryDisplay = (child: Child): CategoryDisplay => {
  const category = getProfileCategory(child);
  
  // Animaux
  if (category === 'pet') {
    if (child.petType === 'dog') {
      return { icon: Dog, label: 'Chien', color: 'text-orange-500' };
    } else if (child.petType === 'cat') {
      return { icon: Cat, label: 'Chat', color: 'text-orange-500' };
    } else if (child.petType === 'other' && child.petTypeCustom) {
      return { icon: Sparkles, label: child.petTypeCustom, color: 'text-orange-500' };
    }
    return { icon: Cat, label: 'Animal', color: 'text-orange-500' };
  }
  
  // Adultes - icône générique
  if (category === 'adult') {
    return { icon: UserCircle, label: 'Adulte', color: 'text-purple-500' };
  }
  
  // Enfants - selon le genre
  return child.gender === 'boy' 
    ? { icon: User, label: 'Garçon', color: 'text-blue-500' }
    : { icon: Heart, label: 'Fille', color: 'text-pink-500' };
};

/**
 * Compte les profils par catégorie
 */
export const countByCategory = (children: Child[]): { children: number; adults: number; pets: number } => {
  return children.reduce(
    (acc, child) => {
      const category = getProfileCategory(child);
      if (category === 'pet') acc.pets++;
      else if (category === 'adult') acc.adults++;
      else acc.children++;
      return acc;
    },
    { children: 0, adults: 0, pets: 0 }
  );
};
