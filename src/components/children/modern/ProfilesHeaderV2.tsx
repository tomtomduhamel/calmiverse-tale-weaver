
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, BookOpen, Users, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
interface ProfilesHeaderV2Props {
  onShowForm: () => void;
  onCreateStory?: () => void;
  childrenCount: number;
  totalStories?: number;
}
const ProfilesHeaderV2: React.FC<ProfilesHeaderV2Props> = ({
  onShowForm,
  onCreateStory,
  childrenCount,
  totalStories = 0
}) => {
  const isMobile = useIsMobile();
  return <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          L'univers de vos enfants
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Créez des profils personnalisés pour vos enfants et générez des histoires magiques adaptées à leur âge, leurs goûts et leur imagination.
        </p>
      </div>

      {/* Stats Cards - Centered */}
      <div className="flex justify-center">
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{childrenCount}</p>
                <p className="text-sm text-muted-foreground">Enfant{childrenCount > 1 ? 's' : ''}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{totalStories}</p>
                <p className="text-sm text-muted-foreground">Histoire{totalStories > 1 ? 's' : ''}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onShowForm} size={isMobile ? "default" : "lg"} className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          Ajouter un enfant
        </Button>

        {onCreateStory && childrenCount > 0 && <Button onClick={onCreateStory} variant="outline" size={isMobile ? "default" : "lg"} className="border-accent text-accent hover:bg-accent/10">
            <BookOpen className="w-5 h-5 mr-2" />
            Créer une histoire
          </Button>}
      </div>
    </div>;
};
export default ProfilesHeaderV2;
