import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Check, Moon, Focus, Coffee, Smile, Sparkles } from 'lucide-react';
import type { Objective } from '@/types/story';

interface MagicObjectiveDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: Objective[];
  selectedObjective: string;
  onSelectObjective: (objectiveId: string) => void;
}

const OBJECTIVE_DETAILS: Record<string, { title: string; subtitle: string; bg: string; icon: React.ReactNode }> = {
  sleep: {
    title: "S'endormir paisiblement",
    subtitle: "Glisser doucement vers le sommeil et de beaux rêves",
    bg: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200/60 dark:border-indigo-800/40",
    icon: <Moon className="h-5 w-5 text-indigo-500" />
  },
  relax: {
    title: "Se détendre & s'apaiser",
    subtitle: "Relâcher les tensions de la journée dans le calme",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40",
    icon: <Coffee className="h-5 w-5 text-amber-500" />
  },
  focus: {
    title: "Se concentrer & explorer",
    subtitle: "Stimuler l'attention, l'imaginaire et la curiosité",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40",
    icon: <Focus className="h-5 w-5 text-emerald-500" />
  },
  fun: {
    title: "S'amuser & rire",
    subtitle: "Partager un moment de joie, d'aventure et de complicité",
    bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40",
    icon: <Smile className="h-5 w-5 text-rose-500" />
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
          const details = OBJECTIVE_DETAILS[objective.id] || {
            title: objective.label,
            subtitle: "Une intention magique pour ce conte",
            bg: "bg-muted/30 border-border/50",
            icon: <Sparkles className="h-5 w-5 text-primary" />
          };

          return (
            <div
              key={objective.id}
              onClick={() => handleSelect(objective.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none
                ${isSelected 
                  ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/30' 
                  : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'}
              `}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-card shadow-xs border border-border/60 shrink-0">
                  {details.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-foreground text-sm sm:text-base leading-snug">
                    {details.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {details.subtitle}
                  </p>
                </div>
              </div>
              
              <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors
                ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}
              `}>
                {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
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
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left pb-2 px-5">
            <DrawerTitle className="font-display text-xl">Quelle est l'intention du soir ?</DrawerTitle>
            <DrawerDescription className="text-xs">Choisissez l'ambiance et les bienfaits de cette histoire.</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-5 pb-2 text-left">
          <DialogTitle className="font-display text-xl">Quelle est l'intention du soir ?</DialogTitle>
          <DialogDescription className="text-xs">Choisissez l'ambiance et les bienfaits de cette histoire.</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
