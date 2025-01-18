import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import type { Child } from "@/types/child";
import { calculateAge } from "@/utils/age";

interface ChildrenSelectionProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildToggle: (childId: string) => void;
  onCreateChildClick: () => void;
}

const ChildrenSelection = ({
  children,
  selectedChildrenIds,
  onChildToggle,
  onCreateChildClick,
}: ChildrenSelectionProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-secondary dark:text-white text-lg font-medium">
        Pour qui est cette histoire ?
      </Label>
      {children.length > 0 ? (
        <>
          <div className="space-y-2">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-muted-dark/50 transition-colors"
              >
                <Checkbox
                  id={`child-${child.id}`}
                  checked={selectedChildrenIds.includes(child.id)}
                  onCheckedChange={() => onChildToggle(child.id)}
                />
                <Label
                  htmlFor={`child-${child.id}`}
                  className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {child.name} ({calculateAge(child.birthDate)} ans)
                </Label>
              </div>
            ))}
          </div>
          <Button
            type="button"
            onClick={onCreateChildClick}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-6 border-dashed border-2 hover:border-primary dark:hover:border-primary-dark transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Ajouter un autre enfant
          </Button>
        </>
      ) : (
        <Button
          type="button"
          onClick={onCreateChildClick}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-6 border-dashed border-2 hover:border-primary dark:hover:border-primary-dark transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Créer un profil enfant
        </Button>
      )}
    </div>
  );
};

export default ChildrenSelection;