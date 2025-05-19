
import React from "react";
import { Card } from "@/components/ui/card";
import ChildForm from "./ChildForm";
import type { Child } from "@/types/child";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ProfileFormWrapperProps {
  showForm: boolean;
  childName: string;
  birthDate: Date;
  teddyName: string;
  teddyDescription: string;
  imaginaryWorld: string;
  editingChild: string | null;
  childId?: string;
  teddyPhotos?: Child["teddyPhotos"];
  onSubmit: (child: Child) => void;
  onReset: () => void;
  onChildNameChange: (value: string) => void;
  onBirthDateChange: (value: Date) => void;
  onTeddyNameChange: (value: string) => void;
  onTeddyDescriptionChange: (value: string) => void;
  onImaginaryWorldChange: (value: string) => void;
  onPhotoUploaded: (photo: { url: string; path: string; uploadedAt: Date }) => void;
  onPhotoDeleted: (path: string) => void;
  isSubmitting?: boolean;
}

const ProfileFormWrapper: React.FC<ProfileFormWrapperProps> = ({
  showForm,
  childName,
  birthDate,
  teddyName,
  teddyDescription,
  imaginaryWorld,
  editingChild,
  childId,
  teddyPhotos,
  onSubmit,
  onReset,
  onChildNameChange,
  onBirthDateChange,
  onTeddyNameChange,
  onTeddyDescriptionChange,
  onImaginaryWorldChange,
  onPhotoUploaded,
  onPhotoDeleted,
  isSubmitting = false,
}) => {
  const isMobile = useIsMobile();
  
  if (!showForm) return null;

  // Create a wrapper function to transform the event to a Child object
  const handleSubmit = (childData: Child) => {
    onSubmit(childData);
  };

  return (
    <Card className={cn(
      "bg-white/80 backdrop-blur-sm mt-6",
      isMobile ? "p-4" : "p-6"
    )}>
      <ChildForm
        childName={childName}
        birthDate={birthDate}
        teddyName={teddyName}
        teddyDescription={teddyDescription}
        imaginaryWorld={imaginaryWorld}
        isEditing={!!editingChild}
        childId={childId}
        teddyPhotos={teddyPhotos}
        onSubmit={handleSubmit}
        onReset={onReset}
        onChildNameChange={onChildNameChange}
        onBirthDateChange={onBirthDateChange}
        onTeddyNameChange={onTeddyNameChange}
        onTeddyDescriptionChange={onTeddyDescriptionChange}
        onImaginaryWorldChange={onImaginaryWorldChange}
        onPhotoUploaded={onPhotoUploaded}
        onPhotoDeleted={onPhotoDeleted}
        isSubmitting={isSubmitting}
      />
    </Card>
  );
};

export default ProfileFormWrapper;
