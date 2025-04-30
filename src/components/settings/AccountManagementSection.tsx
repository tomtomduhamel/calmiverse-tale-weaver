
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const AccountManagementSection = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      
      if (!user) return;
      
      // 1. Supprimer les données de l'utilisateur
      const { error: deleteChildrenError } = await supabase
        .from('children')
        .delete()
        .eq('authorid', user.id);
        
      if (deleteChildrenError) throw deleteChildrenError;
      
      const { error: deleteStoriesError } = await supabase
        .from('stories')
        .delete()
        .eq('authorid', user.id);
        
      if (deleteStoriesError) throw deleteStoriesError;
      
      const { error: deleteUserDataError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
        
      if (deleteUserDataError) throw deleteUserDataError;
      
      // 2. Supprimer le compte utilisateur via RPC
      // Cette fonction RPC ne prend pas de paramètres, elle utilisera auth.uid() en interne
      // Mais l'API Supabase nécessite un objet de paramètres, même s'il est vide
      const { error: deleteUserError } = await supabase.rpc('delete_user');
      
      if (deleteUserError) throw deleteUserError;
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés.",
      });
      
      // Rediriger vers la page d'accueil
      navigate('/');
      
    } catch (error: any) {
      console.error("Erreur lors de la suppression du compte:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer votre compte: " + (error.message || "Erreur inconnue"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Gestion du compte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Supprimer mon compte
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer mon compte'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
