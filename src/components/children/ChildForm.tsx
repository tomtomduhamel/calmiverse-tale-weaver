
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, X, Loader2, User, Heart, Cat, Dog, Rabbit } from "lucide-react";
import { DatePickerWithInput } from "@/components/ui/date-picker/DatePickerWithInput";
import SupabaseTeddyPhotoUpload from "./SupabaseTeddyPhotoUpload";
import TeddyPhotoGallery from "./TeddyPhotoGallery";
import type { Child, ChildGender, PetType } from "@/types/child";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ChildFormProps {
  childName?: string;
  birthDate?: Date;
  gender?: ChildGender;
  petType?: PetType;
  petTypeCustom?: string;
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
  onGenderChange?: (value: ChildGender) => void;
  onPetTypeChange?: (value: PetType) => void;
  onPetTypeCustomChange?: (value: string) => void;
  onTeddyNameChange?: (value: string) => void;
  onTeddyDescriptionChange?: (value: string) => void;
  onImaginaryWorldChange?: (value: string) => void;
  onPhotoUploaded?: (photo: { url: string; path: string; uploadedAt: Date }) => void;
  onPhotoDeleted?: (path: string) => void;
  isSubmitting?: boolean;
}

const ChildForm: React.FC<ChildFormProps> = ({
  childName = "",
  birthDate = new Date(),
  gender = "boy",
  petType,
  petTypeCustom = "",
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
  onGenderChange,
  onPetTypeChange,
  onPetTypeCustomChange,
  onTeddyNameChange,
  onTeddyDescriptionChange,
  onImaginaryWorldChange,
  onPhotoUploaded,
  onPhotoDeleted,
  isSubmitting = false,
}) => {
  const isMobile = useIsMobile();
  
  // État local si les gestionnaires de changement ne sont pas fournis
  const [localChildName, setLocalChildName] = React.useState(initialValues?.name || childName);
  const [localBirthDate, setLocalBirthDate] = React.useState(initialValues?.birthDate || birthDate);
  const [localGender, setLocalGender] = React.useState<ChildGender>(initialValues?.gender || gender);
  const [localPetType, setLocalPetType] = React.useState<PetType | undefined>(initialValues?.petType || petType);
  const [localPetTypeCustom, setLocalPetTypeCustom] = React.useState(initialValues?.petTypeCustom || petTypeCustom);
  const [localTeddyName, setLocalTeddyName] = React.useState(initialValues?.teddyName || teddyName);
  const [localTeddyDescription, setLocalTeddyDescription] = React.useState(initialValues?.teddyDescription || teddyDescription);
  const [localImaginaryWorld, setLocalImaginaryWorld] = React.useState(initialValues?.imaginaryWorld || imaginaryWorld);

  // Logique conditionnelle pour masquer les champs teddy si l'enfant est un animal
  const currentGender = onGenderChange ? gender : localGender;
  const showTeddyFields = currentGender !== 'pet';
  const showPetTypeFields = currentGender === 'pet';
  const currentPetType = onPetTypeChange ? petType : localPetType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construire l'objet enfant à partir des valeurs locales ou des props
    const selectedGender = onGenderChange ? gender : localGender;
    const selectedPetType = onPetTypeChange ? petType : localPetType;
    const selectedPetTypeCustom = onPetTypeCustomChange ? petTypeCustom : localPetTypeCustom;
    
    const childData: Partial<Child> = {
      name: onChildNameChange ? childName : localChildName,
      birthDate: onBirthDateChange ? birthDate : localBirthDate,
      gender: selectedGender,
      // Champs pour les animaux
      ...(selectedGender === 'pet' && {
        petType: selectedPetType,
        petTypeCustom: selectedPetType === 'other' ? selectedPetTypeCustom : undefined,
      }),
      // Champs teddy uniquement si ce n'est pas un animal
      ...(selectedGender !== 'pet' && {
        teddyName: onTeddyNameChange ? teddyName : localTeddyName,
        teddyDescription: onTeddyDescriptionChange ? teddyDescription : localTeddyDescription,
        imaginaryWorld: onImaginaryWorldChange ? imaginaryWorld : localImaginaryWorld,
      }),
      ...(childId && { id: childId }),
      ...(initialValues?.authorId && { authorId: initialValues.authorId }),
      ...(initialValues?.id && { id: initialValues.id }),
      ...(initialValues?.teddyPhotos && { teddyPhotos: initialValues.teddyPhotos }),
    } as Child;

    onSubmit(childData as Child);
  };

  const fieldSpacing = isMobile ? "space-y-4" : "space-y-6";
  const labelSpacing = isMobile ? "space-y-1" : "space-y-2";

  return (
    <form onSubmit={handleSubmit} className={fieldSpacing}>
      <div className={labelSpacing}>
        <Label htmlFor="childName">Nom de l'enfant</Label>
        <Input
          id="childName"
          value={onChildNameChange ? childName : localChildName}
          onChange={(e) => onChildNameChange ? onChildNameChange(e.target.value) : setLocalChildName(e.target.value)}
          placeholder="Entrez le nom"
          disabled={isSubmitting}
          className={cn(isMobile && "h-12 text-base")}
        />
      </div>

      <div className={labelSpacing}>
        <Label htmlFor="birthDate">Date de naissance</Label>
        <DatePickerWithInput
          value={onBirthDateChange ? birthDate : localBirthDate}
          onChange={(date) => onBirthDateChange ? onBirthDateChange(date) : setLocalBirthDate(date)}
          disabled={isSubmitting}
          className={cn(isMobile && "h-12 text-base")}
        />
      </div>

      <div className={labelSpacing}>
        <Label>Type</Label>
        <RadioGroup 
          value={onGenderChange ? gender : localGender}
          onValueChange={(value: ChildGender) => onGenderChange ? onGenderChange(value) : setLocalGender(value)}
          disabled={isSubmitting}
          className="flex flex-row gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="boy" id="boy" />
            <Label htmlFor="boy" className="flex items-center gap-2 cursor-pointer">
              <User className="h-4 w-4 text-blue-500" />
              Garçon
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="girl" id="girl" />
            <Label htmlFor="girl" className="flex items-center gap-2 cursor-pointer">
              <Heart className="h-4 w-4 text-pink-500" />
              Fille
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pet" id="pet" />
            <Label htmlFor="pet" className="flex items-center gap-2 cursor-pointer">
              <Cat className="h-4 w-4 text-orange-500" />
              Animal
            </Label>
          </div>
        </RadioGroup>
      </div>

      {showPetTypeFields && (
        <>
          <div className={labelSpacing}>
            <Label>Type d'animal</Label>
            <RadioGroup 
              value={onPetTypeChange ? petType : localPetType}
              onValueChange={(value: PetType) => onPetTypeChange ? onPetTypeChange(value) : setLocalPetType(value)}
              disabled={isSubmitting}
              className="flex flex-row gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dog" id="dog" />
                <Label htmlFor="dog" className="flex items-center gap-2 cursor-pointer">
                  <Dog className="h-4 w-4 text-amber-600" />
                  Chien
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cat" id="cat" />
                <Label htmlFor="cat" className="flex items-center gap-2 cursor-pointer">
                  <Cat className="h-4 w-4 text-orange-500" />
                  Chat
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other-pet" />
                <Label htmlFor="other-pet" className="flex items-center gap-2 cursor-pointer">
                  <Rabbit className="h-4 w-4 text-gray-600" />
                  Autre
                </Label>
              </div>
            </RadioGroup>
          </div>

          {currentPetType === 'other' && (
            <div className={labelSpacing}>
              <Label htmlFor="petTypeCustom">Quel type d'animal ?</Label>
              <Input
                id="petTypeCustom"
                value={onPetTypeCustomChange ? petTypeCustom : localPetTypeCustom}
                onChange={(e) => onPetTypeCustomChange ? onPetTypeCustomChange(e.target.value) : setLocalPetTypeCustom(e.target.value)}
                placeholder="Ex: lapin, hamster, poisson, tortue..."
                disabled={isSubmitting}
                maxLength={50}
                className={cn(isMobile && "h-12 text-base")}
              />
            </div>
          )}
        </>
      )}

      {showTeddyFields && (
        <>
          <div className={labelSpacing}>
            <Label htmlFor="teddyName">Nom du doudou</Label>
            <Input
              id="teddyName"
              value={onTeddyNameChange ? teddyName : localTeddyName}
              onChange={(e) => onTeddyNameChange ? onTeddyNameChange(e.target.value) : setLocalTeddyName(e.target.value)}
              placeholder="Entrez le nom du doudou"
              disabled={isSubmitting}
              className={cn(isMobile && "h-12 text-base")}
            />
          </div>

          <div className={labelSpacing}>
            <Label htmlFor="teddyDescription">Description du doudou</Label>
            <Textarea
              id="teddyDescription"
              value={onTeddyDescriptionChange ? teddyDescription : localTeddyDescription}
              onChange={(e) => onTeddyDescriptionChange ? onTeddyDescriptionChange(e.target.value) : setLocalTeddyDescription(e.target.value)}
              placeholder="Décrivez le doudou"
              disabled={isSubmitting}
              className={cn(isMobile && "min-h-[100px] text-base")}
            />
          </div>

          {isEditing && childId && (
            <div className="space-y-3">
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

          <div className={labelSpacing}>
            <Label htmlFor="imaginaryWorld">Son monde imaginaire</Label>
            <Textarea
              id="imaginaryWorld"
              value={onImaginaryWorldChange ? imaginaryWorld : localImaginaryWorld}
              onChange={(e) => onImaginaryWorldChange ? onImaginaryWorldChange(e.target.value) : setLocalImaginaryWorld(e.target.value)}
              placeholder="Décrivez son monde imaginaire"
              disabled={isSubmitting}
              className={cn(isMobile && "min-h-[100px] text-base")}
            />
          </div>
        </>
      )}

      <div className={cn("flex gap-2", isMobile && "flex-col")}>
        <Button 
          type="submit" 
          className={cn(
            "bg-accent hover:bg-accent/90",
            isMobile ? "w-full py-6 text-base" : "flex-1"
          )}
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
            className={cn(
              isMobile ? "w-full py-5 text-base" : "flex-1"
            )}
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
