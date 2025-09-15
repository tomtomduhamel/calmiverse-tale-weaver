import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChildrenSelectionStep from "@/components/story/steps/ChildrenSelectionStep";

const CreateStoryStep1: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Récupérer l'ID de l'enfant présélectionné depuis l'URL
  const preSelectedChildId = searchParams.get('childId') || undefined;

  if (authLoading || childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <ChildrenSelectionStep children={children} preSelectedChildId={preSelectedChildId} />
  );
};

export default CreateStoryStep1;