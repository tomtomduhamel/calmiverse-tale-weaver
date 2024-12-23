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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Child } from "@/types/child";
import type { ViewType } from "@/types/views";
import { getChildren, addChild, updateChild, deleteChild } from "@/lib/firebase-utils";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [currentStory, setCurrentStory] = useState<string>("");
  const [stories] = useState([
    {
      id: "1",
      title: "L'aventure magique",
      preview: "Une histoire enchantée pour les petits rêveurs...",
      theme: "magic",
      objective: "sleep",
    },
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch children data
  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => getChildren(),
  });

  // Mutations for children CRUD operations
  const addChildMutation = useMutation({
    mutationFn: (childData: Omit<Child, "id">) => addChild(childData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast({
        title: "Succès",
        description: "Le profil a été ajouté avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du profil",
        variant: "destructive",
      });
      console.error("Error adding child:", error);
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: ({ childId, data }: { childId: string; data: Omit<Child, "id"> }) =>
      updateChild(childId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast({
        title: "Succès",
        description: "Le profil a été mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      });
      console.error("Error updating child:", error);
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: deleteChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast({
        title: "Succès",
        description: "Le profil a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du profil",
        variant: "destructive",
      });
      console.error("Error deleting child:", error);
    },
  });

  const handleCreateStory = async (formData: StoryFormData) => {
    try {
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name).join(" et ");
      
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

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-serene w-full">
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <img 
              src="/lovable-uploads/08b9555a-5430-4317-9aa0-2652884e8414.png" 
              alt="Calmi Logo" 
              className="h-8 w-auto"
            />
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
                  onCreateChild={() => setCurrentView("profiles")}
                />
              </div>
            )}

            {currentView === "profiles" && (
              <ChildrenProfiles
                children={children}
                onAddChild={(childData) => addChildMutation.mutate(childData)}
                onUpdateChild={(childId, data) => updateChildMutation.mutate({ childId, data })}
                onDeleteChild={(childId) => deleteChildMutation.mutate(childId)}
              />
            )}

            {currentView === "library" && (
              <StoryLibrary
                stories={stories}
                onSelectStory={(story) => {
                  setCurrentStory(story.preview);
                  setCurrentView("reader");
                }}
                onDeleteStory={() => {
                  toast({
                    title: "Information",
                    description: "La suppression d'histoires n'est pas encore implémentée",
                  });
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
      </div>
    </SidebarProvider>
  );
};

export default Index;