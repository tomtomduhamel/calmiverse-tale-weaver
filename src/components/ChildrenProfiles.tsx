
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";
import ProfileHeader from "./children/ProfileHeader";
import ProfileGrid from "./children/ProfileGrid";
import ProfileFormWrapper from "./children/ProfileFormWrapper";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ChildrenProfilesProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => Promise<string>;
  onUpdateChild: (childId: string, updatedChild: Partial<Child>) => Promise<void>;
  onDeleteChild: (childId: string) => Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  
  // Log de débogage pour surveiller la liste des enfants
  useEffect(() => {
    console.log("[ChildrenProfiles] Rendu avec enfants:", children);
  }, [children]);

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
      teddyPhotos: updatedPhotos,
    });
  };

  const handlePhotoDeleted = async (childId: string, photoPath: string) => {
    try {
      const child = children.find((c) => c.id === childId);
      if (!child) return;

      // Supprimer le fichier de Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('teddy-photos')
        .remove([photoPath]);
        
      if (deleteError) throw deleteError;

      // Mettre à jour la base de données
      const updatedPhotos = child.teddyPhotos?.filter(
        (photo) => photo.path !== photoPath
      ) || [];
      
      await onUpdateChild(childId, {
        teddyPhotos: updatedPhotos,
      });

      toast({
        title: "Succès",
        description: "La photo a été supprimée",
      });
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la photo:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la photo",
        variant: "destructive",
      });
    }
  };

  // Updated handleSubmit to accept a Child object instead of a form event
  const handleSubmit = async (childData: Child) => {
    if (!childData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'enfant est requis",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("[ChildrenProfiles] Soumission du formulaire pour l'enfant:", childData);

      // Prepare the data without changing its type
      const submissionData = {
        name: childData.name,
        birthDate: childData.birthDate,
        gender: childData.gender,
        teddyName: childData.teddyName || "",
        teddyDescription: childData.teddyDescription || "",
        imaginaryWorld: childData.imaginaryWorld || "",
        authorId: user.id,
        teddyPhotos: childData.teddyPhotos || [],
      };

      if (editingChild) {
        console.log("[ChildrenProfiles] Mode d'édition - mise à jour de l'enfant:", editingChild);
        await onUpdateChild(editingChild, submissionData);
        toast({
          title: "Succès",
          description: "Le profil a été mis à jour avec succès",
        });
      } else {
        console.log("[ChildrenProfiles] Mode d'ajout - création d'un nouveau profil d'enfant");
        const newChildId = await onAddChild(submissionData);
        console.log("[ChildrenProfiles] Nouveau profil d'enfant créé avec ID:", newChildId);
        toast({
          title: "Succès",
          description: "Le profil a été ajouté avec succès",
        });
      }
    } catch (error) {
      console.error("[ChildrenProfiles] Erreur lors de la soumission du formulaire:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du profil",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      resetForm();
    }
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
    <div className="space-y-6 p-4">
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
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ChildrenProfiles;
