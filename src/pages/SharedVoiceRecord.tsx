import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mic, Volume2, Check, Loader2, Heart, AlertTriangle, ArrowLeft, Headphones
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface InvitationDetails {
  id: string;
  user_id: string;
  relation_name: string;
  is_used: boolean;
  expires_at: string;
  user_email?: string;
  user_name?: string;
}

export const SharedVoiceRecord: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  // Recording State (Senior optimized)
  const [recordingState, setRecordingState] = useState<'welcome' | 'recording' | 'preview' | 'success' | 'uploading'>('welcome');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token) {
        setInvitationError("Lien d'invitation manquant.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Query public invitation details
        const { data, error } = await supabase
          .from('voice_invitations')
          .select('id, user_id, relation_name, is_used, expires_at')
          .eq('token', token)
          .single();

        if (error || !data) {
          setInvitationError("Cette invitation est introuvable ou a été supprimée.");
          return;
        }

        const invDetails = data as InvitationDetails;

        // Check if already used
        if (invDetails.is_used) {
          setInvitationError("Ce lien d'invitation a déjà été utilisé pour créer un modèle de voix.");
          return;
        }

        // Check expiration
        const expiresDate = new Date(invDetails.expires_at);
        if (expiresDate < new Date()) {
          setInvitationError("Ce lien d'enregistrement a expiré (validité de 7 jours dépassée). Demandez un nouveau lien.");
          return;
        }

        // Fetch sending user's details (firstname / email)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('firstname, email')
          .eq('id', invDetails.user_id)
          .single();

        if (!userError && userData) {
          invDetails.user_name = userData.firstname || userData.email;
        } else {
          invDetails.user_name = "Votre famille";
        }

        setInvitation(invDetails);
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setInvitationError("Impossible de vérifier le lien d'invitation.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  // Clean timer & audio on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  // Transcript tailored for senior readability
  const getTranscriptText = () => {
    if (!invitation) return "";
    const norm = invitation.relation_name.trim().toLowerCase();
    
    if (norm.includes('mamie') || norm.includes('grand-mère') || norm.includes('mémé')) {
      return "Coucou mon chéri, installe-toi bien chaudement dans ton lit. Mamie est là pour te faire voyager dans un monde plein de magie et d'aventures ce soir. Laisse mon histoire t'envelopper comme un très doux câlin, et fais de jolis rêves...";
    }
    if (norm.includes('papy') || norm.includes('grand-père') || norm.includes('pépé')) {
      return "Installe-toi bien chaudement mon chéri. Papy est là pour te faire voyager dans un monde plein de magie et de rêves ce soir. Laisse mon histoire t'envelopper comme un très doux câlin, et ferme tes jolis petits yeux...";
    }
    if (norm.includes('maman') || norm.includes('mère')) {
      return "Ferme les yeux doucement mon petit ange, je suis tout près de toi. Les étoiles brillent dans la nuit pour veiller sur tes rêves les plus doux. Écoute ma voix te transporter vers un pays de nuages merveilleux ce soir...";
    }
    if (norm.includes('papa') || norm.includes('père')) {
      return "Mon trésor, installe-toi confortablement sous ta couette. Les étoiles brillent pour toi dans le ciel de Calmi. Écoute cette jolie histoire, laisse-toi bercer par mes paroles et fais de beaux rêves paisibles...";
    }
    return "Bienvenue dans Calmi, je m'apprête à te raconter une histoire merveilleuse pour t'endormir paisiblement. Respire calmement, écoute ma voix t'emmener dans les étoiles, et laisse tes rêves s'envoler doucement...";
  };

  // Start recording voice sample
  const startRecording = async () => {
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordingState('preview');
      };

      mediaRecorder.start();
      setRecordingState('recording');

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
      console.error('Microphone error:', err);
      toast({
        title: "Microphone bloqué",
        description: "Veuillez autoriser l'accès au microphone de votre téléphone pour vous enregistrer.",
        variant: "destructive"
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Play preview sample
  const togglePreviewPlayback = () => {
    if (!audioUrl) return;

    if (isPlayingPreview && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      const audio = audioPreviewRef.current || new Audio(audioUrl);
      audioPreviewRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
      audio.play();
      setIsPlayingPreview(true);
    }
  };

  // Upload senior vocal clone to grandchild profile
  const handleUploadVoice = async () => {
    if (!audioBlob || !invitation || !token) return;
    setRecordingState('uploading');

    try {
      const voiceId = crypto.randomUUID();
      const filePath = `${invitation.user_id}/${voiceId}.wav`; // Upload inside grandchild user folder

      // 1. Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('voice-clones')
        .upload(filePath, audioBlob, {
          contentType: 'audio/wav',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Insert voice metadata inside DB
      const { error: dbError } = await supabase
        .from('user_voices')
        .insert({
          id: voiceId,
          user_id: invitation.user_id,
          name: `Voix de ${invitation.relation_name}`,
          voice_ref_path: filePath,
          transcript: getTranscriptText(),
          relation: invitation.relation_name
        });

      if (dbError) throw dbError;

      // 3. Mark invitation as used
      const { error: inviteUpdateError } = await supabase
        .from('voice_invitations')
        .update({ is_used: true })
        .eq('id', invitation.id);

      if (inviteUpdateError) throw inviteUpdateError;

      setRecordingState('success');
    } catch (err: any) {
      console.error('Error sending voice:', err);
      toast({
        title: "Erreur d'envoi",
        description: err.message || "Impossible d'envoyer votre voix. Réessayez.",
        variant: "destructive"
      });
      setRecordingState('preview');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-2">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-lg font-semibold">Vérification de l'invitation...</p>
        </div>
      </div>
    );
  }

  // Invitation error view (Expired, invalid)
  if (invitationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full border-red-500/20 shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold">Lien non valide</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground pb-6">
            {invitationError}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button onClick={() => navigate('/')} className="px-6">
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-soft/10 to-background p-4">
      <Card className="max-w-xl w-full border-primary-soft/30 shadow-xl rounded-2xl overflow-hidden bg-white/95">
        
        {/* Header with big relations name */}
        <CardHeader className="bg-primary/5 border-b text-center py-6">
          <Heart className="w-10 h-10 text-primary mx-auto fill-primary/10 animate-glow-pulse mb-2" />
          <CardTitle className="text-2xl font-display italic tracking-tight">
            Offrez votre voix
          </CardTitle>
          <CardDescription className="text-sm font-medium mt-1">
            À l'invitation de **{invitation?.user_name}**
          </CardDescription>
        </CardHeader>

        {/* Card Content optimised for grandparents accessibility */}
        <CardContent className="p-6 md:p-8 space-y-6">
          
          {/* WELCOME VIEW */}
          {recordingState === 'welcome' && (
            <div className="space-y-6">
              <div className="space-y-3 leading-relaxed text-gray-700">
                <p className="text-base text-center font-semibold">
                  Bonjour ! Calmi permet de raconter des histoires magiques avec votre voix.
                </p>
                <p className="text-sm text-center opacity-90">
                  Pour cela, il vous suffit de lire à haute voix un court message rassurant de 15 secondes. 
                  Notre intelligence artificielle s'occupe de tout pour créer votre clone de lecture.
                </p>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border flex gap-3 text-xs leading-relaxed text-muted-foreground">
                <Headphones className="w-8 h-8 text-primary shrink-0" />
                <p>
                  **Note** : Installez-vous dans un endroit calme, loin du bruit de la télévision ou de la radio. 
                  Parlez naturellement d'un ton chaleureux et doux.
                </p>
              </div>

              <div className="flex justify-center pt-2">
                <Button 
                  onClick={startRecording}
                  className="w-full text-base py-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:scale-102 transition-transform"
                >
                  <Mic className="w-5 h-5 animate-pulse" />
                  Prêt, je commence à lire
                </Button>
              </div>
            </div>
          )}

          {/* RECORDING ACTIVE VIEW (Senior readable) */}
          {recordingState === 'recording' && (
            <div className="space-y-6 text-center">
              {/* Record badge */}
              <div className="flex justify-center">
                <span className="bg-red-500 text-white text-xs font-mono font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  ENREGISTREMENT · {recordingSeconds}s / 15s
                </span>
              </div>

              {/* Large transcript font */}
              <div className="bg-primary-soft/10 p-6 rounded-xl border border-primary/20 text-left shadow-inner">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                  📢 Lisez ce texte à voix haute et claire :
                </p>
                <p className="text-lg md:text-xl font-medium leading-relaxed italic text-gray-800">
                  "{getTranscriptText()}"
                </p>
              </div>

              <div className="flex justify-center">
                <Button 
                  variant="destructive"
                  onClick={stopRecording}
                  className="w-full text-base py-6 rounded-xl font-bold shadow-md hover:scale-102 transition-transform"
                >
                  Terminer l'enregistrement
                </Button>
              </div>
            </div>
          )}

          {/* PREVIEW VIEW */}
          {recordingState === 'preview' && (
            <div className="space-y-6 text-center">
              <div>
                <Check className="w-12 h-12 text-green-500 mx-auto bg-green-500/10 rounded-full p-2 mb-2" />
                <h3 className="font-bold text-xl">Enregistrement terminé !</h3>
                <p className="text-sm text-muted-foreground">
                  Écoutez votre voix pour vérifier si le son vous plaît.
                </p>
              </div>

              <div className="flex justify-center py-2">
                <Button 
                  variant="outline"
                  onClick={togglePreviewPlayback}
                  className="text-base py-5 px-6 rounded-xl border-primary/30 text-primary flex items-center gap-2"
                >
                  <Volume2 className="w-5 h-5" />
                  {isPlayingPreview ? 'Mettre en pause' : 'Écouter votre voix'}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  variant="ghost" 
                  onClick={startRecording}
                  className="flex-1 py-5 rounded-xl border"
                >
                  Recommencer
                </Button>
                <Button 
                  onClick={handleUploadVoice}
                  className="flex-1 py-5 rounded-xl font-bold shadow"
                >
                  Envoyer ma voix 🎁
                </Button>
              </div>
            </div>
          )}

          {/* UPLOADING VIEW */}
          {recordingState === 'uploading' && (
            <div className="space-y-6 py-8 text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
              <div>
                <h4 className="font-bold text-lg">Envoi de la voix en cours...</h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                  Nous transmettons votre enregistrement de manière sécurisée à votre famille. Veuillez patienter un instant.
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS VIEW */}
          {recordingState === 'success' && (
            <div className="space-y-6 text-center py-4">
              <div className="h-16 w-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto text-green-500 animate-glow-pulse">
                <Check className="h-10 w-10" />
              </div>
              <div>
                <h3 className="font-display italic text-2xl text-foreground font-bold">Un grand merci ! 💖</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
                  Votre voix a été transmise à **{invitation?.user_name}**. 
                  Elle accompagnera désormais les enfants dans tous leurs voyages imaginaires au coucher.
                </p>
              </div>
              <div className="pt-6 border-t flex justify-center">
                <Button onClick={() => navigate('/')} className="px-8 py-5 rounded-xl font-bold">
                  Fermer
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default SharedVoiceRecord;
