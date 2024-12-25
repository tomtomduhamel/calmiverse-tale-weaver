export interface Story {
  id: string;
  content: string;
  childrenIds: string[];
  objective: string;
  createdAt: Date;
}