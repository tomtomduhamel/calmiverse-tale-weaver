import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, BookOpen, Users, Sparkles, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
interface ProfilesHeaderV2Props {
  onShowForm: () => void;
  onCreateStory?: () => void;
  childrenCount: number;
  petsCount: number;
  totalStories?: number;
}
const ProfilesHeaderV2: React.FC<ProfilesHeaderV2Props> = ({
  onShowForm,
  onCreateStory,
  childrenCount,
  petsCount,
  totalStories = 0
}) => {
  const isMobile = useIsMobile();
  return (
    <div className={`space-y-4 ${isMobile ? 'px-2' : 'space-y-6'}`}>
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <h1 className={`font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${isMobile ? 'text-xl' : 'text-3xl'}`}>
          L'univers de vos enfants
        </h1>
        <p className={`text-muted-foreground max-w-2xl mx-auto ${isMobile ? 'text-sm px-2' : ''}`}>
          Créez des profils personnalisés pour vos enfants et générez des histoires magiques adaptées à leur âge, leurs goûts et leur imagination.
        </p>
      </div>

      {/* Stats Cards - Mobile optimized */}
      <div className="flex justify-center">
        <div className={`grid grid-cols-3 max-w-2xl ${isMobile ? 'gap-2' : 'gap-4'}`}>
          <Card className={`bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 ${isMobile ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${isMobile ? 'flex-col text-center space-y-1' : 'space-x-3'}`}>
              <div className={`bg-primary/20 rounded-lg flex items-center justify-center ${isMobile ? 'w-8 h-8 mb-1' : 'w-10 h-10'}`}>
                <Users className={`text-primary ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </div>
              <div>
                <p className={`font-bold text-primary ${isMobile ? 'text-lg' : 'text-2xl'}`}>{childrenCount}</p>
                <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Enfant{childrenCount > 1 ? 's' : ''}</p>
              </div>
            </div>
          </Card>

          <Card className={`bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 ${isMobile ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${isMobile ? 'flex-col text-center space-y-1' : 'space-x-3'}`}>
              <div className={`bg-secondary/20 rounded-lg flex items-center justify-center ${isMobile ? 'w-8 h-8 mb-1' : 'w-10 h-10'}`}>
                <Heart className={`text-secondary ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </div>
              <div>
                <p className={`font-bold text-secondary ${isMobile ? 'text-lg' : 'text-2xl'}`}>{petsCount}</p>
                <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Anim{petsCount > 1 ? 'aux' : 'al'}</p>
              </div>
            </div>
          </Card>

          <Card className={`bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 ${isMobile ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${isMobile ? 'flex-col text-center space-y-1' : 'space-x-3'}`}>
              <div className={`bg-accent/20 rounded-lg flex items-center justify-center ${isMobile ? 'w-8 h-8 mb-1' : 'w-10 h-10'}`}>
                <BookOpen className={`text-accent ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </div>
              <div>
                <p className={`font-bold text-accent ${isMobile ? 'text-lg' : 'text-2xl'}`}>{totalStories}</p>
                <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Histoire{totalStories > 1 ? 's' : ''}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex justify-center ${isMobile ? 'flex-col gap-2 px-2' : 'flex-row gap-4'}`}>
        <Button 
          onClick={onShowForm} 
          size={isMobile ? "default" : "lg"} 
          className={`bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg ${isMobile ? 'h-10 text-sm' : ''}`}
        >
          <Plus className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          Ajouter un enfant
        </Button>

        {onCreateStory && childrenCount > 0 && (
          <Button 
            onClick={onCreateStory} 
            variant="outline" 
            size={isMobile ? "default" : "lg"} 
            className={`border-accent text-accent hover:bg-accent/10 ${isMobile ? 'h-10 text-sm' : ''}`}
          >
            <BookOpen className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            Créer une histoire
          </Button>
        )}
      </div>
    </div>
  );
};
export default ProfilesHeaderV2;