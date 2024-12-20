import React, { useState } from "react";
import StoryForm, { StoryFormData } from "@/components/StoryForm";
import StoryReader from "@/components/StoryReader";
import StoryLibrary from "@/components/StoryLibrary";
import ChildrenProfiles from "@/components/ChildrenProfiles";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";

const Index = () => {
  const [currentView, setCurrentView] = useState<"home" | "create" | "library" | "reader" | "profiles">("home");
  const [currentStory, setCurrentStory] = useState<string>("");
  const [stories, setStories] = useState([
    {
      id: "1",
      title: "L'aventure magique",
      preview: "Une histoire enchantée pour les petits rêveurs...",
      theme: "magic",
      objective: "sleep",
    },
  ]);
  const [children, setChildren] = useState<Child[]>([]);
  const { toast } = useToast();

  const handleCreateStory = async (formData: StoryFormData) => {
    try {
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name).join(" et ");
      
      // TODO: Implement OpenAI integration
      const mockStory = `Il était une fois ${childrenNames} qui ${
        formData.objective === "sleep" ? "se préparaient pour dormir" : 
        formData.objective === "relax" ? "voulaient se détendre" : 
        "cherchaient à se concentrer"
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

  const handleDeleteStory = (storyId: string) => {
    setStories((prevStories) => prevStories.filter((story) => story.id !== storyId));
  };

  const handleAddChild = (childData: Omit<Child, "id">) => {
    const newChild: Child = {
      ...childData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setChildren(prev => [...prev, newChild]);
  };

  const handleDeleteChild = (childId: string) => {
    setChildren(prev => prev.filter(child => child.id !== childId));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/lovable-uploads/08b9555a-5430-4317-9aa0-2652884e8414.png" alt="Calmi Logo" className="h-12 w-auto" />
            <span className="text-xl font-semibold text-primary-foreground">Calmi</span>
          </div>
          <nav className="space-x-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView("home")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              Accueil
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView("profiles")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              Profils
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView("library")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              Bibliothèque
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {currentView === "home" && (
          <div className="text-center space-y-8 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Bienvenue sur Calmi
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Créez des histoires personnalisées pour le bien-être de vos enfants
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => setCurrentView("create")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg"
              >
                Créer une histoire
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentView("profiles")}
                className="border-primary text-primary hover:bg-primary/10 px-8 py-6 text-lg"
              >
                Gérer les profils
              </Button>
            </div>
          </div>
        )}

        {currentView === "create" && (
          <div className="max-w-md mx-auto">
            <StoryForm onSubmit={handleCreateStory} children={children} />
          </div>
        )}

        {currentView === "profiles" && (
          <ChildrenProfiles
            children={children}
            onAddChild={handleAddChild}
            onDeleteChild={handleDeleteChild}
          />
        )}

        {currentView === "library" && (
          <StoryLibrary
            stories={stories}
            onSelectStory={(story) => {
              setCurrentStory(story.preview);
              setCurrentView("reader");
            }}
            onDeleteStory={handleDeleteStory}
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