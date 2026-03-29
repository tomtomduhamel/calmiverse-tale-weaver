import React, { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  Pause,
  Upload,
  Loader2,
  Music,
  FileAudio,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminGuard from "@/components/admin/AdminGuard";

const OBJECTIVE_OPTIONS = [
  { value: "sleep", label: "🌙 Sommeil" },
  { value: "focus", label: "🧠 Concentration" },
  { value: "relax", label: "🌸 Détente" },
  { value: "fun", label: "🎉 Amusement" },
  { value: "custom", label: "⚡ Histoires rapides" },
];

interface SoundBackground {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  objective: string;
  duration: number;
  created_at: string;
}

// ─── Inline Audio Player ─────────────────────────────────────────────────────

const InlinePlayer: React.FC<{ filePath: string }> = ({ filePath }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const publicUrl = supabase.storage
    .from("story_sounds")
    .getPublicUrl(filePath).data.publicUrl;

  const toggle = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(publicUrl);
      audio.addEventListener("ended", () => setPlaying(false));
      audioRef.current = audio;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing, publicUrl]);

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8">
      {playing ? (
        <Pause className="h-4 w-4 text-primary" />
      ) : (
        <Play className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
};

// ─── Add Sound Dialog ────────────────────────────────────────────────────────

const AddSoundDialog: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("sleep");
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setObjective("sleep");
    setDetectedDuration(null);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setUploadError("Titre et fichier sont requis");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Upload to bucket — flat path (no subdirectory)
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const safeName = title.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
      const storagePath = `${Date.now()}_${safeName}.${ext}`;

      console.log('[SoundAdmin] Uploading:', { storagePath, size: file.size, type: file.type });

      const { data: uploadData, error: storageError } = await supabase.storage
        .from("story_sounds")
        .upload(storagePath, file, {
          contentType: file.type || 'audio/mpeg',
          upsert: false,
        });

      if (storageError) {
        console.error('[SoundAdmin] Storage upload error:', storageError);
        throw new Error(`Storage upload: ${storageError.message}. Vérifiez les policies du bucket "story_sounds" dans Supabase.`);
      }

      console.log('[SoundAdmin] Upload success:', uploadData);

      // 2. Insert row in sound_backgrounds
      const { error: insertError } = await supabase
        .from("sound_backgrounds")
        .insert({
          title,
          description: description || null,
          file_path: storagePath,
          objective,
          duration: detectedDuration || 0,
        });

      if (insertError) {
        // Rollback: remove uploaded file
        await supabase.storage.from("story_sounds").remove([storagePath]);
        console.error('[SoundAdmin] DB insert error:', insertError);
        throw new Error(`Insert DB: ${insertError.message}. Vérifiez les RLS policies de la table "sound_backgrounds".`);
      }

      toast({ title: "✅ Musique ajoutée", description: title });
      reset();
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error("[SoundAdmin] Error:", err);
      setUploadError(err.message || "Erreur inconnue");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setUploadError(null); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Ajouter une musique
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Nouvelle musique de fond
          </DialogTitle>
        </DialogHeader>

        {/* ─── Inline error banner ─── */}
        {uploadError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-semibold mb-1">❌ Erreur</p>
            <p className="break-words">{uploadError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* File */}
          <div className="space-y-1.5">
            <Label htmlFor="sound-file">Fichier audio</Label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="sound-file"
                className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-3 w-full hover:bg-muted/50 transition-colors"
              >
                {file ? (
                  <>
                    <FileAudio className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {(file.size / 1024 / 1024).toFixed(1)} Mo
                      {detectedDuration !== null && ` · ${Math.floor(detectedDuration / 60)}:${Math.floor(detectedDuration % 60).toString().padStart(2, '0')}`}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Sélectionner un .mp3, .wav ou .ogg
                    </span>
                  </>
                )}
              </label>
              <input
                id="sound-file"
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3,.mp3,.wav,.ogg"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  setFile(selectedFile);
                  setDetectedDuration(null);
                  // Auto-detect duration
                  if (selectedFile) {
                    const tempAudio = new Audio();
                    tempAudio.addEventListener('loadedmetadata', () => {
                      if (isFinite(tempAudio.duration)) {
                        setDetectedDuration(Math.round(tempAudio.duration));
                      }
                      URL.revokeObjectURL(tempAudio.src);
                    });
                    tempAudio.addEventListener('error', () => {
                      console.warn('[SoundAdmin] Could not detect duration');
                      URL.revokeObjectURL(tempAudio.src);
                    });
                    tempAudio.src = URL.createObjectURL(selectedFile);
                  }
                }}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="sound-title">Titre</Label>
            <Input
              id="sound-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Nuit étoilée"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="sound-desc">Description (optionnel)</Label>
            <Textarea
              id="sound-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ambiance douce avec grillons..."
              rows={2}
            />
          </div>

          {/* Objective */}
          <div className="space-y-1.5" ref={dialogRef}>
            <Label>Objectif</Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[200]">
                {OBJECTIVE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={uploading || !file || !title}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Uploader et enregistrer
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main SoundAdmin Page ────────────────────────────────────────────────────

const SoundAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all sounds
  const { data: sounds, isLoading } = useQuery({
    queryKey: ["admin-sound-backgrounds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sound_backgrounds")
        .select("*")
        .order("objective")
        .order("title");
      if (error) throw error;
      return data as SoundBackground[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (sound: SoundBackground) => {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from("story_sounds")
        .remove([sound.file_path]);
      if (storageError) {
        console.warn("[SoundAdmin] Storage delete warn:", storageError);
      }

      // 2. Delete from DB
      const { error: dbError } = await supabase
        .from("sound_backgrounds")
        .delete()
        .eq("id", sound.id);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sound-backgrounds"] });
      toast({ title: "🗑️ Musique supprimée" });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-sound-backgrounds"] });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getObjectiveLabel = (value: string) =>
    OBJECTIVE_OPTIONS.find((o) => o.value === value)?.label || value;

  return (
    <AdminGuard>
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              🎵 Musiques de fond
            </h1>
            <p className="text-sm text-muted-foreground">
              Gérer les musiques d'ambiance associées aux histoires
            </p>
          </div>
          <AddSoundDialog onSuccess={handleRefresh} />
        </div>

        {/* Content */}
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Chargement...
            </div>
          ) : !sounds?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Music className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Aucune musique de fond pour le moment</p>
              <p className="text-xs mt-1">
                Cliquez sur "Ajouter une musique" pour commencer
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Description
                    </TableHead>
                    <TableHead>Objectif</TableHead>
                    <TableHead className="text-right">Durée</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sounds.map((sound) => (
                    <TableRow key={sound.id}>
                      <TableCell>
                        <InlinePlayer filePath={sound.file_path} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {sound.title}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                        {sound.description || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getObjectiveLabel(sound.objective)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatDuration(sound.duration)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteMutation.mutate(sound)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Stats footer */}
        {sounds && sounds.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{sounds.length} musique{sounds.length > 1 ? "s" : ""}</span>
            <div className="flex gap-3">
              {OBJECTIVE_OPTIONS.map((opt) => {
                const count = sounds.filter(
                  (s) => s.objective === opt.value
                ).length;
                return count > 0 ? (
                  <span key={opt.value}>
                    {opt.label.split(" ")[0]} {count}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
};

export default SoundAdmin;
