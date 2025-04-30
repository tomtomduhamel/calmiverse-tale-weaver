
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { DatePickerWithInput } from "@/components/ui/date-picker/DatePickerWithInput";
import SupabaseTeddyPhotoUpload from "./SupabaseTeddyPhotoUpload";
import TeddyPhotoGallery from "./TeddyPhotoGallery";
import type { Child } from "@/types/child";

interface ChildFormProps {
  childName: string;
  birthDate: Date;
  teddyName: string;
  teddyDescription: string;
  imaginaryWorld: string;
  isEditing: boolean;
  childId?: string;
  teddyPhotos: Child["teddyPhotos"];
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

const ChildForm: React.FC<ChildFormProps> = ({
  childName,
  birthDate,
  teddyName,
  teddyDescription,
  imaginaryWorld,
  isEditing,
  childId,
  teddyPhotos = [],
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
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="childName">Nom de l'enfant</Label>
        <Input
          id="childName"
          value={childName}
          onChange={(e) => onChildNameChange(e.target.value)}
          placeholder="Entrez le nom"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Date de naissance</Label>
        <DatePickerWithInput
          value={birthDate}
          onChange={onBirthDateChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="teddyName">Nom du doudou</Label>
        <Input
          id="teddyName"
          value={teddyName}
          onChange={(e) => onTeddyNameChange(e.target.value)}
          placeholder="Entrez le nom du doudou"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="teddyDescription">Description du doudou</Label>
        <Textarea
          id="teddyDescription"
          value={teddyDescription}
          onChange={(e) => onTeddyDescriptionChange(e.target.value)}
          placeholder="Décrivez le doudou"
        />
      </div>

      {isEditing && childId && (
        <div className="space-y-4">
          <Label>Photos du doudou</Label>
          <TeddyPhotoGallery
            photos={teddyPhotos || []}
            onDeletePhoto={onPhotoDeleted}
          />
          <SupabaseTeddyPhotoUpload
            childId={childId}
            existingPhotos={teddyPhotos || []}
            onPhotoUploaded={onPhotoUploaded}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="imaginaryWorld">Son monde imaginaire</Label>
        <Textarea
          id="imaginaryWorld"
          value={imaginaryWorld}
          onChange={(e) => onImaginaryWorldChange(e.target.value)}
          placeholder="Décrivez son monde imaginaire"
        />
      </div>

      <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
        <Plus className="h-4 w-4 mr-2" />
        {isEditing ? "Mettre à jour" : "Ajouter un profil"}
      </Button>

      {isEditing && (
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={onReset}
        >
          Annuler
        </Button>
      )}
    </form>
  );
};

export default ChildForm;
