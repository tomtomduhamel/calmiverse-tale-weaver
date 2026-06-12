import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Mic, Trash2, Copy, Plus, Volume2, Share2, Check, Loader2,
  Sparkles, Clock, ArrowLeft, Heart, Smartphone, HelpCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CustomVoice {
  id: string;
  name: string;
  relation: string;
  voice_ref_path: string;
  transcript: string | null;
  created_at: string;
}

export const VoiceStudio: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { limits, loading: limitsLoading } = useSubscription();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [voices, setVoices] = useState<CustomVoice[]>([]);
  const [activeTab, setActiveTab] = useState<'studio' | 'invitations'>('studio');

  // Recording State
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [relationName, setRelationName] = useState('');
  const [recordingStep, setRecordingStep] = useState<'info' | 'recording' | 'preview' | 'uploading'>('info');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  // MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioFormatRef = useRef<{ mimeType: string, ext: string }>({ mimeType: 'audio/webm', ext: 'webm' });

  // Distant Invitation State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteRelation, setInviteRelation] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Maximum allowed voice clones based on tier limits
  const maxClones = limits?.max_voice_clones ?? 0;
  const isSlotLimitReached = voices.length >= maxClones;

  // Guides transcripts depending on relationship
  const getTranscriptText = () => {
    const norm = relationName.trim().toLowerCase();
    if (norm.includes('maman') || norm.includes('mère')) {
      return "Ferme les yeux doucement mon petit ange, je suis tout près de toi. Les étoiles brillent dans la nuit pour veiller sur tes rêves les plus doux. Écoute ma voix te transporter vers un pays de nuages merveilleux ce soir...";
    }
    if (norm.includes('papa') || norm.includes('père')) {
      return "Mon trésor, installe-toi confortablement sous ta couette. Les étoiles brillent pour toi dans le ciel de Calmi. Écoute cette jolie histoire, laisse-toi bercer par mes paroles et fais de beaux rêves paisibles...";
    }
    if (norm.includes('papy') || norm.includes('grand-père') || norm.includes('mamie') || norm.includes('grand-mère')) {
      return "Coucou mon chéri, installe-toi bien chaudement. Papy et Mamie sont là pour te faire voyager dans un monde plein de magie et d'aventures ce soir. Laisse mon histoire t'envelopper comme un doux câlin...";
    }
    return "Bienvenue dans Calmi, je m'apprête à te raconter une histoire merveilleuse pour t'endormir paisiblement. Respire calmement, écoute ma voix t'emmener dans les étoiles, et laisse tes rêves s'envoler doucement...";
  };

  const fetchVoices = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_voices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVoices(data as CustomVoice[]);
    } catch (err: any) {
      console.error('Error fetching voices:', err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos clones vocaux",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, [user]);

  // Clean timer & playback on modal close
  const closeRecordingModal = () => {
    setIsRecordingModalOpen(false);
    stopRecording(true);
    cleanupAudioResources();
    setRelationName('');
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingStep('info');
  };

  const cleanupAudioResources = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  // Start micro recording
  const startRecording = async () => {
    cleanupAudioResources();
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Déterminer le format supporté
      const formats = [
        { mimeType: 'audio/webm', ext: 'webm' },
        { mimeType: 'audio/ogg', ext: 'ogg' },
        { mimeType: 'audio/mp4', ext: 'm4a' },
        { mimeType: 'audio/aac', ext: 'aac' },
      ];
      let selectedFormat = { mimeType: '', ext: 'webm' };
      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format.mimeType)) {
          selectedFormat = format;
          break;
        }
      }
      audioFormatRef.current = selectedFormat;

      const options = selectedFormat.mimeType ? { mimeType: selectedFormat.mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all tracks in stream to release microphone after recording is stopped
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: selectedFormat.mimeType || mediaRecorder.mimeType });
        console.log("Recorded blob size:", audioBlob.size, "bytes");

        if (audioBlob.size === 0) {
          toast({
            title: "Enregistrement vide",
            description: "Aucun son n'a été capturé. Veuillez vérifier les autorisations de votre micro et réessayer.",
            variant: "destructive"
          });
          setRecordingStep('info');
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        setRecordingStep('preview');
      };

      // Set up simple canvas waveform animation
      setupWaveform(stream);

      mediaRecorder.start();
      setRecordingStep('recording');

      // 15 seconds timer
      let seconds = 0;
      timerIntervalRef.current = setInterval(() => {
        seconds += 1;
        setRecordingSeconds(seconds);
        if (seconds >= 15) {
          stopRecording();
        }
      }, 1000);

    } catch (err) {
      console.error('Mic access error:', err);
      toast({
        title: "Microphone inaccessible",
        description: "Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.",
        variant: "destructive"
      });
      setRecordingStep('info');
    }
  };

  // Waveform canvas helper
  const setupWaveform = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyserRef.current.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Custom pink/indigo pastel gradient wave
        canvasCtx.fillStyle = `rgba(168, 218, 220, ${0.3 + barHeight / canvas.height})`;
        canvasCtx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight);

        x += barWidth + 2;
      }
    };

    draw();
  };

  // Stop micro recording
  const stopRecording = (discard = false) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (discard) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    } else if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (discard) {
      setRecordingStep('info');
    }
  };

  // Preview local recording audio
  const togglePreviewPlayback = () => {
    if (!audioUrl) return;

    if (isPlayingPreview && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      const audio = audioPreviewRef.current || new Audio(audioUrl);
      audioPreviewRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
      
      audio.play()
        .then(() => {
          setIsPlayingPreview(true);
        })
        .catch(err => {
          console.error("Playback error:", err);
          setIsPlayingPreview(false);
          toast({
            title: "Erreur de lecture",
            description: "Impossible de lire l'extrait. L'enregistrement est peut-être vide ou bloqué par le navigateur.",
            variant: "destructive"
          });
        });
    }
  };

  // Upload Voice to Supabase
  const handleSaveVoice = async () => {
    if (!audioBlob || !relationName.trim() || !user) return;
    setRecordingStep('uploading');

    try {
      const voiceId = crypto.randomUUID();
      const format = audioFormatRef.current;
      const filePath = `${user.id}/${voiceId}.${format.ext}`; // Upload inside user folder with correct extension

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('voice-clones')
        .upload(filePath, audioBlob, {
          contentType: format.mimeType || audioBlob.type || 'audio/webm',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Save metadata in DB
      const { error: dbError } = await supabase
        .from('user_voices')
        .insert({
          id: voiceId,
          user_id: user.id,
          name: `Voix de ${relationName}`,
          voice_ref_path: filePath,
          transcript: getTranscriptText(),
          relation: relationName
        });

      if (dbError) throw dbError;

      toast({
        title: "🎉 Clone vocal créé !",
        description: `La voix de ${relationName} est maintenant prête à être utilisée dans le lecteur.`,
      });

      closeRecordingModal();
      fetchVoices();
    } catch (err: any) {
      console.error('Error saving voice:', err);
      toast({
        title: "Erreur d'enregistrement",
        description: err.message || "Impossible de sauvegarder votre enregistrement",
        variant: "destructive"
      });
      setRecordingStep('preview');
    }
  };

  // Delete Cloned Voice
  const handleDeleteVoice = async (voice: CustomVoice) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer la ${voice.name} ?`)) return;

    try {
      // 1. Delete from DB
      const { error: dbError } = await supabase
        .from('user_voices')
        .delete()
        .eq('id', voice.id);

      if (dbError) throw dbError;

      // 2. Delete from storage
      await supabase.storage
        .from('voice-clones')
        .remove([voice.voice_ref_path]);

      toast({
        title: "Voix supprimée",
        description: "La voix a été retirée de vos profils."
      });

      fetchVoices();
    } catch (err: any) {
      console.error('Error deleting voice:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la voix",
        variant: "destructive"
      });
    }
  };

  // Test listen existing cloned voice
  const handleTestListen = async (voice: CustomVoice) => {
    try {
      const { data } = await supabase.storage
        .from('voice-clones')
        .createSignedUrl(voice.voice_ref_path, 60);

      if (data?.signedUrl) {
        const audio = new Audio(data.signedUrl);
        audio.play()
          .catch(err => {
            console.error("Test listen play error:", err);
            toast({
              title: "Erreur de lecture",
              description: "Impossible de lire l'échantillon vocal de référence.",
              variant: "destructive"
            });
          });
        toast({
          title: `Écoute de la ${voice.name}…`,
          description: "Lecture de l'échantillon de référence.",
        });
      }
    } catch (err) {
      console.error('Test play error:', err);
    }
  };

  // Generate distant sharing invitation link for grandparents
  const handleGenerateInvite = async () => {
    if (!inviteRelation.trim() || !user) return;
    setInviteLoading(true);

    try {
      const inviteToken = crypto.randomUUID();
      
      const { error } = await supabase
        .from('voice_invitations')
        .insert({
          user_id: user.id,
          relation_name: inviteRelation,
          token: inviteToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiration
        });

      if (error) throw error;

      // Create full public link
      const publicLink = `${window.location.origin}/shared-voice-record/${inviteToken}`;
      setGeneratedInviteLink(publicLink);
      setRecordingStep('info'); // Reset recording steps
    } catch (err: any) {
      console.error('Error creating invitation:', err);
      toast({
        title: "Erreur d'invitation",
        description: "Impossible de générer le lien de partage",
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Copy Invitation Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setIsCopied(true);
    toast({
      title: "Lien copié !",
      description: "Vous pouvez maintenant le coller sur WhatsApp, SMS ou e-mail pour l'envoyer."
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteRelation('');
    setGeneratedInviteLink('');
    setIsCopied(false);
  };

  if (limitsLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6 md:space-y-8 pb-24">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour aux paramètres
          </button>
          <h1 className="font-display italic text-3xl md:text-4xl text-foreground tracking-tight flex items-center gap-2 animate-fade-up-slow">
            <Mic className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Studio des Voix Familiales
          </h1>
          <p className="text-sm text-muted-foreground">
            Enregistrez ou invitez des membres de la famille à cloner leur voix pour lire les histoires de vos enfants.
          </p>
        </div>

        {/* Display limit badges */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-primary-soft/10 text-primary border-primary/20 py-1 px-3">
            <Sparkles className="w-3 h-3 text-[#E9C46A] mr-1" />
            Slots Vocaux : {voices.length} / {maxClones}
          </Badge>
        </div>
      </div>

      {/* Slots Description / Warning */}
      {maxClones === 0 ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center space-y-4">
            <Sparkles className="w-10 h-10 mx-auto text-[#E9C46A] animate-pulse" />
            <div>
              <h3 className="font-bold text-lg">Débloquez le Clonage Vocal</h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Le clonage vocal est une fonctionnalité premium réservée aux membres de nos abonnements Calmi. 
                Faites cloner la voix de Maman, Papa ou Papy pour raconter des histoires uniques !
              </p>
            </div>
            <Button onClick={() => navigate('/pricing')} className="px-6">
              Découvrir nos plans
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 🌟 Slots and Cards Grid */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Custom voices cards */}
              {voices.map((voice) => (
                <Card key={voice.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold">{voice.name}</CardTitle>
                        <Badge variant="secondary" className="text-[10px] mt-1 capitalize">
                          {voice.relation}
                        </Badge>
                      </div>
                      <Heart className="w-5 h-5 text-red-400 fill-red-400/20" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 text-xs text-muted-foreground truncate">
                    "{voice.transcript?.substring(0, 50)}..."
                  </CardContent>
                  <CardFooter className="pt-2 border-t flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-8 text-primary hover:bg-primary-soft/10"
                      onClick={() => handleTestListen(voice)}
                    >
                      <Volume2 className="w-3.5 h-3.5 mr-1" /> Écouter
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteVoice(voice)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {/* Remaining Empty slots cards */}
              {Array.from({ length: Math.max(0, maxClones - voices.length) }).map((_, index) => (
                <Card 
                  key={index} 
                  className="border-dashed border-2 hover:border-primary-soft/80 bg-muted/20 flex flex-col items-center justify-center p-6 text-center min-h-[160px] transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary-soft/10 flex items-center justify-center mb-2">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Emplacement vide</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Prêt pour une nouvelle voix
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="text-xs"
                      onClick={() => setIsRecordingModalOpen(true)}
                    >
                      Enregistrer
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => setIsInviteModalOpen(true)}
                    >
                      <Share2 className="w-3 h-3 mr-1" /> Inviter
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 📱 Distant grandparent information panel */}
          <div className="space-y-6">
            <Card className="bg-[#A8DADC]/5 border-[#A8DADC]/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Le Lien Papy & Mamie
                </CardTitle>
                <CardDescription className="text-xs">
                  Connectez les générations éloignées
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-3 leading-relaxed">
                <p>
                  Vous avez un grand-parent qui vit loin ou qui ne peut pas se déplacer ? 
                  Envoyez-lui simplement un **Lien d'invitation à distance** !
                </p>
                <p>
                  Il cliquera dessus depuis son smartphone, lira un court texte à voix haute sans aucune inscription, 
                  et sa voix s'ajoutera automatiquement dans votre compte Calmi pour lire les histoires.
                </p>
                <div className="flex justify-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsInviteModalOpen(true)}
                    disabled={isSlotLimitReached}
                    className="w-full text-xs font-semibold"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Générer une invitation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Micro FAQ */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  Conseils d'enregistrement
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[11px] text-muted-foreground space-y-2">
                <p>
                  🎙️ **Silence** : Enregistrez dans une pièce parfaitement calme sans bruit de fond.
                </p>
                <p>
                  😊 **Ton** : Adoptez une voix posée, chaleureuse et souriante, comme si vous lisiez directement au lit.
                </p>
                <p>
                  📱 **Distance** : Parlez à environ 15-20 cm du microphone, sans souffler directement dedans.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 🔴 1. ASSISTANT D'ENREGISTREMENT MODAL (PAS-À-PAS) */}
      <Dialog open={isRecordingModalOpen} onOpenChange={closeRecordingModal}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Créer votre voix personnalisée
            </DialogTitle>
            <DialogDescription>
              Enregistrez un échantillon de 15 secondes.
            </DialogDescription>
          </DialogHeader>

          {/* ÉTAPE 1 : Choix de la relation */}
          {recordingStep === 'info' && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Qui enregistre sa voix ?
                </label>
                <Input
                  placeholder="Ex: Papa, Maman, Mamie Nicole..."
                  value={relationName}
                  onChange={(e) => setRelationName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="text-xs text-muted-foreground space-y-2 leading-relaxed bg-muted/30 p-3 rounded-lg border">
                <p className="font-semibold">Comment ça marche ?</p>
                <p>
                  1. Vous allez devoir lire à haute voix un court texte chaleureux de 15 secondes.
                </p>
                <p>
                  2. Notre système modélisera instantanément votre timbre de voix.
                </p>
                <p>
                  3. Votre voix sera immédiatement disponible pour raconter n'importe quelle histoire !
                </p>
              </div>

              <DialogFooter>
                <Button 
                  onClick={startRecording}
                  disabled={!relationName.trim()}
                  className="w-full flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" /> Commencer à parler
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ÉTAPE 2 : Enregistrement actif */}
          {recordingStep === 'recording' && (
            <div className="space-y-4 py-2 text-center">
              <div className="relative h-16 w-full flex items-center justify-center mb-2">
                <canvas 
                  ref={canvasRef} 
                  width={350} 
                  height={60} 
                  className="w-full h-full rounded-lg bg-muted/10"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-500 text-white text-xs font-mono font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    REC · {recordingSeconds}s / 15s
                  </div>
                </div>
              </div>

              <div className="bg-primary-soft/10 p-4 rounded-xl border border-primary/10 text-left">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">
                  Lisez ce texte avec amour :
                </p>
                <p className="text-sm font-medium leading-relaxed italic text-foreground">
                  "{getTranscriptText()}"
                </p>
              </div>

              <DialogFooter>
                <Button 
                  variant="destructive"
                  onClick={() => stopRecording()}
                  className="w-full"
                >
                  Arrêter et écouter
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ÉTAPE 3 : Pré-écoute */}
          {recordingStep === 'preview' && (
            <div className="space-y-4 py-2 text-center">
              <Heart className="w-12 h-12 text-primary mx-auto animate-glow-pulse" />
              <div>
                <h4 className="font-bold text-base">Enregistrement capturé !</h4>
                <p className="text-xs text-muted-foreground">
                  Écoutez votre échantillon de voix avant de le sauvegarder.
                </p>
              </div>

              <div className="flex justify-center py-2">
                <Button 
                  variant="outline"
                  onClick={togglePreviewPlayback}
                  className="flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  {isPlayingPreview ? 'Mettre en pause' : 'Écouter l\'extrait'}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={startRecording}
                  className="flex-1"
                >
                  Recommencer
                </Button>
                <Button 
                  onClick={handleSaveVoice}
                  className="flex-1"
                >
                  Enregistrer ma voix
                </Button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Téléversement / IA */}
          {recordingStep === 'uploading' && (
            <div className="space-y-4 py-8 text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
              <div>
                <h4 className="font-bold text-base">Création de votre voix…</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Nous sécurisons votre flux et structurons votre voix personnalisée. Cela ne prend que quelques secondes…
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🔵 2. INVITATION À DISTANCE MODAL */}
      <Dialog open={isInviteModalOpen} onOpenChange={closeInviteModal}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Inviter un proche à distance
            </DialogTitle>
            <DialogDescription>
              Générez un lien d'enregistrement temporaire valable 7 jours.
            </DialogDescription>
          </DialogHeader>

          {!generatedInviteLink ? (
            // Form to create link
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Relation ou Prénom du proche
                </label>
                <Input
                  placeholder="Ex: Papy Henri, Mamie Nicole, Nounou Marie..."
                  value={inviteRelation}
                  onChange={(e) => setInviteRelation(e.target.value)}
                  className="w-full"
                />
              </div>

              <DialogFooter>
                <Button 
                  onClick={handleGenerateInvite}
                  disabled={!inviteRelation.trim() || inviteLoading}
                  className="w-full flex items-center gap-2"
                >
                  {inviteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                  Générer le lien d'enregistrement
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // Generated link view
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto text-green-500">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-sm">Lien généré avec succès !</h4>
                <p className="text-xs text-muted-foreground">
                  Envoyez ce lien à **{inviteRelation}**. Il expirera dans exactement 7 jours.
                </p>
              </div>

              <div className="flex gap-2 items-center p-2 rounded-lg bg-muted border font-mono text-[10px] break-all select-all">
                {generatedInviteLink}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={closeInviteModal}
                  className="flex-1"
                >
                  Fermer
                </Button>
                <Button 
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? 'Copié !' : 'Copier le lien'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceStudio;
