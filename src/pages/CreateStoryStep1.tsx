import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingStory from "@/components/LoadingStory";
import ChildrenSelectionStep from "@/components/story/steps/ChildrenSelectionStep";

const CreateStoryStep1: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Récupérer l'ID de l'enfant présélectionné depuis l'URL
  const preSelectedChildId = searchParams.get('childId') || undefined;

  if (authLoading || childrenLoading) {
    return <LoadingStory />;
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <ChildrenSelectionStep children={children} preSelectedChildId={preSelectedChildId} />
      </div>
    </div>
  );
};

export default CreateStoryStep1;