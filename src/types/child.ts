
export type ChildGender = 'boy' | 'girl' | 'pet';

export interface Child {
  id: string;
  authorId: string;
  name: string;
  birthDate: Date;
  interests?: string[];
  gender: ChildGender; // Maintenant obligatoire avec des valeurs spécifiques
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
