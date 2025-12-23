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
      <DialogContent className={`max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-visible border-0 ${
        isDarkMode ? 'bg-transparent' : 'bg-transparent'
      }`}>
        <div className="relative flex items-center justify-center">
          {/* Bouton de fermeture */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={`absolute -top-2 -right-2 z-10 rounded-full ${
              isDarkMode 
                ? 'bg-black/70 text-white hover:bg-black/90' 
                : 'bg-white/90 text-gray-900 hover:bg-white'
            } shadow-lg`}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Image agrandie - utilise width/height auto pour respecter les proportions */}
          <img
            src={imageUrl}
            alt={`Illustration agrandie de ${title}`}
            className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            style={{ aspectRatio: 'auto' }}
            onError={(e) => {
              console.error('Erreur de chargement de l\'image:', imageUrl);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};