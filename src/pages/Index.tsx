import React, { useState, useEffect } from "react";
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
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

  // Charger les enfants depuis Firestore au démarrage
  useEffect(() => {
    const loadChildren = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'children'));
        const loadedChildren = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Child[];
        setChildren(loadedChildren);
      } catch (error) {
        console.error("Erreur lors du chargement des enfants:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les profils des enfants",
          variant: "destructive",
        });
      }
    };

    loadChildren();
  }, [toast]);

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

  const handleDeleteStory = (storyId: string) => {
    setStories((prevStories) => prevStories.filter((story) => story.id !== storyId));
  };

  const handleAddChild = async (childData: Omit<Child, "id">) => {
    try {
      const docRef = await addDoc(collection(db, 'children'), childData);
      const newChild: Child = {
        ...childData,
        id: docRef.id,
      };
      setChildren(prev => [...prev, newChild]);
      toast({
        title: "Succès",
        description: "Le profil a été ajouté avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'enfant:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le profil",
        variant: "destructive",
      });
    }
  };

  const handleUpdateChild = async (childId: string, updatedData: Omit<Child, "id">) => {
    try {
      const childRef = doc(db, 'children', childId);
      await updateDoc(childRef, updatedData);
      setChildren(prev => prev.map(child => 
        child.id === childId ? { ...updatedData, id: childId } : child
      ));
      toast({
        title: "Succès",
        description: "Le profil a été mis à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'enfant:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await deleteDoc(doc(db, 'children', childId));
      setChildren(prev => prev.filter(child => child.id !== childId));
      toast({
        title: "Succès",
        description: "Le profil a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'enfant:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le profil",
        variant: "destructive",
      });
    }
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