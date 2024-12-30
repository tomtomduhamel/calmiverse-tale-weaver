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

interface SendToEreaderProps {
  storyText: string;
  title: string;
}

export const SendToEreader: React.FC<SendToEreaderProps> = ({ storyText, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  const { toast } = useToast();

  const handleSendToDevice = async () => {
    try {
      // Pour l'instant, simulons l'envoi
      console.log("Envoi de l'histoire vers la liseuse:", {
        device: selectedDevice,
        title,
        contentLength: storyText.length
      });
      
      toast({
        title: "Envoi en cours",
        description: "L'histoire est en cours d'envoi vers votre liseuse...",
      });
      
      // Simulons un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Envoi réussi",
        description: "L'histoire a été envoyée avec succès vers votre liseuse.",
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi vers la liseuse.",
        variant: "destructive",
      });
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Sélectionnez votre liseuse</label>
            <Select
              value={selectedDevice}
              onValueChange={setSelectedDevice}
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
            disabled={!selectedDevice}
            className="w-full"
          >
            <SendHorizontal className="mr-2 h-4 w-4" />
            Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};