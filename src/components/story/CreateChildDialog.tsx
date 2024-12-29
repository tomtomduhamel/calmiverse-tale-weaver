import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ChildForm from "../children/ChildForm";

interface CreateChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  childAge: number;
  teddyName: string;
  teddyDescription: string;
  imaginaryWorld: string;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  onChildNameChange: (value: string) => void;
  onChildAgeChange: (value: number) => void;
  onTeddyNameChange: (value: string) => void;
  onTeddyDescriptionChange: (value: string) => void;
  onImaginaryWorldChange: (value: string) => void;
}

const CreateChildDialog = ({
  open,
  onOpenChange,
  childName,
  childAge,
  teddyName,
  teddyDescription,
  imaginaryWorld,
  onSubmit,
  onReset,
  onChildNameChange,
  onChildAgeChange,
  onTeddyNameChange,
  onTeddyDescriptionChange,
  onImaginaryWorldChange,
}: CreateChildDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-primary dark:text-primary-dark mb-4">
            Créer un profil enfant
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <ChildForm
            childName={childName}
            childAge={childAge}
            teddyName={teddyName}
            teddyDescription={teddyDescription}
            imaginaryWorld={imaginaryWorld}
            isEditing={false}
            onSubmit={onSubmit}
            onReset={onReset}
            onChildNameChange={onChildNameChange}
            onChildAgeChange={onChildAgeChange}
            onTeddyNameChange={onTeddyNameChange}
            onTeddyDescriptionChange={onTeddyDescriptionChange}
            onImaginaryWorldChange={onImaginaryWorldChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChildDialog;