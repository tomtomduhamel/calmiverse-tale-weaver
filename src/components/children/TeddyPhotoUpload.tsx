import React, { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth } from "@/lib/firebase";

interface TeddyPhotoUploadProps {
  childId: string;
  existingPhotos: { url: string; path: string }[];
  onPhotoUploaded: (photo: { url: string; path: string; uploadedAt: Date }) => void;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const TeddyPhotoUpload: React.FC<TeddyPhotoUploadProps> = ({
  childId,
  existingPhotos,
  onPhotoUploaded,
}) => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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
    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour télécharger des photos",
        variant: "destructive",
      });
      return;
    }

    const fileName = `${Date.now()}-${file.name}`;
    const storagePath = `teddy-photos/${userId}/${childId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Erreur d'upload:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue pendant l'upload",
          variant: "destructive",
        });
        setIsUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onPhotoUploaded({
            url: downloadURL,
            path: storagePath,
            uploadedAt: new Date(),
          });
          toast({
            title: "Succès",
            description: "La photo a été téléchargée avec succès",
          });
        } catch (error) {
          console.error("Erreur lors de la récupération de l'URL:", error);
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la finalisation",
            variant: "destructive",
          });
        }
        setIsUploading(false);
        setUploadProgress(0);
      }
    );
  }, [childId, existingPhotos.length, onPhotoUploaded, toast]);

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

export default TeddyPhotoUpload;