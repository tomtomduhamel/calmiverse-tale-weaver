import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import type { Child } from "@/types/child";

export const useChildFormLogic = (onCreateChild: (child: Omit<Child, "id">) => void) => {
  const [showChildForm, setShowChildForm] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(1);
  const [teddyName, setTeddyName] = useState("");
  const [teddyDescription, setTeddyDescription] = useState("");
  const [imaginaryWorld, setImaginaryWorld] = useState("");
  const { toast } = useToast();

  const handleChildFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!childName.trim()) {
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

    const newChildData = {
      name: childName,
      age: childAge,
      teddyName,
      teddyDescription,
      imaginaryWorld,
      authorId: auth.currentUser.uid,
    };

    try {
      await onCreateChild(newChildData);
      toast({
        title: "Succès",
        description: "L'enfant a été créé avec succès",
      });
      resetChildForm();
      setShowChildForm(false);
    } catch (error) {
      console.error("Erreur lors de la création de l'enfant:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'enfant",
        variant: "destructive",
      });
    }
  };

  const resetChildForm = () => {
    setChildName("");
    setChildAge(1);
    setTeddyName("");
    setTeddyDescription("");
    setImaginaryWorld("");
  };

  return {
    showChildForm,
    setShowChildForm,
    childName,
    childAge,
    teddyName,
    teddyDescription,
    imaginaryWorld,
    handleChildFormSubmit,
    resetChildForm,
    setChildName,
    setChildAge,
    setTeddyName,
    setTeddyDescription,
    setImaginaryWorld,
  };
};