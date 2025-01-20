export interface Child {
  id: string;
  authorId: string;
  name: string;
  birthDate: Date;
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