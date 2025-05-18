
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Loader2 } from "lucide-react";
import { DatePickerWithInput } from "@/components/ui/date-picker/DatePickerWithInput";
import SupabaseTeddyPhotoUpload from "./SupabaseTeddyPhotoUpload";
import TeddyPhotoGallery from "./TeddyPhotoGallery";
import type { Child } from "@/types/child";

interface ChildFormProps {
  childName?: string;
  birthDate?: Date;
  teddyName?: string;
  teddyDescription?: string;
  imaginaryWorld?: string;
  isEditing?: boolean;
  childId?: string;
  teddyPhotos?: Child["teddyPhotos"];
  initialValues?: Child;
  onSubmit: (child: Child) => void;
  onCancel?: () => void;
  onReset?: () => void;
  onChildNameChange?: (value: string) => void;
  onBirthDateChange?: (value: Date) => void;
  onTeddyNameChange?: (value: string) => void;
  onTeddyDescriptionChange?: (value: string) => void;
  onImaginaryWorldChange?: (value: string) => void;
  onPhotoUploaded?: (photo: { url: string; path: string; uploadedAt: Date }) => void;
  onPhotoDeleted?: (path: string) => void;
  isSubmitting?: boolean; // Ajout de la prop isSubmitting
}

const ChildForm: React.FC<ChildFormProps> = ({
  childName = "",
  birthDate = new Date(),
  teddyName = "",
  teddyDescription = "",
  imaginaryWorld = "",
  isEditing = false,
  childId,
  teddyPhotos = [],
  initialValues,
  onSubmit,
  onCancel,
  onReset,
  onChildNameChange,
  onBirthDateChange,
  onTeddyNameChange,
  onTeddyDescriptionChange,
  onImaginaryWorldChange,
  onPhotoUploaded,
  onPhotoDeleted,
  isSubmitting = false, // Valeur par défaut
}) => {
  // État local si les gestionnaires de changement ne sont pas fournis
  const [localChildName, setLocalChildName] = React.useState(initialValues?.name || childName);
  const [localBirthDate, setLocalBirthDate] = React.useState(initialValues?.birthDate || birthDate);
  const [localTeddyName, setLocalTeddyName] = React.useState(initialValues?.teddyName || teddyName);
  const [localTeddyDescription, setLocalTeddyDescription] = React.useState(initialValues?.teddyDescription || teddyDescription);
  const [localImaginaryWorld, setLocalImaginaryWorld] = React.useState(initialValues?.imaginaryWorld || imaginaryWorld);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construire l'objet enfant à partir des valeurs locales ou des props
    const childData: Partial<Child> = {
      name: onChildNameChange ? childName : localChildName,
      birthDate: onBirthDateChange ? birthDate : localBirthDate,
      teddyName: onTeddyNameChange ? teddyName : localTeddyName, 
      teddyDescription: onTeddyDescriptionChange ? teddyDescription : localTeddyDescription,
      imaginaryWorld: onImaginaryWorldChange ? imaginaryWorld : localImaginaryWorld,
      ...(childId && { id: childId }),
      ...(initialValues?.authorId && { authorId: initialValues.authorId }),
      ...(initialValues?.id && { id: initialValues.id }),
      ...(initialValues?.teddyPhotos && { teddyPhotos: initialValues.teddyPhotos }),
    } as Child;

    onSubmit(childData as Child);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="childName">Nom de l'enfant</Label>
        <Input
          id="childName"
          value={onChildNameChange ? childName : localChildName}
          onChange={(e) => onChildNameChange ? onChildNameChange(e.target.value) : setLocalChildName(e.target.value)}
          placeholder="Entrez le nom"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Date de naissance</Label>
        <DatePickerWithInput
          value={onBirthDateChange ? birthDate : localBirthDate}
          onChange={(date) => onBirthDateChange ? onBirthDateChange(date) : setLocalBirthDate(date)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="teddyName">Nom du doudou</Label>
        <Input
          id="teddyName"
          value={onTeddyNameChange ? teddyName : localTeddyName}
          onChange={(e) => onTeddyNameChange ? onTeddyNameChange(e.target.value) : setLocalTeddyName(e.target.value)}
          placeholder="Entrez le nom du doudou"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="teddyDescription">Description du doudou</Label>
        <Textarea
          id="teddyDescription"
          value={onTeddyDescriptionChange ? teddyDescription : localTeddyDescription}
          onChange={(e) => onTeddyDescriptionChange ? onTeddyDescriptionChange(e.target.value) : setLocalTeddyDescription(e.target.value)}
          placeholder="Décrivez le doudou"
          disabled={isSubmitting}
        />
      </div>

      {isEditing && childId && (
        <div className="space-y-4">
          <Label>Photos du doudou</Label>
          <TeddyPhotoGallery
            photos={teddyPhotos || []}
            onDeletePhoto={onPhotoDeleted || (() => {})}
          />
          <SupabaseTeddyPhotoUpload
            childId={childId}
            existingPhotos={teddyPhotos || []}
            onPhotoUploaded={onPhotoUploaded || (() => {})}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="imaginaryWorld">Son monde imaginaire</Label>
        <Textarea
          id="imaginaryWorld"
          value={onImaginaryWorldChange ? imaginaryWorld : localImaginaryWorld}
          onChange={(e) => onImaginaryWorldChange ? onImaginaryWorldChange(e.target.value) : setLocalImaginaryWorld(e.target.value)}
          placeholder="Décrivez son monde imaginaire"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-2">
        <Button 
          type="submit" 
          className="flex-1 bg-accent hover:bg-accent/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>{isEditing ? "Mise à jour..." : "Ajout en cours..."}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              <span>{isEditing ? "Mettre à jour" : "Ajouter un profil"}</span>
            </>
          )}
        </Button>

        {(onCancel || onReset) && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel || onReset}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
};

export default ChildForm;
