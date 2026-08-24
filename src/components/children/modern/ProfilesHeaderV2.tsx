import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users, UserCircle, Cat, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfilesHeaderV2Props {
  onShowForm: () => void;
  onCreateStory?: () => void;
  childrenCount: number;
  adultsCount: number;
  petsCount: number;
  totalStories?: number;
}

const ProfilesHeaderV2: React.FC<ProfilesHeaderV2Props> = ({
  onShowForm,
  onCreateStory,
  childrenCount,
  adultsCount,
  petsCount,
  totalStories = 0
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`space-y-3 ${isMobile ? 'px-1' : 'space-y-4 max-w-4xl mx-auto'}`}>
      {/* Header Compact */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <h1 className="font-display italic text-2xl sm:text-3xl tracking-tight text-foreground">
            L'univers de vos proches
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gérez les profils pour des histoires magiques personnalisées
          </p>
        </div>

        <Button 
          onClick={onShowForm} 
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft rounded-xl h-9 px-4 text-xs sm:text-sm font-medium w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Ajouter un profil
        </Button>
      </div>

      {/* Stats Bar - Compact single row */}
      <div className="grid grid-cols-4 gap-2 bg-card/60 backdrop-blur-md rounded-2xl border border-primary-soft/30 p-2 sm:p-3">
        {/* Children */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center sm:text-left">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-blue-500">{childrenCount}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 hidden sm:inline">Enfant{childrenCount > 1 ? 's' : ''}</span>
            <p className="text-[10px] text-muted-foreground leading-none sm:hidden">Enfants</p>
          </div>
        </div>

        {/* Adults */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center sm:text-left border-l border-border/40">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-500 shrink-0">
            <UserCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-purple-500">{adultsCount}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 hidden sm:inline">Adulte{adultsCount > 1 ? 's' : ''}</span>
            <p className="text-[10px] text-muted-foreground leading-none sm:hidden">Adultes</p>
          </div>
        </div>

        {/* Pets */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center sm:text-left border-l border-border/40">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
            <Cat className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-amber-500">{petsCount}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 hidden sm:inline">Anim{petsCount > 1 ? 'aux' : 'al'}</span>
            <p className="text-[10px] text-muted-foreground leading-none sm:hidden">Animaux</p>
          </div>
        </div>

        {/* Stories */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center sm:text-left border-l border-border/40">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-primary">{totalStories}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 hidden sm:inline">Histoire{totalStories > 1 ? 's' : ''}</span>
            <p className="text-[10px] text-muted-foreground leading-none sm:hidden">Histoires</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilesHeaderV2;
