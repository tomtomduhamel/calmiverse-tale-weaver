
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

export interface StoryFormData {
  childrenIds: string[];
  objective: string;
}

export interface StoryFormProps {
  onSubmit: (data: StoryFormData) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}
