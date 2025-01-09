import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { SendHorizontal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateAndUploadEpub } from '@/services/epubService';
import type { Story } from "@/types/story";

interface SendToEreaderProps {
  story: Story;
}

export const SendToEreader: React.FC<SendToEreaderProps> = ({ story }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateAndUpload = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      console.log("Début de la génération pour l'histoire:", story.title);
      
      const downloadURL = await generateAndUploadEpub(story);
      
      toast({
        title: "Succès !",
        description: "Le fichier a été généré et est prêt à être téléchargé.",
      });

      // Ouvrir le fichier dans un nouvel onglet
      window.open(downloadURL, '_blank');
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du fichier.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleGenerateAndUpload}
      disabled={isLoading}
      className="transition-transform hover:scale-105"
      title="Générer un fichier pour liseuse"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <SendHorizontal className="h-4 w-4" />
      )}
    </Button>
  );
};