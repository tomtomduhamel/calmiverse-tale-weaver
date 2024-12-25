import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, UserPlus } from "lucide-react";
import type { Child } from "@/types/child";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
  children: Child[];
  onCreateChild: () => void;
}

export interface StoryFormData {
  childrenIds: string[];
  objective: string;
}

const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, children, onCreateChild }) => {
  const [formData, setFormData] = useState<StoryFormData>({
    childrenIds: [],
    objective: "",
  });

  const { objectives, isLoading } = useStoryObjectives();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.childrenIds.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un enfant",
        variant: "destructive",
      });
      return;
    }
    if (!formData.objective) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un objectif",
        variant: "destructive",
      });
      return;
    }
    onSubmit(formData);
  };

  const handleChildToggle = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      childrenIds: prev.childrenIds.includes(childId)
        ? prev.childrenIds.filter(id => id !== childId)
        : [...prev.childrenIds, childId]
    }));
  };

  if (isLoading) {
    return <div>Chargement des objectifs...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl">
      <h2 className="text-2xl font-semibold text-center mb-6 text-primary dark:text-primary-dark">
        Créer une histoire
      </h2>
      
      <div className="space-y-4">
        <Label className="text-secondary dark:text-white">Pour qui est cette histoire ?</Label>
        {children.length > 0 ? (
          children.map((child) => (
            <div key={child.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-muted-dark/50 transition-colors">
              <Checkbox
                id={`child-${child.id}`}
                checked={formData.childrenIds.includes(child.id)}
                onCheckedChange={() => handleChildToggle(child.id)}
              />
              <Label
                htmlFor={`child-${child.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {child.name} ({child.age} ans)
              </Label>
            </div>
          ))
        ) : (
          <Button
            type="button"
            onClick={onCreateChild}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-6 border-dashed border-2 hover:border-primary dark:hover:border-primary-dark transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Créer un profil enfant
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective" className="text-secondary dark:text-white">
          Je souhaite créer un moment de lecture qui va...
        </Label>
        <select
          id="objective"
          value={formData.objective}
          onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
          className="w-full p-2 rounded-lg border bg-white dark:bg-muted-dark hover:border-primary dark:hover:border-primary-dark focus:border-primary dark:focus:border-primary-dark focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-dark/20 transition-colors"
        >
          <option value="">Sélectionnez un objectif</option>
          {objectives.map((objective) => (
            <option key={objective.id} value={objective.value}>
              {objective.name}
            </option>
          ))}
        </select>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-primary-foreground flex items-center justify-center gap-2 py-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all hover:scale-[1.02]"
      >
        <BookOpen className="w-5 h-5" />
        Générer l'histoire
      </Button>
    </form>
  );
};

export default StoryForm;