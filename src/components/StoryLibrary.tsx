import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trash2, 
  Edit2, 
  Check, 
  BookOpen, 
  PlusCircle, 
  Search, 
  Filter, 
  Star, 
  Eye, 
  Tag 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Story {
  id: string;
  title: string;
  preview: string;
  objective: string;
  createdAt: Date;
  status: 'pending' | 'completed';
  story_text?: string;
  story_summary?: string;
  isFavorite?: boolean;
  tags?: string[];
}

interface StoryLibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory?: (storyId: string) => void;
  onViewChange?: (view: "create") => void;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ 
  stories, 
  onSelectStory,
  onDeleteStory,
  onViewChange 
}) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isZenMode, setIsZenMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const storiesPerPage = 6;

  const handleDelete = (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    if (onDeleteStory) {
      onDeleteStory(storyId);
      toast({
        title: "Histoire supprimée",
        description: "L'histoire a été supprimée avec succès",
      });
    }
  };

  const handleCardClick = (story: Story) => {
    if (story.status === 'completed') {
      onSelectStory(story);
    }
  };

  const startEditing = (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    setEditingId(story.id);
    setEditingTitle(story.title);
  };

  const saveTitle = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    try {
      const storyRef = doc(db, "stories", storyId);
      await updateDoc(storyRef, {
        title: editingTitle
      });

      toast({
        title: "Titre mis à jour",
        description: "Le titre de l'histoire a été modifié avec succès",
      });
      
      setEditingId(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le titre",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    try {
      const storyRef = doc(db, "stories", story.id);
      await updateDoc(storyRef, {
        isFavorite: !story.isFavorite
      });
      toast({
        title: story.isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
        description: "Mise à jour effectuée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les favoris",
        variant: "destructive",
      });
    }
  };

  const filteredStories = stories
    .filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          story.preview.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const indexOfLastStory = currentPage * storiesPerPage;
  const indexOfFirstStory = indexOfLastStory - storiesPerPage;
  const currentStories = filteredStories.slice(indexOfFirstStory, indexOfLastStory);
  const totalPages = Math.ceil(filteredStories.length / storiesPerPage);

  return (
    <div className={`space-y-6 p-4 transition-all duration-300 ${isZenMode ? 'bg-neutral-50' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Bibliothèque des histoires</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsZenMode(!isZenMode)}
            className={`${isZenMode ? 'bg-primary text-white' : ''}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onViewChange?.("create")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Créer une histoire
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher une histoire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-4 py-2 border rounded-md bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En cours</option>
          <option value="completed">Terminées</option>
        </select>
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentStories.map((story) => (
            <Card 
              key={story.id} 
              className={`
                p-4 transition-all duration-300 relative cursor-pointer
                bg-gradient-to-br from-card-start to-card-end
                hover:from-card-hover-start hover:to-card-hover-end
                shadow-soft hover:shadow-soft-lg animate-fade-in
                ${story.status === 'completed' ? 'hover:scale-105 active:scale-98' : ''}
              `}
              onClick={() => handleCardClick(story)}
            >
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`text-yellow-500 hover:text-yellow-600 bg-white/80 hover:bg-white/90 ${
                    story.isFavorite ? 'text-yellow-500' : 'text-gray-400'
                  }`}
                  onClick={(e) => toggleFavorite(e, story)}
                >
                  <Star className="h-4 w-4" fill={story.isFavorite ? "currentColor" : "none"} />
                </Button>
                {editingId === story.id ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:text-primary/90 bg-white/80 hover:bg-white/90"
                    onClick={(e) => saveTitle(e, story.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-secondary hover:text-secondary/90 bg-white/80 hover:bg-white/90"
                    onClick={(e) => startEditing(e, story)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-secondary hover:text-destructive bg-white/80 hover:bg-white/90"
                  onClick={(e) => handleDelete(e, story.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {editingId === story.id ? (
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="mb-2 font-semibold"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <h3 className="text-lg font-semibold mb-2 text-secondary-dark">
                  {story.title}
                </h3>
              )}

              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {story.preview}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-secondary/20 text-secondary-dark px-2 py-1 rounded-full">
                  {story.objective}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  story.status === 'pending' 
                    ? 'bg-yellow-200 text-yellow-800' 
                    : 'bg-green-200 text-green-800'
                }`}>
                  {story.status === 'pending' ? 'En cours' : 'Terminée'}
                </span>
                {story.tags?.map((tag, index) => (
                  <span key={index} className="text-xs bg-accent/20 text-accent-dark px-2 py-1 rounded-full flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Créée le {format(story.createdAt, "d MMMM yyyy", { locale: fr })}
              </p>
              
              {story.status === 'completed' && (
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Lire l'histoire complète
                </Button>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryLibrary;