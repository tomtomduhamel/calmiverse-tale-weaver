
import React, { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X } from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";

interface TeddyPhotoUploadProps {
  childId: string;
  existingPhotos: { url: string; path: string }[];
  onPhotoUploaded: (photo: { url: string; path: string; uploadedAt: Date }) => void;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET_NAME = "teddy-photos";

const SupabaseTeddyPhotoUpload: React.FC<TeddyPhotoUploadProps> = ({
  childId,
  existingPhotos,
  onPhotoUploaded,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { uploadFile } = useSupabaseStorage();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validations
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Type de fichier non supporté",
        description: "Veuillez utiliser des images JPG, PNG ou WebP",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximum est de 5MB",
        variant: "destructive",
      });
      return;
    }

    if (existingPhotos.length >= MAX_PHOTOS) {
      toast({
        title: "Limite atteinte",
        description: "Vous ne pouvez pas ajouter plus de 5 photos",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const userId = user?.id;
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour télécharger des photos",
        variant: "destructive",
      });
      return;
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${userId}/${childId}/${fileName}`;

    try {
      const result = await uploadFile(BUCKET_NAME, filePath, file, (progress) => {
        setUploadProgress(progress);
      });

      onPhotoUploaded({
        url: result.url,
        path: result.path,
        uploadedAt: new Date(),
      });
    } catch (error) {
      console.error("Erreur d'upload:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant l'upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [childId, existingPhotos.length, onPhotoUploaded, toast, uploadFile, user]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {existingPhotos.length}/{MAX_PHOTOS} photos
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading || existingPhotos.length >= MAX_PHOTOS}
          onClick={() => document.getElementById("photo-upload")?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Ajouter une photo
        </Button>
      </div>

      <input
        type="file"
        id="photo-upload"
        className="hidden"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileUpload}
        disabled={isUploading || existingPhotos.length >= MAX_PHOTOS}
      />

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground text-center">
            Upload en cours... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default SupabaseTeddyPhotoUpload;
