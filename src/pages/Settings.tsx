import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useKindleSettings, KindleSettings } from '@/hooks/useKindleSettings';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  kindleEmail: z.string()
    .email("Format d'email invalide")
    .regex(/@kindle\.com$/, "L'email doit se terminer par @kindle.com")
});

const Settings = () => {
  const { settings, updateSettings } = useKindleSettings();
  const { toast } = useToast();

  const form = useForm<KindleSettings>({
    resolver: zodResolver(formSchema),
    defaultValues: settings,
    values: settings,
  });

  const onSubmit = async (data: KindleSettings) => {
    const result = await updateSettings(data);
    if (result.success) {
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres ont été mis à jour avec succès.",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres utilisateur</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Votre prénom" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Votre nom" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kindleEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Email Kindle
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Votre adresse email Kindle se termine par @kindle.com</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="votre.email@kindle.com" type="email" />
                </FormControl>
                <FormDescription>
                  Cette adresse sera utilisée pour envoyer les histoires sur votre Kindle
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Sauvegarder les paramètres
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default Settings;