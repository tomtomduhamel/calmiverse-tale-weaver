import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(e);
      toast({
        title: "Succès",
        description: "L'enfant a été ajouté avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'enfant",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-card-start to-card-end dark:from-muted-dark dark:to-muted">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-primary dark:text-primary">
            Ajouter un enfant
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="childName" className="text-sm font-medium text-secondary dark:text-secondary-foreground">
                Prénom
              </Label>
              <Input
                id="childName"
                value={childName}
                onChange={(e) => onChildNameChange(e.target.value)}
                placeholder="Entrez le prénom"
                className="w-full bg-white/50 dark:bg-muted-dark/50 border-secondary/20 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="childAge" className="text-sm font-medium text-secondary dark:text-secondary-foreground">
                Âge
              </Label>
              <select
                id="childAge"
                value={childAge}
                onChange={(e) => onChildAgeChange(Number(e.target.value))}
                className="w-full p-2 rounded-md bg-white/50 dark:bg-muted-dark/50 border border-secondary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((age) => (
                  <option key={age} value={age}>
                    {age} ans
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft hover:shadow-soft-lg transition-all"
            >
              Ajouter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="flex-1 border-secondary/20 hover:bg-secondary/10 transition-all"
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChildDialog;