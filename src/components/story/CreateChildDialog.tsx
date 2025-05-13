
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CreateChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  childAge: string;
  onSubmit: () => void;
  onReset: () => void;
  onChildNameChange: (name: string) => void;
  onChildAgeChange: (age: string) => void;
}

const CreateChildDialog: React.FC<CreateChildDialogProps> = ({
  open,
  onOpenChange,
  childName,
  childAge,
  onSubmit,
  onReset,
  onChildNameChange,
  onChildAgeChange,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Appeler onSubmit sans arguments - les valeurs sont déjà accessibles via les props
    onSubmit();
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onReset();
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un enfant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Prénom</Label>
              <Input
                id="name"
                value={childName}
                onChange={(e) => onChildNameChange(e.target.value)}
                placeholder="Prénom de l'enfant"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="age">Âge</Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="12"
                value={childAge}
                onChange={(e) => onChildAgeChange(e.target.value)}
                placeholder="Âge de l'enfant"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChildDialog;
