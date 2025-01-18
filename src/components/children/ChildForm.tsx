import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { isValidBirthDate } from "@/utils/age";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !birthDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {birthDate ? (
                format(birthDate, "dd MMMM yyyy", { locale: fr })
              ) : (
                <span>Choisir une date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={birthDate}
              onSelect={(date) => date && onBirthDateChange(date)}
              disabled={(date) => !isValidBirthDate(date)}
              initialFocus
              locale={fr}
              className="bg-gradient-to-br from-card-start to-card-end rounded-md border-secondary/20"
              classNames={{
                months: "space-y-4",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium text-secondary-dark",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-secondary-dark rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: cn(
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent/50",
                  "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                ),
                day: cn(
                  "h-9 w-9 p-0 font-normal",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground focus:rounded-md",
                  "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary/90",
                  "disabled:opacity-50 disabled:pointer-events-none"
                ),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </PopoverContent>
        </Popover>
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