
export type ChildGender = 'boy' | 'girl' | 'pet';
export type PetType = 'dog' | 'cat' | 'other';

export interface Child {
  id: string;
  authorId: string;
  name: string;
  birthDate: Date;
  interests?: string[];
  gender: ChildGender; // Maintenant obligatoire avec des valeurs spécifiques
  petType?: PetType; // Type d'animal (chien, chat, autre)
  petTypeCustom?: string; // Nom personnalisé quand petType === 'other'
  teddyName?: string;
  teddyDescription?: string;
  teddyPhotos?: {
    url: string;
    path: string;
    uploadedAt: Date;
  }[];
  imaginaryWorld?: string;
  createdAt?: Date;
}
