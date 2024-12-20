import React, { useState } from "react";
import StoryForm, { StoryFormData } from "@/components/StoryForm";
import StoryReader from "@/components/StoryReader";
import StoryLibrary from "@/components/StoryLibrary";
import ChildrenProfiles from "@/components/ChildrenProfiles";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Users, Home, Library, User, Menu } from "lucide-react";
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

  const handleUpdateChild = (childId: string, updatedData: Omit<Child, "id">) => {
    setChildren(prev => prev.map(child => 
      child.id === childId ? { ...updatedData, id: childId } : child
    ));
  };

  const handleDeleteChild = (childId: string) => {
    setChildren(prev => prev.filter(child => child.id !== childId));
  };

  return (
    <div className="min-h-screen bg-gradient-serene">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/08b9555a-5430-4317-9aa0-2652884e8414.png" 
              alt="Calmi Logo" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-semibold text-secondary">Calmi</span>
          </div>
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              onClick={() => setCurrentView("home")}
              className={`flex items-center gap-2 min-h-[48px] ${
                currentView === "home" ? "text-secondary border-b-2 border-secondary" : "text-muted-foreground"
              }`}
            >
              <Home className="h-5 w-5" />
              Accueil
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView("library")}
              className={`flex items-center gap-2 min-h-[48px] ${
                currentView === "library" ? "text-secondary border-b-2 border-secondary" : "text-muted-foreground"
              }`}
            >
              <Library className="h-5 w-5" />
              Bibliothèque
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView("profiles")}
              className={`flex items-center gap-2 min-h-[48px] ${
                currentView === "profiles" ? "text-secondary border-b-2 border-secondary" : "text-muted-foreground"
              }`}
            >
              <User className="h-5 w-5" />
              Enfants
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pt-24">
        {currentView === "home" && (
          <div className="text-center space-y-8 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4 text-secondary">
              Bienvenue sur Calmi
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Créez des histoires personnalisées pour le bien-être de vos enfants
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => setCurrentView("create")}
                className="bg-accent hover:bg-accent/90 text-accent-foreground min-h-[48px] min-w-[200px] rounded-2xl shadow-lg"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Créer une histoire
              </Button>
              <Button
                onClick={() => setCurrentView("profiles")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[48px] min-w-[200px] rounded-2xl shadow-lg"
              >
                <Users className="h-5 w-5 mr-2" />
                Gérer les enfants
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
            onUpdateChild={handleUpdateChild}
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