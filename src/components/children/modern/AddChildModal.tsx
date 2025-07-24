import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ChildForm from "../ChildForm";
import type { Child } from "@/types/child";

interface AddChildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  birthDate: Date;
  teddyName: string;
  teddyDescription: string;
  imaginaryWorld: string;
  editingChild: string | null;
  childId?: string;
  teddyPhotos?: Child["teddyPhotos"];
  onSubmit: (child: Child) => void;
  onCancel: () => void;
  onChildNameChange: (value: string) => void;
  onBirthDateChange: (value: Date) => void;
  onTeddyNameChange: (value: string) => void;
  onTeddyDescriptionChange: (value: string) => void;
  onImaginaryWorldChange: (value: string) => void;
  onPhotoUploaded: (photo: { url: string; path: string; uploadedAt: Date }) => void;
  onPhotoDeleted: (path: string) => void;
  isSubmitting?: boolean;
}

const AddChildModal: React.FC<AddChildModalProps> = ({
  open,
  onOpenChange,
  childName,
  birthDate,
  teddyName,
  teddyDescription,
  imaginaryWorld,
  editingChild,
  childId,
  teddyPhotos,
  onSubmit,
  onCancel,
  onChildNameChange,
  onBirthDateChange,
  onTeddyNameChange,
  onTeddyDescriptionChange,
  onImaginaryWorldChange,
  onPhotoUploaded,
  onPhotoDeleted,
  isSubmitting = false,
}) => {
  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background/95 to-background/98 backdrop-blur-sm">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {editingChild ? "Modifier le profil" : "Ajouter un enfant"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingChild 
              ? "Modifiez les informations de votre enfant pour personnaliser ses histoires."
              : "Créez un profil pour votre enfant afin de générer des histoires personnalisées."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <ChildForm
            childName={childName}
            birthDate={birthDate}
            teddyName={teddyName}
            teddyDescription={teddyDescription}
            imaginaryWorld={imaginaryWorld}
            isEditing={!!editingChild}
            childId={childId}
            teddyPhotos={teddyPhotos}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            onChildNameChange={onChildNameChange}
            onBirthDateChange={onBirthDateChange}
            onTeddyNameChange={onTeddyNameChange}
            onTeddyDescriptionChange={onTeddyDescriptionChange}
            onImaginaryWorldChange={onImaginaryWorldChange}
            onPhotoUploaded={onPhotoUploaded}
            onPhotoDeleted={onPhotoDeleted}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddChildModal;