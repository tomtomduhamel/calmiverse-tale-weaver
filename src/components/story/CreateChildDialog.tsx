import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CreateChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  childAge: number;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  onChildNameChange: (value: string) => void;
  onChildAgeChange: (value: number) => void;
}

const CreateChildDialog = ({
  open,
  onOpenChange,
  childName,
  childAge,
  onSubmit,
  onReset,
  onChildNameChange,
  onChildAgeChange,
}: CreateChildDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-primary dark:text-primary-dark mb-4">
            Ajouter un enfant
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="childName">Prénom</Label>
            <Input
              id="childName"
              value={childName}
              onChange={(e) => onChildNameChange(e.target.value)}
              placeholder="Entrez le prénom"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="childAge">Âge</Label>
            <select
              id="childAge"
              value={childAge}
              onChange={(e) => onChildAgeChange(Number(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((age) => (
                <option key={age} value={age}>
                  {age} ans
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Ajouter
            </Button>
            <Button type="button" variant="outline" onClick={onReset} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChildDialog;