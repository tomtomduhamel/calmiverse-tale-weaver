import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Check, Moon, Focus, Coffee, Smile } from 'lucide-react';
import type { Objective } from '@/types/story';

interface MagicObjectiveDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: Objective[];
  selectedObjective: string;
  onSelectObjective: (objectiveId: string) => void;
}

// Helper pour assigner une icône en fonction de l'Id de l'objectif
const getObjectiveIcon = (id: string) => {
  switch (id) {
    case 'sleep': return <Moon className="h-5 w-5 text-indigo-400" />;
    case 'focus': return <Focus className="h-5 w-5 text-emerald-500" />;
    case 'relax': return <Coffee className="h-5 w-5 text-amber-500" />;
    case 'fun': return <Smile className="h-5 w-5 text-rose-500" />;
    default: return <Smile className="h-5 w-5 text-primary" />;
  }
};

export const MagicObjectiveDrawer: React.FC<MagicObjectiveDrawerProps> = ({
  open,
  onOpenChange,
  objectives,
  selectedObjective,
  onSelectObjective
}) => {
  const isMobile = useIsMobile();

  const handleSelect = (id: string) => {
    onSelectObjective(id);
    onOpenChange(false);
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {objectives.map(objective => {
          const isSelected = selectedObjective === objective.id;
          
          return (
            <div
              key={objective.id}
              onClick={() => handleSelect(objective.id)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none
                ${isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'}
              `}
            >
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full flex items-center justify-center bg-background border border-border/50">
                   {getObjectiveIcon(objective.id)}
                 </div>
                 <h4 className="font-semibold">{objective.label}</h4>
              </div>
              <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors
                ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}
              `}>
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle>Quel est l'objectif ?</DrawerTitle>
            <DrawerDescription>Choisissez l'intention derrière cette histoire.</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Quel est l'objectif ?</DialogTitle>
          <DialogDescription>Choisissez l'intention derrière cette histoire.</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
