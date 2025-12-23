import React from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

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
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        {/* Overlay sombre */}
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        
        {/* Conteneur de l'image - utilise TOUTE la zone disponible */}
        <DialogPrimitive.Content 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onPointerDownOutside={onClose}
        >
          {/* Bouton fermeture - en haut à droite de l'écran */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 z-50 rounded-full p-2 shadow-lg transition-colors ${
              isDarkMode 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-white/90 text-gray-900 hover:bg-white'
            }`}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image - s'adapte naturellement à l'espace disponible */}
          <img
            src={imageUrl}
            alt={`Illustration agrandie de ${title}`}
            className="max-w-[92vw] max-h-[92vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              console.error('Erreur de chargement de l\'image:', imageUrl);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
