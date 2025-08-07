import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfilesView } from "@/pages/views/ProfilesView";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useStories } from "@/hooks/useStories";
import { SimpleLoader } from "@/components/ui/SimpleLoader";

/**
 * Page dédiée à la gestion des profils des enfants
 * Utilise ProfilesView pour afficher la liste des enfants
 */
const ChildrenListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    children,
    loading,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild
  } = useSupabaseChildren();
  
  const { stories } = useStories(children);
  
  // Calculer le nombre total d'histoires et la map par enfant
  const totalStories = stories.stories?.length || 0;
  const storiesCountMap = React.useMemo(() => {
    const countMap: Record<string, number> = {};
    children.forEach(child => {
      countMap[child.id] = stories.stories?.filter(story => 
        story.childrenIds?.includes(child.id)
      ).length || 0;
    });
    return countMap;
  }, [children, stories.stories]);

  if (loading) {
    return <SimpleLoader />;
  }
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
      <ProfilesView 
        children={children} 
        onAddChild={handleAddChild} 
        onUpdateChild={handleUpdateChild} 
        onDeleteChild={handleDeleteChild} 
        onCreateStory={(childId) => {
          if (childId) {
            navigate(`/create-story-titles?childId=${childId}`);
          } else {
            navigate("/create-story-titles");
          }
        }}
        totalStories={totalStories}
        storiesCountMap={storiesCountMap}
      />
    </div>
  );
};
export default ChildrenListPage;