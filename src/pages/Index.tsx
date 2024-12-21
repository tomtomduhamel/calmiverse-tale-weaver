import React, { useState } from "react";
import StoryForm, { StoryFormData } from "@/components/StoryForm";
import StoryReader from "@/components/StoryReader";
import StoryLibrary from "@/components/StoryLibrary";
import ChildrenProfiles from "@/components/ChildrenProfiles";
import { useToast } from "@/hooks/use-toast";
import MobileMenu from "@/components/MobileMenu";
import HomeHero from "@/components/home/HomeHero";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Link } from "react-router-dom";
import type { Child } from "@/types/child";
import type { ViewType } from "@/types/views";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>("home");
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

  const handleCreateChildFromStory = () => {
    setCurrentView("profiles");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-serene w-full">
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2" onClick={() => setCurrentView("home")}>
              <img 
                src="/lovable-uploads/08b9555a-5430-4317-9aa0-2652884e8414.png" 
                alt="Calmi Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold text-secondary">Calmi</span>
            </Link>
            <MobileMenu currentView={currentView} onViewChange={setCurrentView} />
          </div>
        </header>

        <div className="flex w-full">
          <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
          <main className="flex-1 max-w-7xl mx-auto p-6 pt-24">
            {currentView === "home" && (
              <HomeHero onViewChange={setCurrentView} />
            )}

            {currentView === "create" && (
              <div className="max-w-md mx-auto">
                <StoryForm 
                  onSubmit={handleCreateStory} 
                  children={children} 
                  onCreateChild={handleCreateChildFromStory}
                />
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
      </div>
    </SidebarProvider>
  );
};

export default Index;
