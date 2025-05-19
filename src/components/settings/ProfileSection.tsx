
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Clock, Save } from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { useToast } from '@/hooks/use-toast';

// Schéma de validation amélioré
const userFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
});

interface ProfileSectionProps {
  userSettings: UserSettings;
  onSubmit: (data: Partial<UserSettings>) => Promise<void>;
}

export const ProfileSection = ({ userSettings, onSubmit }: ProfileSectionProps) => {
  const { toast } = useToast();
  const userForm = useForm<UserSettings>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      ...userSettings
    },
  });

  // Mettre à jour le formulaire lorsque userSettings change
  useEffect(() => {
    if (userSettings) {
      userForm.reset({
        firstName: userSettings.firstName || '',
        lastName: userSettings.lastName || '',
        ...userSettings
      });
    }
  }, [userSettings, userForm]);

  const handleSubmit = async (data: UserSettings) => {
    try {
      console.log('Soumission du formulaire avec données:', data);
      
      // Vérifier que les valeurs ne sont pas vides
      if (!data.firstName.trim() || !data.lastName.trim()) {
        toast({
          title: "Validation",
          description: "Le prénom et le nom sont requis",
          variant: "destructive",
        });
        return;
      }
      
      await onSubmit({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim()
      });
      
      toast({
        title: "Succès",
        description: "Vos paramètres ont été mis à jour",
      });
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profil
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...userForm}>
          <form onSubmit={userForm.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={userForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={userForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-2">
              <label className="text-sm font-medium">Fuseau horaire</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {userSettings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                </span>
              </div>
            </div>
            <Button type="submit" className="flex gap-2 items-center">
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
