
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Settings, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Story, StorySettings } from "@/types/story";
import { useStorySettings } from "@/hooks/story/useStorySettings";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface StorySettingsDialogProps {
  story: Story;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  onRegenerateStory?: (storyId: string, settings: StorySettings) => Promise<boolean>;
}

// Schéma de validation pour le formulaire
const formSchema = z.object({
  characters: z.array(
    z.object({
      name: z.string().min(1, "Le nom est requis"),
      description: z.string().min(1, "La description est requise"),
    })
  ).min(1, "Au moins un personnage est requis"),
  locations: z.array(
    z.object({
      name: z.string().min(1, "Le nom est requis"),
      description: z.string().min(1, "La description est requise"),
    })
  ).min(1, "Au moins un lieu est requis"),
  atmosphere: z.string().min(3, "L'ambiance est requise"),
  theme: z.string().min(3, "Le thème est requis"),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const StorySettingsDialog: React.FC<StorySettingsDialogProps> = ({
  story,
  showSettings,
  setShowSettings,
  onRegenerateStory
}) => {
  const { extractSettingsFromStory, isLoading } = useStorySettings();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();
  
  // Extraire les paramètres de l'histoire
  const initialSettings = extractSettingsFromStory(story);
  
  // Configuration du formulaire avec les valeurs initiales
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      characters: initialSettings.characters.length > 0 
        ? initialSettings.characters 
        : [{ name: "", description: "" }],
      locations: initialSettings.locations.length > 0 
        ? initialSettings.locations 
        : [{ name: "", description: "" }],
      atmosphere: initialSettings.atmosphere || "",
      theme: initialSettings.theme || "",
      additionalNotes: initialSettings.additionalNotes || "",
    }
  });
  
  // Ajouter un personnage
  const addCharacter = () => {
    const currentCharacters = form.getValues("characters");
    form.setValue("characters", [...currentCharacters, { name: "", description: "" }]);
  };
  
  // Supprimer un personnage
  const removeCharacter = (index: number) => {
    const currentCharacters = form.getValues("characters");
    if (currentCharacters.length > 1) {
      form.setValue("characters", currentCharacters.filter((_, i) => i !== index));
    }
  };
  
  // Ajouter un lieu
  const addLocation = () => {
    const currentLocations = form.getValues("locations");
    form.setValue("locations", [...currentLocations, { name: "", description: "" }]);
  };
  
  // Supprimer un lieu
  const removeLocation = (index: number) => {
    const currentLocations = form.getValues("locations");
    if (currentLocations.length > 1) {
      form.setValue("locations", currentLocations.filter((_, i) => i !== index));
    }
  };
  
  // Soumettre le formulaire
  const onSubmit = async (values: FormValues) => {
    console.log("Paramètres d'histoire soumis:", values);
    
    try {
      setIsRegenerating(true);
      
      if (onRegenerateStory) {
        const success = await onRegenerateStory(story.id, values as StorySettings);
        
        if (success) {
          toast({
            title: "Histoire en cours de régénération",
            description: "Votre histoire est en cours de régénération avec les nouveaux paramètres.",
          });
          setShowSettings(false);
        } else {
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la régénération de l'histoire.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la régénération:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la régénération de l'histoire.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-[650px] animate-fade-in max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de l'histoire
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Analyse de l'histoire en cours...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Section des personnages */}
              <div>
                <h3 className="text-lg font-medium mb-2">Personnages</h3>
                <Separator className="mb-4" />
                
                {form.watch("characters").map((_, index) => (
                  <div key={`character-${index}`} className="mb-6 p-4 border rounded-md bg-secondary/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Personnage {index + 1}</h4>
                      {form.watch("characters").length > 1 && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeCharacter(index)}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`characters.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du personnage" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`characters.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Décrivez ce personnage" 
                              rows={2} 
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addCharacter}
                  className="mt-2"
                >
                  Ajouter un personnage
                </Button>
              </div>
              
              {/* Section des lieux */}
              <div>
                <h3 className="text-lg font-medium mb-2">Lieux</h3>
                <Separator className="mb-4" />
                
                {form.watch("locations").map((_, index) => (
                  <div key={`location-${index}`} className="mb-6 p-4 border rounded-md bg-secondary/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Lieu {index + 1}</h4>
                      {form.watch("locations").length > 1 && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeLocation(index)}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`locations.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du lieu" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`locations.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Décrivez ce lieu" 
                              rows={2} 
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addLocation}
                  className="mt-2"
                >
                  Ajouter un lieu
                </Button>
              </div>
              
              {/* Ambiance */}
              <div>
                <h3 className="text-lg font-medium mb-2">Ambiance et thème</h3>
                <Separator className="mb-4" />
                
                <FormField
                  control={form.control}
                  name="atmosphere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ambiance générale</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: joyeuse, mystérieuse, effrayante..." {...field} />
                      </FormControl>
                      <FormDescription>
                        L'ambiance globale de l'histoire
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Thème principal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: amitié, aventure, apprentissage..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Le thème central de l'histoire
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Notes additionnelles */}
              <div>
                <h3 className="text-lg font-medium mb-2">Notes additionnelles</h3>
                <Separator className="mb-4" />
                
                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes pour la régénération</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ajoutez des détails supplémentaires pour guider la régénération de l'histoire..." 
                          rows={3} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Toute information supplémentaire que vous souhaitez inclure dans la régénération
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                >
                  Annuler
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="default" 
                      className="gap-2"
                      disabled={isRegenerating}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                      {isRegenerating ? "Régénération en cours..." : "Régénérer l'histoire"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Régénérer l'histoire</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir régénérer cette histoire avec les nouveaux paramètres ? 
                        Cette action remplacera l'histoire actuelle.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isRegenerating}
                        onClick={() => form.handleSubmit(onSubmit)()}
                      >
                        {isRegenerating ? "Régénération..." : "Confirmer"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
