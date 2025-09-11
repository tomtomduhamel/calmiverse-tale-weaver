
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseChildren } from '@/hooks/useSupabaseChildren';
import { Child } from '@/types/child';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Book } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SimpleLoader } from '@/components/ui/SimpleLoader';
import ChildForm from '@/components/children/ChildForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { calculateAge } from '@/utils/age';

const KidsProfile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { children, loading, handleUpdateChild } = useSupabaseChildren();
  const [child, setChild] = useState<Child | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier si profileId existe
    if (!profileId) {
      toast({
        title: "Profil introuvable",
        description: "Aucun identifiant de profil fourni",
        variant: "destructive"
      });
      navigate('/children');
      return;
    }

    if (!loading && children.length > 0) {
      const foundChild = children.find(c => c.id === profileId);
      if (foundChild) {
        setChild(foundChild);
      } else {
        toast({
          title: "Profil introuvable",
          description: "Le profil demandé n'existe pas ou vous n'avez pas les permissions nécessaires",
          variant: "destructive"
        });
        navigate('/children');
      }
    } else if (!loading && children.length === 0) {
      // Aucun enfant trouvé pour cet utilisateur
      toast({
        title: "Aucun profil",
        description: "Vous n'avez pas encore créé de profil d'enfant",
        variant: "destructive"
      });
      navigate('/children');
    }
  }, [children, loading, profileId, navigate, toast]);

  const handleSaveProfile = async (updatedChild: Child) => {
    try {
      // Make sure to pass both arguments to handleUpdateChild
      await handleUpdateChild(updatedChild.id, updatedChild);
      setChild(updatedChild); // Met à jour l'état local
      setIsEditing(false);
      toast({
        title: "Profil mis à jour",
        description: "Le profil a été modifié avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    navigate('/children');
  };

  const handleCreateStory = () => {
    // Navigation vers la nouvelle route avec enfant présélectionné
    console.log('[KidsProfile] Navigation vers création d\'histoire avec enfant:', child?.id);
    navigate(`/create-story/step-1?childId=${child?.id}`);
  };

  if (loading || !child) {
    return <SimpleLoader />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux profils
        </Button>
        <h1 className="text-3xl font-bold">{isEditing ? 'Modifier le profil' : 'Profil de ' + child.name}</h1>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Modifier le profil de {child.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChildForm 
              initialValues={child}
              onSubmit={handleSaveProfile}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Informations générales</CardTitle>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-muted-foreground">Nom</h3>
                <p className="text-xl">{child.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Âge</h3>
                <p>
                  {calculateAge(new Date(child.birthDate))} ans
                  (né{child.gender === 'girl' ? 'e' : ''} le {format(new Date(child.birthDate), 'dd MMMM yyyy', { locale: fr })})
                </p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Genre</h3>
                <p>
                  {child.gender === 'boy' ? 'Garçon' : 
                   child.gender === 'girl' ? 'Fille' : 'Animal de compagnie'}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Doudou préféré</h3>
                <p>{child.teddyName || 'Non spécifié'}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Monde imaginaire</h3>
                <p>{child.imaginaryWorld || 'Non spécifié'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateStory} className="w-full sm:w-auto">
                <Book className="h-4 w-4 mr-2" />
                Créer une histoire avec {child.name}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default KidsProfile;
