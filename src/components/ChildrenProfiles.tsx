import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";
import { auth, storage } from "@/lib/firebase";
import { ref, deleteObject } from "firebase/storage";
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

  const handlePhotoUploaded = async (childId: string, photo: { url: string; path: string; uploadedAt: Date }) => {
    const child = children.find((c) => c.id === childId);
    if (!child) return;

    const updatedPhotos = [...(child.teddyPhotos || []), photo];
    await onUpdateChild(childId, {
      ...child,
      teddyPhotos: updatedPhotos,
    });
  };

  const handlePhotoDeleted = async (childId: string, photoPath: string) => {
    try {
      const child = children.find((c) => c.id === childId);
      if (!child) return;

      // Supprimer le fichier de Firebase Storage
      const storageRef = ref(storage, photoPath);
      await deleteObject(storageRef);

      // Mettre à jour Firestore
      const updatedPhotos = child.teddyPhotos?.filter(
        (photo) => photo.path !== photoPath
      ) || [];
      
      await onUpdateChild(childId, {
        ...child,
        teddyPhotos: updatedPhotos,
      });

      toast({
        title: "Succès",
        description: "La photo a été supprimée",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la photo:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la photo",
        variant: "destructive",
      });
    }
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
      teddyPhotos: [],
    };

    if (editingChild) {
      const currentChild = children.find((c) => c.id === editingChild);
      if (currentChild) {
        onUpdateChild(editingChild, {
          ...childData,
          teddyPhotos: currentChild.teddyPhotos || [],
        });
      }
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
        childId={editingChild || undefined}
        teddyPhotos={editingChild ? children.find(c => c.id === editingChild)?.teddyPhotos : []}
        onSubmit={handleSubmit}
        onReset={resetForm}
        onChildNameChange={setNewChildName}
        onBirthDateChange={setNewBirthDate}
        onTeddyNameChange={setNewTeddyName}
        onTeddyDescriptionChange={setNewTeddyDescription}
        onImaginaryWorldChange={setNewImaginaryWorld}
        onPhotoUploaded={(photo) => editingChild && handlePhotoUploaded(editingChild, photo)}
        onPhotoDeleted={(path) => editingChild && handlePhotoDeleted(editingChild, path)}
      />
    </div>
  );
};

export default ChildrenProfiles;