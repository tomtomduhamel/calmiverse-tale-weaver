import React from "react";
import { Card } from "@/components/ui/card";
import ChildForm from "./ChildForm";

interface ProfileFormWrapperProps {
  showForm: boolean;
  childName: string;
  birthDate: Date;
  teddyName: string;
  teddyDescription: string;
  imaginaryWorld: string;
  editingChild: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  onChildNameChange: (value: string) => void;
  onBirthDateChange: (value: Date) => void;
  onTeddyNameChange: (value: string) => void;
  onTeddyDescriptionChange: (value: string) => void;
  onImaginaryWorldChange: (value: string) => void;
}

const ProfileFormWrapper: React.FC<ProfileFormWrapperProps> = ({
  showForm,
  childName,
  birthDate,
  teddyName,
  teddyDescription,
  imaginaryWorld,
  editingChild,
  onSubmit,
  onReset,
  onChildNameChange,
  onBirthDateChange,
  onTeddyNameChange,
  onTeddyDescriptionChange,
  onImaginaryWorldChange,
}) => {
  if (!showForm) return null;

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm mt-6">
      <ChildForm
        childName={childName}
        birthDate={birthDate}
        teddyName={teddyName}
        teddyDescription={teddyDescription}
        imaginaryWorld={imaginaryWorld}
        isEditing={!!editingChild}
        onSubmit={onSubmit}
        onReset={onReset}
        onChildNameChange={onChildNameChange}
        onBirthDateChange={onBirthDateChange}
        onTeddyNameChange={onTeddyNameChange}
        onTeddyDescriptionChange={onTeddyDescriptionChange}
        onImaginaryWorldChange={onImaginaryWorldChange}
      />
    </Card>
  );
};

export default ProfileFormWrapper;