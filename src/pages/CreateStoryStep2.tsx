import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate } from "react-router-dom";
import LoadingStory from "@/components/LoadingStory";
import ObjectiveSelectionStep from "@/components/story/steps/ObjectiveSelectionStep";

const CreateStoryStep2: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const navigate = useNavigate();

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
        <ObjectiveSelectionStep children={children} />
      </div>
    </div>
  );
};

export default CreateStoryStep2;