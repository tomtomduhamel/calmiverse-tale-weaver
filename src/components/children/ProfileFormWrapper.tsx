
import React from "react";
import { Card } from "@/components/ui/card";
import ChildForm from "./ChildForm";
import type { Child } from "@/types/child";

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
  onSubmit: (child: Child) => void; // This expects a Child object
  onReset: () => void;
  onChildNameChange: (value: string) => void;
  onBirthDateChange: (value: Date) => void;
  onTeddyNameChange: (value: string) => void;
  onTeddyDescriptionChange: (value: string) => void;
  onImaginaryWorldChange: (value: string) => void;
  onPhotoUploaded: (photo: { url: string; path: string; uploadedAt: Date }) => void;
  onPhotoDeleted: (path: string) => void;
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
}) => {
  if (!showForm) return null;

  // Create a wrapper function to transform the event to a Child object
  const handleSubmit = (childData: Child) => {
    onSubmit(childData);
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm mt-6">
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
      />
    </Card>
  );
};

export default ProfileFormWrapper;
