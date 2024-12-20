import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";

interface ChildrenProfilesProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => void;
  onDeleteChild: (childId: string) => void;
}

const ChildrenProfiles: React.FC<ChildrenProfilesProps> = ({
  children,
  onAddChild,
  onDeleteChild,
}) => {
  const [newChildName, setNewChildName] = useState("");
  const [newChildAge, setNewChildAge] = useState<number>(5);
  const { toast } = useToast();

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'enfant est requis",
        variant: "destructive",
      });
      return;
    }
    onAddChild({
      name: newChildName,
      age: newChildAge,
    });
    setNewChildName("");
    setNewChildAge(5);
    toast({
      title: "Succès",
      description: "Le profil a été ajouté avec succès",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center mb-6">Profils des enfants</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <Card key={child.id} className="p-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              onClick={() => onDeleteChild(child.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="pt-4">
              <h3 className="text-lg font-semibold">{child.name}</h3>
              <p className="text-sm text-muted-foreground">{child.age} ans</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <form onSubmit={handleAddChild} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="childName">Nom de l'enfant</Label>
            <Input
              id="childName"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="Entrez le nom"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="childAge">Âge</Label>
            <select
              id="childAge"
              value={newChildAge}
              onChange={(e) => setNewChildAge(Number(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((age) => (
                <option key={age} value={age}>
                  {age} ans
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un profil
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ChildrenProfiles;