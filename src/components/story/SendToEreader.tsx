import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useKindleSettings } from "@/hooks/useKindleSettings";
import { useNavigate } from "react-router-dom";
import { generateEpub, uploadEpubToStorage } from '@/services/epubService';
import { Progress } from "@/components/ui/progress";
import type { Story } from "@/types/story";

interface SendToEreaderProps {
  storyText: string;
  title: string;
  story: Story;
}

export const SendToEreader: React.FC<SendToEreaderProps> = ({ storyText, title, story }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { settings, isConfigured } = useKindleSettings();
  const navigate = useNavigate();

  const handleSendToDevice = async () => {
    if (selectedDevice === "kindle" && !isConfigured) {
      toast({
        title: "Configuration requise",
        description: "Veuillez configurer votre email Kindle dans les paramètres.",
        variant: "destructive",
      });
      setIsOpen(false);
      navigate("/settings");
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(10);

      // Générer l'EPUB
      const epubBlob = await generateEpub(story);
      setProgress(50);

      // Uploader vers Firebase Storage
      const downloadURL = await uploadEpubToStorage(story.id, epubBlob);
      setProgress(90);

      console.log("EPUB généré et uploadé:", {
        device: selectedDevice,
        kindleEmail: settings.kindleEmail,
        title,
        downloadURL
      });
      
      toast({
        title: "Génération réussie",
        description: "Le fichier EPUB a été généré et sauvegardé avec succès.",
      });
      
      setProgress(100);
      setIsGenerating(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Erreur lors de la génération de l'EPUB:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du fichier EPUB.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="transition-transform hover:scale-105"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Envoyer vers une liseuse</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isGenerating && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Génération en cours...</p>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sélectionnez votre liseuse</label>
            <Select
              value={selectedDevice}
              onValueChange={setSelectedDevice}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une liseuse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kindle">Amazon Kindle</SelectItem>
                <SelectItem value="kobo">Kobo</SelectItem>
                <SelectItem value="pocketbook">PocketBook</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSendToDevice}
            disabled={!selectedDevice || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              "Génération en cours..."
            ) : (
              <>
                <SendHorizontal className="mr-2 h-4 w-4" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};