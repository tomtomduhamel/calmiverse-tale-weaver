import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import type { Child } from "@/types/child";

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
  children: Child[];
}

export interface StoryFormData {
  childrenIds: string[];
  objective: string;
}

const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, children }) => {
  const [formData, setFormData] = useState<StoryFormData>({
    childrenIds: [],
    objective: "sleep",
  });

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

  const selectClass = "w-full p-2 border rounded-md bg-background hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-center mb-6 text-primary">Créer une histoire</h2>
      
      <div className="space-y-4">
        <Label className="text-secondary">Pour qui est cette histoire ?</Label>
        {children.map((child) => (
          <div key={child.id} className="flex items-center space-x-2">
            <Checkbox
              id={`child-${child.id}`}
              checked={formData.childrenIds.includes(child.id)}
              onCheckedChange={() => handleChildToggle(child.id)}
            />
            <Label
              htmlFor={`child-${child.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {child.name} ({child.age} ans)
            </Label>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective" className="text-secondary">Je souhaite créer un moment de lecture qui va...</Label>
        <select
          id="objective"
          value={formData.objective}
          onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
          className={selectClass}
        >
          <option value="sleep">accompagner l'enfant dans le sommeil</option>
          <option value="relax">relaxer l'enfant</option>
          <option value="focus">créer un moment de concentration avec l'enfant</option>
        </select>
      </div>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
        Générer l'histoire
      </Button>
    </form>
  );
};

export default StoryForm;