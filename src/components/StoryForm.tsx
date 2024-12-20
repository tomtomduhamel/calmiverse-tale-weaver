import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
}

export interface StoryFormData {
  childName: string;
  age: number;
  theme: string;
  objective: string;
}

const StoryForm: React.FC<StoryFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<StoryFormData>({
    childName: "",
    age: 5,
    theme: "animals",
    objective: "sleep",
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childName) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer le prénom de l'enfant",
        variant: "destructive",
      });
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="childName">Prénom de l'enfant</Label>
        <Input
          id="childName"
          value={formData.childName}
          onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
          className="w-full"
          placeholder="Entrez le prénom"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Âge</Label>
        <select
          id="age"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
          className="w-full p-2 border rounded-md bg-background"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((age) => (
            <option key={age} value={age}>
              {age} ans
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Thème</Label>
        <select
          id="theme"
          value={formData.theme}
          onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
          className="w-full p-2 border rounded-md bg-background"
        >
          <option value="animals">Animaux</option>
          <option value="magic">Magie</option>
          <option value="adventure">Aventure</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective">Objectif</Label>
        <select
          id="objective"
          value={formData.objective}
          onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
          className="w-full p-2 border rounded-md bg-background"
        >
          <option value="sleep">Endormissement</option>
          <option value="relax">Relaxation</option>
          <option value="focus">Concentration</option>
        </select>
      </div>

      <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
        Générer l'histoire
      </Button>
    </form>
  );
};

export default StoryForm;