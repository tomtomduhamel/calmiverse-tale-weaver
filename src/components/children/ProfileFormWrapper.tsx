
import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  onSubmit: (e: React.FormEvent) => void;
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

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
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
          onSubmit={onSubmit}
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
    </ScrollArea>
  );
};

export default ProfileFormWrapper;
