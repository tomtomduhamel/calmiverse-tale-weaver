import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface TeddyPhotoGalleryProps {
  photos: { url: string; path: string }[];
  onDeletePhoto: (path: string) => void;
}

const TeddyPhotoGallery: React.FC<TeddyPhotoGalleryProps> = ({ photos, onDeletePhoto }) => {
  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div key={photo.path} className="relative group">
          <AspectRatio ratio={1}>
            <img
              src={photo.url}
              alt="Photo du doudou"
              className="w-full h-full object-cover rounded-lg"
            />
          </AspectRatio>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDeletePhoto(photo.path)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default TeddyPhotoGallery;