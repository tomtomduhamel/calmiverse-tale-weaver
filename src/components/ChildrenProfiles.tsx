import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import type { Child } from "@/types/child";

interface ChildrenProfilesProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => void;
  onUpdateChild: (childId: string, updatedChild: Omit<Child, "id">) => void;
  onDeleteChild: (childId: string) => void;
}

const ChildrenProfiles: React.FC<ChildrenProfilesProps> = ({
  children,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
}) => {
  const [newChildName, setNewChildName] = useState("");
  const [newChildAge, setNewChildAge] = useState<number>(5);
  const [newTeddyName, setNewTeddyName] = useState("");
  const [newTeddyDescription, setNewTeddyDescription] = useState("");
  const [newImaginaryWorld, setNewImaginaryWorld] = useState("");
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setNewChildName("");
    setNewChildAge(5);
    setNewTeddyName("");
    setNewTeddyDescription("");
    setNewImaginaryWorld("");
    setEditingChild(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'enfant est requis",
        variant: "destructive",
      });
      return;
    }

    const childData = {
      name: newChildName,
      age: newChildAge,
      teddyName: newTeddyName,
      teddyDescription: newTeddyDescription,
      imaginaryWorld: newImaginaryWorld,
    };

    if (editingChild) {
      onUpdateChild(editingChild, childData);
      toast({
        title: "Succès",
        description: "Le profil a été mis à jour avec succès",
      });
    } else {
      onAddChild(childData);
      toast({
        title: "Succès",
        description: "Le profil a été ajouté avec succès",
      });
    }
    resetForm();
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child.id);
    setNewChildName(child.name);
    setNewChildAge(child.age);
    setNewTeddyName(child.teddyName || "");
    setNewTeddyDescription(child.teddyDescription || "");
    setNewImaginaryWorld(child.imaginaryWorld || "");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center mb-6">Enfants</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <Card key={child.id} className="p-4 relative">
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                onClick={() => handleEdit(child)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onDeleteChild(child.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="pt-8">
              <h3 className="text-lg font-semibold">{child.name}</h3>
              <p className="text-sm text-muted-foreground">{child.age} ans</p>
              {child.teddyName && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Doudou : {child.teddyName}</p>
                  {child.teddyDescription && (
                    <p className="text-sm text-muted-foreground">{child.teddyDescription}</p>
                  )}
                </div>
              )}
              {child.imaginaryWorld && (
                <div className="mt-2">
                  <p className="text-sm">Monde imaginaire : {child.imaginaryWorld}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="teddyName">Nom du doudou</Label>
            <Input
              id="teddyName"
              value={newTeddyName}
              onChange={(e) => setNewTeddyName(e.target.value)}
              placeholder="Entrez le nom du doudou"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teddyDescription">Description du doudou</Label>
            <Textarea
              id="teddyDescription"
              value={newTeddyDescription}
              onChange={(e) => setNewTeddyDescription(e.target.value)}
              placeholder="Décrivez le doudou"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imaginaryWorld">Son monde imaginaire</Label>
            <Textarea
              id="imaginaryWorld"
              value={newImaginaryWorld}
              onChange={(e) => setNewImaginaryWorld(e.target.value)}
              placeholder="Décrivez son monde imaginaire"
            />
          </div>

          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {editingChild ? "Mettre à jour" : "Ajouter un profil"}
          </Button>

          {editingChild && (
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={resetForm}
            >
              Annuler
            </Button>
          )}
        </form>
      </Card>
    </div>
  );
};

export default ChildrenProfiles;