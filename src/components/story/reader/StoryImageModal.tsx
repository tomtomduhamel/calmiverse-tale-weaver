import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  isDarkMode?: boolean;
}

export const StoryImageModal: React.FC<StoryImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  isDarkMode = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl w-full p-0 overflow-hidden ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'
      }`}>
        <div className="relative">
          {/* Bouton de fermeture */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={`absolute top-4 right-4 z-10 rounded-full ${
              isDarkMode 
                ? 'bg-black/50 text-white hover:bg-black/70' 
                : 'bg-white/80 text-gray-900 hover:bg-white/90'
            }`}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Image agrandie */}
          <div className="flex items-center justify-center p-6">
            <img
              src={imageUrl}
              alt={`Illustration agrandie de ${title}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
              onError={(e) => {
                console.error('Erreur de chargement de l\'image:', imageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};