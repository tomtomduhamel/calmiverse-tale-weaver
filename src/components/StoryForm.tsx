import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Moon, Brain, Heart, Star } from "lucide-react";
import type { Child } from "@/types/child";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import LoadingStory from "./LoadingStory";
import CreateChildDialog from "./story/CreateChildDialog";
import ChildrenSelection from "./story/ChildrenSelection";

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => Promise<string>;
  children: Child[];
  onCreateChild: () => void;
  onStoryCreated: (story: any) => void;
}

export interface StoryFormData {
  childrenIds: string[];
  objective: string;
}

const StoryForm: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const [formData, setFormData] = useState<StoryFormData>({
    childrenIds: [],
    objective: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(1);
  const [teddyName, setTeddyName] = useState("");
  const [teddyDescription, setTeddyDescription] = useState("");
  const [imaginaryWorld, setImaginaryWorld] = useState("");

  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.childrenIds.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un enfant",
        variant: "destructive",
      });
      return;
    }
    if (!formData.objective) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un objectif",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const generatedStory = await onSubmit(formData);
      if (generatedStory) {
        onStoryCreated(generatedStory);
      }
    } catch (error) {
      console.error("Erreur lors de la génération de l'histoire:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChildToggle = (childId: string) => {
    setFormData((prev) => ({
      ...prev,
      childrenIds: prev.childrenIds.includes(childId)
        ? prev.childrenIds.filter((id) => id !== childId)
        : [...prev.childrenIds, childId],
    }));
  };

  const handleChildFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateChild();
    setShowChildForm(false);
    resetChildForm();
  };

  const resetChildForm = () => {
    setChildName("");
    setChildAge(1);
    setTeddyName("");
    setTeddyDescription("");
    setImaginaryWorld("");
  };

  const getObjectiveIcon = (value: string) => {
    switch (value) {
      case "sleep":
        return <Moon className="w-5 h-5 shrink-0" />;
      case "focus":
        return <Brain className="w-5 h-5 shrink-0" />;
      case "relax":
        return <Heart className="w-5 h-5 shrink-0" />;
      default:
        return <Star className="w-5 h-5 shrink-0" />;
    }
  };

  if (objectivesLoading) {
    return <div>Chargement des objectifs...</div>;
  }

  if (isLoading) {
    return <LoadingStory />;
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl"
      >
        <h2 className="text-2xl font-semibold text-center mb-6 text-primary dark:text-primary-dark">
          Créer une histoire
        </h2>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {objectives.map((objective) => (
              <Button
                key={objective.id}
                type="button"
                variant={formData.objective === objective.value ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, objective: objective.value })}
                className={`flex items-center justify-start gap-3 p-4 h-auto text-left min-h-[64px] ${
                  formData.objective === objective.value
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
                }`}
              >
                {getObjectiveIcon(objective.value)}
                <span className="flex-1">{objective.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-primary-foreground flex items-center justify-center gap-2 py-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all hover:scale-[1.02]"
        >
          <BookOpen className="w-5 h-5" />
          Générer l'histoire
        </Button>
      </form>

      <CreateChildDialog
        open={showChildForm}
        onOpenChange={setShowChildForm}
        childName={childName}
        childAge={childAge}
        teddyName={teddyName}
        teddyDescription={teddyDescription}
        imaginaryWorld={imaginaryWorld}
        onSubmit={handleChildFormSubmit}
        onReset={() => setShowChildForm(false)}
        onChildNameChange={setChildName}
        onChildAgeChange={setChildAge}
        onTeddyNameChange={setTeddyName}
        onTeddyDescriptionChange={setTeddyDescription}
        onImaginaryWorldChange={setImaginaryWorld}
      />
    </>
  );
};

export default StoryForm;