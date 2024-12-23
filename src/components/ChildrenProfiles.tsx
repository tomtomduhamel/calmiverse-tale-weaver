import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
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
  const [showForm, setShowForm] = useState(false);
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
    setShowForm(false);
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
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-secondary">L'univers des enfants</h2>
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-accent hover:bg-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un enfant
          </Button>
        )}
      </div>

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

      {showForm && (
        <Card className="p-6 bg-white/80 backdrop-blur-sm mt-6">
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
      )}
    </div>
  );
};

export default ChildrenProfiles;