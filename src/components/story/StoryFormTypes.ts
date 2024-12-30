import type { Child } from "@/types/child";

export interface StoryFormData {
  childrenIds: string[];
  objective: string;
}

export interface StoryFormProps {
  onSubmit: (data: StoryFormData) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => void;
  onStoryCreated: (story: any) => void;
}