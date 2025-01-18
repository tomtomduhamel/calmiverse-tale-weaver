import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";
import { auth } from "@/lib/firebase";
import ProfileHeader from "./children/ProfileHeader";
import ProfileGrid from "./children/ProfileGrid";
import ProfileFormWrapper from "./children/ProfileFormWrapper";

interface ChildrenProfilesProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => void;
  onUpdateChild: (childId: string, updatedChild: Omit<Child, "id">) => void;
  onDeleteChild: (childId: string) => void;
  onCreateStory?: () => void;
}

const ChildrenProfiles: React.FC<ChildrenProfilesProps> = ({
  children,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  onCreateStory,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState<Date>(new Date());
  const [newTeddyName, setNewTeddyName] = useState("");
  const [newTeddyDescription, setNewTeddyDescription] = useState("");
  const [newImaginaryWorld, setNewImaginaryWorld] = useState("");
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setNewChildName("");
    setNewBirthDate(new Date());
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

    if (!auth.currentUser) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action",
        variant: "destructive",
      });
      return;
    }

    const childData = {
      name: newChildName,
      birthDate: newBirthDate,
      teddyName: newTeddyName,
      teddyDescription: newTeddyDescription,
      imaginaryWorld: newImaginaryWorld,
      authorId: auth.currentUser.uid,
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
    setNewBirthDate(child.birthDate);
    setNewTeddyName(child.teddyName || "");
    setNewTeddyDescription(child.teddyDescription || "");
    setNewImaginaryWorld(child.imaginaryWorld || "");
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <ProfileHeader 
        onShowForm={() => setShowForm(true)} 
        showForm={showForm}
        onCreateStory={onCreateStory}
      />
      <ProfileGrid children={children} onEdit={handleEdit} onDelete={onDeleteChild} />
      <ProfileFormWrapper
        showForm={showForm}
        childName={newChildName}
        birthDate={newBirthDate}
        teddyName={newTeddyName}
        teddyDescription={newTeddyDescription}
        imaginaryWorld={newImaginaryWorld}
        editingChild={editingChild}
        onSubmit={handleSubmit}
        onReset={resetForm}
        onChildNameChange={setNewChildName}
        onBirthDateChange={setNewBirthDate}
        onTeddyNameChange={setNewTeddyName}
        onTeddyDescriptionChange={setNewTeddyDescription}
        onImaginaryWorldChange={setNewImaginaryWorld}
      />
    </div>
  );
};

export default ChildrenProfiles;