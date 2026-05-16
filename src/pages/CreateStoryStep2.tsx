import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useNavigate } from "react-router-dom";
import ObjectiveSelectionStep from "@/components/story/steps/ObjectiveSelectionStep";

const CreateStoryStep2: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const navigate = useNavigate();

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
    <div className="relative min-h-screen bg-gradient-hero overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary-soft/20 blur-3xl animate-drift" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-accent/25 blur-3xl animate-drift" style={{ animationDelay: '2s' }} />
      <div className="relative container mx-auto px-4 py-8">
        <ObjectiveSelectionStep children={children} />
      </div>
    </div>
  );
};

export default CreateStoryStep2;