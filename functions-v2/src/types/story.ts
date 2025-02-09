
export type Story = {
  id: string;
  content: string;
  summary: string;
  createdAt: string;
  title: string;
  preview: string;
  wordCount: number;
  status: 'unread' | 'read';
  objective: string;
  childrenNames: string[];
};
