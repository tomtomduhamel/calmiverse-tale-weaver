import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookOpen, MessageCircle } from "lucide-react";
import type { StoryFormProps } from "./story/StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/useStoryForm";
import LoadingStory from "./LoadingStory";
import CreateChildDialog from "./story/CreateChildDialog";
import ChildrenSelection from "./story/ChildrenSelection";
import StoryObjectives from "./story/StoryObjectives";
import { useChildFormLogic } from "./story/useChildFormLogic";
import StoryChat from "./story/chat/StoryChat";

const StoryForm: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const { formData, isLoading, handleChildToggle, setObjective, handleSubmit } = useStoryForm(onStoryCreated, onSubmit);
  const {
    showChildForm,
    setShowChildForm,
    childName,
    childAge,
    handleChildFormSubmit,
    resetChildForm,
    setChildName,
    setChildAge,
  } = useChildFormLogic(onCreateChild);

  if (objectivesLoading) {
    return <div>Chargement des objectifs...</div>;
  }

  if (isLoading) {
    return <LoadingStory />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {creationMode === "chat" ? (
        <div className="animate-fade-in">
          <div className="mb-6 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCreationMode("classic")}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-5 w-5" />
              Mode classique
            </Button>
          </div>
          <StoryChat />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-primary dark:text-primary-dark">
              Créer une histoire
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreationMode("chat")}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Mode conversation
            </Button>
          </div>

          <ChildrenSelection
            children={children}
            selectedChildrenIds={formData.childrenIds}
            onChildToggle={handleChildToggle}
            onCreateChildClick={() => setShowChildForm(true)}
          />

          <div className="space-y-4">
            <Label className="text-secondary dark:text-white text-lg font-medium">
              Je souhaite créer un moment de lecture qui va...
            </Label>
            <StoryObjectives
              objectives={objectives}
              selectedObjective={formData.objective}
              onObjectiveSelect={setObjective}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-primary-foreground flex items-center justify-center gap-2 py-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all hover:scale-[1.02]"
          >
            <BookOpen className="w-5 h-5" />
            Générer l'histoire
          </Button>
        </form>
      )}

      <CreateChildDialog
        open={showChildForm}
        onOpenChange={setShowChildForm}
        childName={childName}
        childAge={childAge}
        onSubmit={handleChildFormSubmit}
        onReset={resetChildForm}
        onChildNameChange={setChildName}
        onChildAgeChange={setChildAge}
      />
    </div>
  );
};

export default StoryForm;