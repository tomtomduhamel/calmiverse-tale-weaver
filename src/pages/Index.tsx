import React, { useState } from "react";
import StoryForm, { StoryFormData } from "@/components/StoryForm";
import StoryReader from "@/components/StoryReader";
import StoryLibrary from "@/components/StoryLibrary";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentView, setCurrentView] = useState<"home" | "create" | "library" | "reader">("home");
  const [currentStory, setCurrentStory] = useState<string>("");
  const { toast } = useToast();

  const handleCreateStory = async (formData: StoryFormData) => {
    try {
      // TODO: Implement OpenAI integration
      const mockStory = `Il était une fois un enfant nommé ${formData.childName} qui aimait beaucoup les ${
        formData.theme === "animals" ? "animaux" : formData.theme === "magic" ? "tours de magie" : "aventures"
      }...`;
      
      setCurrentStory(mockStory);
      setCurrentView("reader");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération de l'histoire",
        variant: "destructive",
      });
    }
  };

  const mockStories = [
    {
      id: "1",
      title: "L'aventure magique",
      preview: "Une histoire enchantée pour les petits rêveurs...",
      theme: "magic",
      objective: "sleep",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/08b9555a-5430-4317-9aa0-2652884e8414.png" alt="Calmi Logo" className="h-12 w-auto" />
          </div>
          <nav className="space-x-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView("home")}
              className="text-primary-foreground"
            >
              Accueil
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView("library")}
              className="text-primary-foreground"
            >
              Bibliothèque
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {currentView === "home" && (
          <div className="text-center space-y-8 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Bienvenue sur Calmi</h2>
            <p className="text-lg text-gray-600 mb-8">
              Créez des histoires personnalisées pour le bien-être de vos enfants
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => setCurrentView("create")}
                className="bg-accent hover:bg-accent/90"
              >
                Créer une histoire
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentView("library")}
              >
                Voir la bibliothèque
              </Button>
            </div>
          </div>
        )}

        {currentView === "create" && (
          <div className="max-w-md mx-auto">
            <StoryForm onSubmit={handleCreateStory} />
          </div>
        )}

        {currentView === "library" && (
          <StoryLibrary
            stories={mockStories}
            onSelectStory={(story) => {
              setCurrentStory(story.preview);
              setCurrentView("reader");
            }}
          />
        )}

        {currentView === "reader" && (
          <StoryReader
            story={currentStory}
            onClose={() => setCurrentView("library")}
          />
        )}
      </main>
    </div>
  );
};

export default Index;