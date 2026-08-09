import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Mic, Trash2, Copy, Plus, Volume2, Share2, Check, Loader2,
  Sparkles, ArrowLeft, Heart, Smartphone, HelpCircle,
  BookOpen, PawPrint, Feather, Waves, Ghost, FolderPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  UserVoice, 
  CustomVoiceCategory, 
  DEFAULT_VOICE_CATEGORIES, 
  SLOTS_PER_SECTION,
  VoiceCategoryConfig 
} from '@/types/voices';
import { cn } from '@/lib/utils';

export const VoiceStudio: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { limits, loading: limitsLoading } = useSubscription();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [voices, setVoices] = useState<UserVoice[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomVoiceCategory[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('narrator_family');

  // Recording State
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [targetCategorySlug, setTargetCategorySlug] = useState<string>('narrator_family');
  const [relationName, setRelationName] = useState('');
  const [recordingStep, setRecordingStep] = useState<'info' | 'recording' | 'preview' | 'uploading'>('info');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Custom Category Creation State
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioFormatRef = useRef<{ mimeType: string, ext: string }>({ mimeType: 'audio/webm', ext: 'webm' });
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Distant Invitation State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteRelation, setInviteRelation] = useState('');
  const [inviteCategorySlug, setInviteCategorySlug] = useState<string>('narrator_family');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Merged categories list (Native + Custom)
  const allCategories: VoiceCategoryConfig[] = [
    ...DEFAULT_VOICE_CATEGORIES,
    ...customCategories.map((c) => ({
      id: c.slug,
      label: c.label,
      icon: 'Sparkles',
      emoji: '✨',
      description: 'Catégorie personnalisée pour vos histoires.',
      defaultRoles: ['Héros', 'Compagnon', 'Personnage spécial'],
      defaultTranscript: "Bienvenue dans Calmi ! Je m'apprête à te raconter une histoire merveilleuse. Respire calmement et laisse tes rêves s'envoler..."
    }))
  ];

  const currentCategoryConfig = allCategories.find((c) => c.id === activeCategorySlug) || DEFAULT_VOICE_CATEGORIES[0];
  const activeVoices = voices.filter((v) => (v.category || 'narrator_family') === activeCategorySlug);
  const isCategoryFull = activeVoices.length >= SLOTS_PER_SECTION;

  // Icon mapping helper
  const renderCategoryIcon = (iconName: string, className: string = "w-4 h-4") => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className={className} />;
      case 'PawPrint': return <PawPrint className={className} />;
      case 'Feather': return <Feather className={className} />;
      case 'Waves': return <Waves className={className} />;
      case 'Ghost': return <Ghost className={className} />;
      case 'Sparkles':
      default:
        return <Sparkles className={className} />;
    }
  };

  // Guided transcripts depending on relationship or character role
  const getTranscriptText = (catSlug?: string) => {
    const targetSlug = catSlug || targetCategorySlug;
    const norm = relationName.trim().toLowerCase();

    if (targetSlug === 'animal_flying' || norm.includes('volant') || norm.includes('oiseau') || norm.includes('chouette') || norm.includes('hibou')) {
      return "Hou hou ! Je suis le gardien du ciel étoilé. Mes ailes déployées me permettent de voler tout là-haut au-dessus des nuages. Suis-moi dans les étoiles pour un voyage magique ce soir !";
    }
    if (targetSlug === 'animal_aquatic' || norm.includes('aquatique') || norm.includes('dauphin') || norm.includes('baleine') || norm.includes('poisson')) {
      return "Plouf ! Je nage calmement dans les profondeurs bleues de l'océan enchanté. Écoute le chant des vagues et laisse-toi porter au fil de l'eau vers des rêves merveilleux...";
    }
    if (targetSlug === 'animal_land' || norm.includes('terrestre') || norm.includes('ours') || norm.includes('chien') || norm.includes('chat') || norm.includes('renard') || norm.includes('loup')) {
      return "Bienvenue dans la forêt magique ! Je suis ton compagnon tout doux. Avec mes grosses pattes et mon pelage réconfortant, je suis là pour veiller sur ton sommeil en toute sécurité.";
    }
    if (targetSlug === 'magical_creatures' || norm.includes('monstre') || norm.includes('troll') || norm.includes('robot') || norm.includes('fée') || norm.includes('lutin')) {
      return "Bip boup ! Groaar tout doux ! Ne t'inquiète pas, je suis un monstre très gentil venu d'une lointaine planète magique pour te faire rire et t'accompagner au pays des merveilles !";
    }
    if (targetSlug === 'children' || norm.includes('fille') || norm.includes('garçon') || norm.includes('prince') || norm.includes('princesse')) {
      return "Coucou ! Avec mon doudou et mon super courage, rien ne me fait peur. Je ferme les yeux, j'écoute les fées chuchoter dans le vent et je m'apprête à vivre la plus belle des aventures !";
    }
    if (norm.includes('maman') || norm.includes('mère')) {
      return "Ferme les yeux doucement mon petit ange, je suis tout près de toi. Les étoiles brillent dans la nuit pour veiller sur tes rêves les plus doux. Écoute ma voix te transporter vers un pays de nuages merveilleux ce soir...";
    }
    if (norm.includes('papa') || norm.includes('père')) {
      return "Mon trésor, installe-toi confortablement sous ta couette. Les étoiles brillent pour toi dans le ciel de Calmi. Écoute cette jolie histoire, laisse-toi bercer par mes paroles et fais de beaux rêves paisibles...";
    }
    if (norm.includes('papy') || norm.includes('grand-père') || norm.includes('mamie') || norm.includes('grand-mère')) {
      return "Coucou mon chéri, installe-toi bien chaudement. Papy et Mamie sont là pour te faire voyager dans un monde plein de magie et d'aventures ce soir. Laisse mon histoire t'envelopper comme un doux câlin...";
    }
    
    const catConfig = allCategories.find((c) => c.id === targetSlug);
    return catConfig?.defaultTranscript || "Bienvenue dans Calmi, je m'apprête à te raconter une histoire merveilleuse pour t'endormir paisiblement. Respire calmement, écoute ma voix t'emmener dans les étoiles, et laisse tes rêves s'envoler doucement...";
  };

  const fetchVoicesAndCategories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // 1. Fetch user voices
      const { data: voiceData, error: voiceError } = await supabase
        .from('user_voices')
        .select('*')
        .order('created_at', { ascending: false });

      if (voiceError) throw voiceError;
      setVoices((voiceData as UserVoice[]) || []);

      // 2. Fetch custom categories
      const { data: catData, error: catError } = await supabase
        .from('user_voice_categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (!catError && catData) {
        setCustomCategories(catData as CustomVoiceCategory[]);
      }
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
    fetchVoicesAndCategories();
  }, [user]);

  // Clean up all audio resources on unmount
  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

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
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsPlayingPreview(false);
    setPlayingVoiceId(null);
  };

  // Enumerate microphones
  const loadMicrophones = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceList.filter(d => d.kind === 'audioinput');
      setDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating audio devices:", err);
    }
  };

  useEffect(() => {
    if (isRecordingModalOpen) {
      loadMicrophones();
    }
  }, [isRecordingModalOpen]);

  // Open recording modal with preselected category
  const openRecordingForCategory = (categorySlug: string) => {
    setTargetCategorySlug(categorySlug);
    setRelationName('');
    setRecordingStep('info');
    setIsRecordingModalOpen(true);
  };

  // Open invitation modal with preselected category
  const openInviteForCategory = (categorySlug: string) => {
    setInviteCategorySlug(categorySlug);
    setInviteRelation('');
    setGeneratedInviteLink('');
    setIsInviteModalOpen(true);
  };

  // Create new custom category
  const handleCreateCategory = async () => {
    if (!newCategoryLabel.trim() || !user) return;
    setIsCreatingCategory(true);

    try {
      const rawSlug = newCategoryLabel
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      const slug = `custom_${rawSlug || Date.now()}`;

      const { data, error } = await supabase
        .from('user_voice_categories')
        .insert({
          user_id: user.id,
          slug: slug,
          label: newCategoryLabel.trim(),
          icon: 'Sparkles'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "🎉 Catégorie créée !",
        description: `La section « ${newCategoryLabel.trim()} » a été ajoutée avec 5 nouveaux slots.`,
      });

      setNewCategoryLabel('');
      setIsNewCategoryModalOpen(false);
      await fetchVoicesAndCategories();
      setActiveCategorySlug(slug);
    } catch (err: any) {
      console.error('Error creating custom category:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer la catégorie",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Delete custom category
  const handleDeleteCategory = async (cat: CustomVoiceCategory) => {
    const categoryVoicesCount = voices.filter(v => v.category === cat.slug).length;
    if (categoryVoicesCount > 0) {
      if (!window.confirm(`Cette catégorie contient ${categoryVoicesCount} voix enregistrée(s). La suppression de la catégorie supprimera également ces voix. Voulez-vous continuer ?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Voulez-vous supprimer la catégorie « ${cat.label} » ?`)) return;
    }

    try {
      const { error } = await supabase
        .from('user_voice_categories')
        .delete()
        .eq('id', cat.id);

      if (error) throw error;

      toast({
        title: "Catégorie supprimée",
        description: `La catégorie « ${cat.label} » a été retirée.`,
      });

      setActiveCategorySlug('narrator_family');
      fetchVoicesAndCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie",
        variant: "destructive"
      });
    }
  };

  // Start micro recording
  const startRecording = async () => {
    cleanupAudioResources();
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

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

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Erreur d'enregistrement",
          description: "Le périphérique d'enregistrement a rencontré une erreur.",
          variant: "destructive"
        });
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());

        const actualMimeType = mediaRecorder.mimeType || selectedFormat.mimeType || 'audio/webm';
        let actualExt = selectedFormat.ext || 'webm';
        if (actualMimeType.includes('mp4') || actualMimeType.includes('m4a')) {
          actualExt = 'm4a';
        } else if (actualMimeType.includes('ogg')) {
          actualExt = 'ogg';
        } else if (actualMimeType.includes('webm')) {
          actualExt = 'webm';
        } else if (actualMimeType.includes('aac')) {
          actualExt = 'aac';
        } else if (actualMimeType.includes('wav')) {
          actualExt = 'wav';
        }

        audioFormatRef.current = { mimeType: actualMimeType, ext: actualExt };
        const recordedBlob = new Blob(audioChunksRef.current, { type: actualMimeType });

        if (recordedBlob.size < 10000) {
          toast({
            title: "Enregistrement trop court ou silencieux",
            description: `Le microphone n'a capturé aucun son valide. Veuillez réessayer en parlant bien en face du micro.`,
            variant: "destructive"
          });
          setRecordingStep('info');
          return;
        }

        const url = URL.createObjectURL(recordedBlob);
        setAudioBlob(recordedBlob);
        setAudioUrl(url);
        setRecordingStep('preview');
      };

      mediaRecorder.start(1000);
      setRecordingStep('recording');

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

  // Stop micro recording
  const stopRecording = (discard = false) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

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
      
      audio.onerror = () => {
        setIsPlayingPreview(false);
        toast({
          title: "Erreur de décodage",
          description: `Impossible de charger l'échantillon vocal.`,
          variant: "destructive"
        });
      };
      
      audio.play()
        .then(() => {
          setIsPlayingPreview(true);
        })
        .catch(err => {
          console.error("Playback error:", err);
          setIsPlayingPreview(false);
          toast({
            title: "Erreur de lecture",
            description: "Impossible de lire l'extrait. L'enregistrement est peut-être bloqué par le navigateur.",
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
      const filePath = `${user.id}/${voiceId}.${format.ext}`;
      const activeCat = allCategories.find((c) => c.id === targetCategorySlug);

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
          transcript: getTranscriptText(targetCategorySlug),
          relation: relationName,
          category: targetCategorySlug,
          category_name: activeCat?.label || null
        });

      if (dbError) throw dbError;

      toast({
        title: "🎉 Clone vocal créé !",
        description: `La voix de « ${relationName} » est prête dans la section ${activeCat?.label || 'du Studio'}.`,
      });

      closeRecordingModal();
      fetchVoicesAndCategories();
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
  const handleDeleteVoice = async (voice: UserVoice) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer la ${voice.name} ?`)) return;

    try {
      const { error: dbError } = await supabase
        .from('user_voices')
        .delete()
        .eq('id', voice.id);

      if (dbError) throw dbError;

      await supabase.storage
        .from('voice-clones')
        .remove([voice.voice_ref_path]);

      toast({
        title: "Voix supprimée",
        description: "La voix a été retirée de vos profils."
      });

      fetchVoicesAndCategories();
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
  const handleTestListen = async (voice: UserVoice) => {
    if (playingVoiceId === voice.id && testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
      setPlayingVoiceId(null);
      return;
    }

    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }

    try {
      const { data } = await supabase.storage
        .from('voice-clones')
        .createSignedUrl(voice.voice_ref_path, 60);

      if (data?.signedUrl) {
        const audio = new Audio(data.signedUrl);
        testAudioRef.current = audio;
        setPlayingVoiceId(voice.id);

        audio.onended = () => {
          setPlayingVoiceId(null);
        };

        audio.onerror = () => {
          setPlayingVoiceId(null);
          toast({
            title: "Erreur de décodage",
            description: `Impossible de charger l'échantillon vocal.`,
            variant: "destructive"
          });
        };

        audio.play().catch(err => {
          console.error("Test play error:", err);
          setPlayingVoiceId(null);
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
      setPlayingVoiceId(null);
    }
  };

  // Generate distant sharing invitation link
  const handleGenerateInvite = async () => {
    if (!inviteRelation.trim() || !user) return;
    setInviteLoading(true);

    try {
      const inviteToken = crypto.randomUUID();
      const catConfig = allCategories.find((c) => c.id === inviteCategorySlug);
      
      const { error } = await supabase
        .from('voice_invitations')
        .insert({
          user_id: user.id,
          relation_name: inviteRelation,
          category: inviteCategorySlug,
          category_name: catConfig?.label || null,
          token: inviteToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      const publicLink = `${window.location.origin}/shared-voice-record/${inviteToken}`;
      setGeneratedInviteLink(publicLink);
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

  const customCatObj = customCategories.find(c => c.slug === activeCategorySlug);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6 md:space-y-8 pb-24">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour aux paramètres
          </button>
          <h1 className="font-display italic text-3xl md:text-4xl text-foreground tracking-tight flex items-center gap-2 animate-fade-up-slow">
            <Mic className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Studio des Voix Familiales
          </h1>
          <p className="text-sm text-muted-foreground">
            Enregistrez jusqu'à 5 voix par section pour donner vie aux narrateurs et personnages secondaires de vos histoires.
          </p>
        </div>

        {/* Global stats badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-primary-soft/10 text-primary border-primary/20 py-1.5 px-3">
            <Sparkles className="w-3.5 h-3.5 text-[#E9C46A] mr-1.5" />
            Total voix actives : {voices.length}
          </Badge>
        </div>
      </div>

      {/* 🧭 Horizontal Tabs Navigation Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Catégories de voix
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewCategoryModalOpen(true)}
            className="text-xs h-8 border-dashed border-primary/40 text-primary hover:bg-primary-soft/10"
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1.5" /> Nouvelle catégorie
          </Button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
          {allCategories.map((cat) => {
            const count = voices.filter(v => (v.category || 'narrator_family') === cat.id).length;
            const isActive = activeCategorySlug === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategorySlug(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border"
                )}
              >
                <span className="text-sm">{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}/{SLOTS_PER_SECTION}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 Active Category View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 5 Slots Grid */}
        <div className="md:col-span-2 space-y-4">
          
          {/* Section banner & Description */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-soft/10 text-primary flex items-center justify-center text-xl shrink-0">
                {currentCategoryConfig.emoji}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  {currentCategoryConfig.label}
                  <Badge variant="secondary" className="text-[10px] py-0 px-2">
                    {activeVoices.length} / {SLOTS_PER_SECTION} voix
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {currentCategoryConfig.description}
                </p>
              </div>
            </div>

            {customCatObj && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:bg-destructive/10 h-8"
                onClick={() => handleDeleteCategory(customCatObj)}
                title="Supprimer cette catégorie"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Slots Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Recorded custom voices in this category */}
            {activeVoices.map((voice) => (
              <Card key={voice.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-bold truncate max-w-[170px]">{voice.name}</CardTitle>
                      <Badge variant="secondary" className="text-[10px] mt-1 capitalize">
                        {voice.relation}
                      </Badge>
                    </div>
                    <Heart className="w-5 h-5 text-red-400 fill-red-400/20 shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3 text-xs text-muted-foreground truncate">
                  "{voice.transcript?.substring(0, 50)}..."
                </CardContent>
                <CardFooter className="pt-2 border-t flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "text-xs h-8 text-primary hover:bg-primary-soft/10",
                      playingVoiceId === voice.id && "text-amber-500 hover:text-amber-600 bg-amber-50"
                    )}
                    onClick={() => handleTestListen(voice)}
                  >
                    {playingVoiceId === voice.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Arrêter
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 mr-1" /> Écouter
                      </>
                    )}
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

            {/* 2. Remaining Empty slots cards for this section (up to 5) */}
            {Array.from({ length: Math.max(0, SLOTS_PER_SECTION - activeVoices.length) }).map((_, index) => (
              <Card 
                key={`empty_${index}`} 
                className="border-dashed border-2 hover:border-primary-soft/80 bg-muted/20 flex flex-col items-center justify-center p-6 text-center min-h-[160px] transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary-soft/10 flex items-center justify-center mb-2">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Emplacement disponible</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Slot {activeVoices.length + index + 1} / {SLOTS_PER_SECTION} ({currentCategoryConfig.label})
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="text-xs"
                    onClick={() => openRecordingForCategory(activeCategorySlug)}
                  >
                    <Mic className="w-3.5 h-3.5 mr-1" /> Enregistrer
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs"
                    onClick={() => openInviteForCategory(activeCategorySlug)}
                  >
                    <Share2 className="w-3 h-3 mr-1" /> Inviter
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Distance invite info & Micro FAQ */}
        <div className="space-y-6">
          <Card className="bg-[#A8DADC]/5 border-[#A8DADC]/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Lien d'invitation à distance
              </CardTitle>
              <CardDescription className="text-xs">
                Faites participer vos proches facilement
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-3 leading-relaxed">
              <p>
                Vous avez un proche (grand-parent, ami, parrain) qui vit loin ? 
                Générez un <strong>lien d'invitation temporaire</strong> !
              </p>
              <p>
                Il cliquera dessus depuis son smartphone, lira un court texte de 15 secondes sans inscription, 
                et sa voix s'ajoutera automatiquement dans votre section <strong>{currentCategoryConfig.label}</strong>.
              </p>
              <div className="flex justify-center pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => openInviteForCategory(activeCategorySlug)}
                  disabled={isCategoryFull}
                  className="w-full text-xs font-semibold"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Inviter dans cette section
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
                🎙️ <strong>Silence</strong> : Enregistrez dans une pièce parfaitement calme sans bruit de fond.
              </p>
              <p>
                🎭 <strong>Intonation</strong> : Jouez le personnage ! Adoptez une voix chaleureuse pour un narrateur, grave pour un ours, ou enjouée pour un petit compagnon.
              </p>
              <p>
                📱 <strong>Distance</strong> : Parlez à environ 15-20 cm du microphone, sans souffler directement dedans.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 🔴 1. MODALE D'ENREGISTREMENT PAS-À-PAS */}
      <Dialog open={isRecordingModalOpen} onOpenChange={closeRecordingModal}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Créer votre voix personnalisée
            </DialogTitle>
            <DialogDescription>
              Enregistrez un échantillon de 15 secondes pour la section <strong>{allCategories.find(c => c.id === targetCategorySlug)?.label}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* ÉTAPE 1 : Choix de la relation et du rôle */}
          {recordingStep === 'info' && (
            <div className="space-y-4 py-2">
              
              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Catégorie
                </label>
                <select
                  value={targetCategorySlug}
                  onChange={(e) => setTargetCategorySlug(e.target.value)}
                  className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Character Role Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nom du personnage ou rôle
                </label>
                <Input
                  placeholder="Ex: L'Ours doux, Le Petit Renard, Papa, Monstre rigolo..."
                  value={relationName}
                  onChange={(e) => setRelationName(e.target.value)}
                  className="w-full"
                />
                
                {/* Suggestions chips for target category */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(allCategories.find(c => c.id === targetCategorySlug)?.defaultRoles || []).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRelationName(role)}
                      className="text-[11px] bg-muted/60 hover:bg-primary-soft/20 hover:text-primary px-2.5 py-1 rounded-full border transition-colors"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Microphone choice */}
              {devices.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Choisir votre microphone
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed bg-muted/30 p-3 rounded-lg border">
                <p className="font-semibold text-foreground">Comment ça marche ?</p>
                <p>1. Lisez à voix haute le court texte guidé de 15 secondes.</p>
                <p>2. Le système modélise votre voix et l'attribue aux dialogues du personnage dans le livre audio.</p>
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
              <div className="relative h-16 w-full flex items-center justify-center mb-2 bg-muted/10 rounded-lg overflow-hidden">
                <style>
                  {`
                    @keyframes bounce-bar {
                      0% { transform: scaleY(0.25); }
                      100% { transform: scaleY(1); }
                    }
                    .animate-equalizer-bar {
                      animation: bounce-bar 0.5s ease-in-out infinite alternate;
                      transform-origin: bottom;
                    }
                  `}
                </style>
                <div className="flex items-end justify-center gap-1.5 h-10 w-full py-1 opacity-40">
                  <div className="w-1.5 h-8 bg-primary rounded-full animate-equalizer-bar" style={{ animationDelay: '0.1s', animationDuration: '0.4s' }} />
                  <div className="w-1.5 h-8 bg-primary rounded-full animate-equalizer-bar" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }} />
                  <div className="w-1.5 h-8 bg-primary rounded-full animate-equalizer-bar" style={{ animationDelay: '0.2s', animationDuration: '0.3s' }} />
                  <div className="w-1.5 h-8 bg-primary rounded-full animate-equalizer-bar" style={{ animationDelay: '0.5s', animationDuration: '0.5s' }} />
                  <div className="w-1.5 h-8 bg-primary rounded-full animate-equalizer-bar" style={{ animationDelay: '0.15s', animationDuration: '0.45s' }} />
                  <div className="w-1.5 h-8 bg-primary rounded-full animate-equalizer-bar" style={{ animationDelay: '0.35s', animationDuration: '0.55s' }} />
                  <div className="w-1.5 h-8 bg-primary rounded-full animate-equalizer-bar" style={{ animationDelay: '0.25s', animationDuration: '0.35s' }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-500 text-white text-xs font-mono font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 shadow-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    REC · {recordingSeconds}s / 15s
                  </div>
                </div>
              </div>

              <div className="bg-primary-soft/10 p-4 rounded-xl border border-primary/10 text-left">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">
                  Lisez ce texte avec l'intonation du personnage :
                </p>
                <p className="text-sm font-medium leading-relaxed italic text-foreground">
                  "{getTranscriptText(targetCategorySlug)}"
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

      {/* 🔵 2. MODALE D'INVITATION À DISTANCE */}
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
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Catégorie d'attribution
                </label>
                <select
                  value={inviteCategorySlug}
                  onChange={(e) => setInviteCategorySlug(e.target.value)}
                  className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
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
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto text-green-500">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-sm">Lien généré avec succès !</h4>
                <p className="text-xs text-muted-foreground">
                  Envoyez ce lien à <strong>{inviteRelation}</strong>. Il expirera dans exactement 7 jours.
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

      {/* ➕ 3. MODALE DE CRÉATION DE CATÉGORIE PERSONNALISÉE */}
      <Dialog open={isNewCategoryModalOpen} onOpenChange={setIsNewCategoryModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Créer une nouvelle catégorie
            </DialogTitle>
            <DialogDescription>
              Ajoutez une section personnalisée (ex: « Véhicules parlants », « Objets enchantés ») qui bénéficiera de ses 5 slots vocaux dédiés.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Titre de la catégorie
              </label>
              <Input
                placeholder="Ex: Véhicules et engins, Objets enchantés..."
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                className="w-full"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsNewCategoryModalOpen(false)}
                disabled={isCreatingCategory}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={!newCategoryLabel.trim() || isCreatingCategory}
                className="flex items-center gap-2"
              >
                {isCreatingCategory && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer la catégorie
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceStudio;
