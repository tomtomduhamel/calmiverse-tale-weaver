import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ChildForm from "./children/ChildForm";
import ChildCard from "./children/ChildCard";
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
      <h2 className="text-2xl font-semibold text-center mb-6 text-secondary">
        Enfants
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <ChildCard
            key={child.id}
            child={child}
            onEdit={handleEdit}
            onDelete={onDeleteChild}
          />
        ))}
      </div>

      <Card className="p-6 bg-white/80 backdrop-blur-sm">
        <ChildForm
          childName={newChildName}
          childAge={newChildAge}
          teddyName={newTeddyName}
          teddyDescription={newTeddyDescription}
          imaginaryWorld={newImaginaryWorld}
          isEditing={!!editingChild}
          onSubmit={handleSubmit}
          onReset={resetForm}
          onChildNameChange={setNewChildName}
          onChildAgeChange={setNewChildAge}
          onTeddyNameChange={setNewTeddyName}
          onTeddyDescriptionChange={setNewTeddyDescription}
          onImaginaryWorldChange={setNewImaginaryWorld}
        />
      </Card>
    </div>
  );
};

export default ChildrenProfiles;