import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { SendHorizontal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Story } from "@/types/story";

interface SendToEreaderProps {
  storyText: string;
  title: string;
  story: Story;
}

export const SendToEreader: React.FC<SendToEreaderProps> = ({ storyText, title, story }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateEpub = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2em; }
            h1 { color: #333; text-align: center; }
            .metadata { color: #666; font-size: 0.9em; margin: 1em 0; }
            .story { margin-top: 2em; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="metadata">
            <p>Date de création: ${story.createdAt.toLocaleDateString()}</p>
            <p>Objectif: ${story.objective}</p>
          </div>
          <div class="story">
            ${storyText.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
          </div>
        </body>
      </html>
    `;

    return new Blob([htmlContent], { type: 'text/html' });
  };

  const handleGenerateAndUpload = async () => {
    try {
      setIsLoading(true);
      console.log("Début de la génération de l'EPUB...");

      // Générer l'EPUB
      const epubBlob = await generateEpub();
      console.log("EPUB généré avec succès");

      // Upload vers Firebase Storage
      const storage = getStorage();
      const epubRef = ref(storage, `stories/${story.id}.html`);
      await uploadBytes(epubRef, epubBlob);
      console.log("EPUB uploadé vers Storage");

      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(epubRef);
      console.log("URL de téléchargement obtenue:", downloadURL);

      // Mettre à jour Firestore
      const storyRef = doc(db, 'stories', story.id);
      await updateDoc(storyRef, {
        epubFile: downloadURL
      });
      console.log("Document Firestore mis à jour");

      toast({
        title: "Succès",
        description: "Le fichier EPUB a été généré et sauvegardé",
      });
    } catch (error) {
      console.error("Erreur lors de la génération/upload:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du fichier",
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
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <SendHorizontal className="h-4 w-4" />
      )}
    </Button>
  );
};