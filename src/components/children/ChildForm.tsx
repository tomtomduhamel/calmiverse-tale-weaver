import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { isValidBirthDate } from "@/utils/age";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ChildFormProps {
  childName: string;
  birthDate: Date;
  teddyName: string;
  teddyDescription: string;
  imaginaryWorld: string;
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  onChildNameChange: (value: string) => void;
  onBirthDateChange: (value: Date) => void;
  onTeddyNameChange: (value: string) => void;
  onTeddyDescriptionChange: (value: string) => void;
  onImaginaryWorldChange: (value: string) => void;
}

const ChildForm: React.FC<ChildFormProps> = ({
  childName,
  birthDate,
  teddyName,
  teddyDescription,
  imaginaryWorld,
  isEditing,
  onSubmit,
  onReset,
  onChildNameChange,
  onBirthDateChange,
  onTeddyNameChange,
  onTeddyDescriptionChange,
  onImaginaryWorldChange,
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
        <Input
          id="birthDate"
          type="date"
          value={format(birthDate, 'yyyy-MM-dd')}
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            if (isValidBirthDate(newDate)) {
              onBirthDateChange(newDate);
            }
          }}
          max={format(new Date(), 'yyyy-MM-dd')}
          min={format(new Date(new Date().setFullYear(new Date().getFullYear() - 12)), 'yyyy-MM-dd')}
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