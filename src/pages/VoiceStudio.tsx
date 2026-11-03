import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Mic, Trash2, Copy, Plus, Volume2, Share2, Check, Loader2,
  Sparkles, ArrowLeft, Heart, Smartphone, HelpCircle,
  BookOpen, PawPrint, Feather, Waves, Ghost, FolderPlus, Pencil, Pause,
  Moon, Compass, Smile
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
  VoiceCategoryConfig,
  VoiceEmotionStyle,
  VoiceEmotionalSample,
  VOICE_EMOTION_CONFIGS
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

  // 🎭 Multi-Style Voice Enrollment (3 prises d'émotions)
  const [activeEmotionStyle, setActiveEmotionStyle] = useState<VoiceEmotionStyle>('calm');
  const [enrichingVoice, setEnrichingVoice] = useState<UserVoice | null>(null);
  const [playingEmotion, setPlayingEmotion] = useState<{ voiceId: string; emotion: VoiceEmotionStyle } | null>(null);
  const emotionalAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Custom Category Creation State
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Edit Voice State
  const [editingVoice, setEditingVoice] = useState<UserVoice | null>(null);
  const [editName, setEditName] = useState('');
  const [editRelation, setEditRelation] = useState('');
  const [editCategorySlug, setEditCategorySlug] = useState('narrator_family');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioFormatRef = useRef<{ mimeType: string, ext: string }>({ mimeType: 'audio/webm', ext: 'webm' });
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // ✨ Aperçu IA 5s CosyVoice 2
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const aiPreviewAudioRef = useRef<HTMLAudioElement | null>(null);

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

  // Guided transcripts depending on relationship, character role and emotional style
  const getTranscriptText = (catSlug?: string, emotionStyle: VoiceEmotionStyle = activeEmotionStyle, customRole?: string) => {
    const targetSlug = catSlug || targetCategorySlug;
    const norm = (customRole || relationName).trim().toLowerCase();

    // 1. Textes adaptés pour le style Aventure & Énergie ⚡
    if (emotionStyle === 'adventure') {
      if (norm.includes('ours')) {
        return "Regarde ces hautes cimes ! Avec mes grosses pattes et mon grand courage, je t'emmène explorer la montagne magique. Rien ne peut nous arrêter, suis-moi !";
      }
      if (norm.includes('volant') || norm.includes('oiseau') || norm.includes('chouette') || norm.includes('aigle')) {
        return "Déploie tes ailes avec moi ! Un grand coup de vent s'élève vers les nuages dorés. Accroche-toi, nous plongeons au cœur d'une incroyable découverte céleste !";
      }
      if (norm.includes('aquatique') || norm.includes('dauphin') || norm.includes('baleine')) {
        return "Nage avec moi au-delà du récif secret ! Un trésor étincelant est caché au fond de la caverne des coraux. Allez, retiens ton souffle, en avant l'aventure !";
      }
      if (norm.includes('maman') || norm.includes('mère')) {
        return "Allez mon grand aventurier, enfile tes bottes et prends ta cape magique ! Aujourd'hui nous partons explorer les collines secrètes, je suis avec toi et nous allons tout réussir ensemble !";
      }
      if (norm.includes('papa') || norm.includes('père')) {
        return "Regarde là-bas ! Le chemin secret s'illumine à travers la forêt enchantée. Prends mon sac à dos et suis-moi : aujourd'hui, nous partons à l'aventure et rien ne pourra nous arrêter !";
      }
      return VOICE_EMOTION_CONFIGS.adventure.defaultTranscript;
    }

    // 2. Textes adaptés pour le style Joie & Rires ☀️
    if (emotionStyle === 'joy') {
      if (norm.includes('ours')) {
        return "Haha ! Regarde comme je glisse sur la mousse du sous-bois ! Viens, on va ramasser des baies sucrées et rire avec tous les écureuils de la clairière !";
      }
      if (norm.includes('lutin') || norm.includes('troll') || norm.includes('monstre')) {
        return "Hihihi ! Chatouille sur le bout du nez ! J'ai caché des confettis magiques dans les arbres, prépare-toi pour une pluie de fous rires !";
      }
      if (norm.includes('maman') || norm.includes('mère')) {
        return "Oh quel bonheur cette journée avec toi ! Regarde ces bulles de savon multicolores qui s'envolent au soleil. Allez viens, on danse, on rit et on fait la fête ensemble !";
      }
      if (norm.includes('papa') || norm.includes('père')) {
        return "Oh quelle journée formidable ! Tu as vu ce petit écureuil farceur qui jongle avec les noisettes ? Allez viens, on va bien s'amuser, rire et partager de super moments ensemble !";
      }
      return VOICE_EMOTION_CONFIGS.joy.defaultTranscript;
    }

    // 3. Textes pour le style Douceur / Coucher 🌙
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
    return catConfig?.defaultTranscript || VOICE_EMOTION_CONFIGS.calm.defaultTranscript;
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
    setEnrichingVoice(null);
    setActiveEmotionStyle('calm');
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
    if (aiPreviewAudioRef.current) {
      aiPreviewAudioRef.current.pause();
      aiPreviewAudioRef.current = null;
    }
    if (emotionalAudioRef.current) {
      emotionalAudioRef.current.pause();
      emotionalAudioRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsPlayingPreview(false);
    setPlayingVoiceId(null);
    setPlayingEmotion(null);
    setPreviewVoiceId(null);
    setIsPreviewLoading(false);
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
    const maxClones = limits?.max_voice_clones ?? 0;
    if (maxClones <= 0) {
      toast({
        title: "Fonctionnalité réservée",
        description: "Le Studio de voix est accessible à partir du forfait Calmidium (1 voix) ou Calmix (3 voix).",
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }

    if (voices.length >= maxClones) {
      toast({
        title: "Limite de voix atteinte",
        description: `Votre forfait actuel vous permet d'enregistrer ${maxClones} voix (${voices.length}/${maxClones}). Passez au forfait supérieur pour débloquer plus de voix.`,
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }

    setTargetCategorySlug(categorySlug);
    setRelationName('');
    setEnrichingVoice(null);
    setActiveEmotionStyle('calm');
    setRecordingStep('info');
    setIsRecordingModalOpen(true);
  };

  // Open modal to record an emotional take for an existing voice (Multi-Style Enrollment)
  const openEnrichModal = (voice: UserVoice, emotion: VoiceEmotionStyle) => {
    cleanupAudioResources();
    setEnrichingVoice(voice);
    setTargetCategorySlug(voice.category || 'narrator_family');
    setRelationName(voice.relation);
    setActiveEmotionStyle(emotion);
    setRecordingStep('info');
    setIsRecordingModalOpen(true);
  };

  // Play a specific emotional sample of a voice
  const handlePlayEmotionalSample = async (voice: UserVoice, emotion: VoiceEmotionStyle, path: string) => {
    if (playingEmotion?.voiceId === voice.id && playingEmotion?.emotion === emotion && emotionalAudioRef.current) {
      emotionalAudioRef.current.pause();
      emotionalAudioRef.current = null;
      setPlayingEmotion(null);
      return;
    }

    cleanupAudioResources();

    try {
      const { data } = await supabase.storage
        .from('voice-clones')
        .createSignedUrl(path, 60);

      if (data?.signedUrl) {
        const audio = new Audio(data.signedUrl);
        emotionalAudioRef.current = audio;
        setPlayingEmotion({ voiceId: voice.id, emotion });

        audio.onended = () => {
          setPlayingEmotion(null);
        };

        audio.onerror = () => {
          setPlayingEmotion(null);
          toast({
            title: "Erreur de lecture",
            description: "Impossible de lire cet échantillon vocal.",
            variant: "destructive"
          });
        };

        await audio.play();
        const cfg = VOICE_EMOTION_CONFIGS[emotion];
        toast({
          title: `Écoute : ${cfg.label}`,
          description: `Échantillon vocal de ${voice.name}`,
        });
      }
    } catch (err) {
      console.error('Play emotional sample error:', err);
      setPlayingEmotion(null);
    }
  };

  // Open invitation modal with preselected category
  const openInviteForCategory = (categorySlug: string) => {
    const maxClones = limits?.max_voice_clones ?? 0;
    if (maxClones <= 0) {
      toast({
        title: "Fonctionnalité réservée",
        description: "Le Studio de voix est accessible à partir du forfait Calmidium (1 voix) ou Calmix (3 voix).",
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }

    if (voices.length >= maxClones) {
      toast({
        title: "Limite de voix atteinte",
        description: `Votre forfait actuel vous permet d'enregistrer ${maxClones} voix (${voices.length}/${maxClones}). Passez au forfait supérieur pour débloquer plus de voix.`,
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }

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

  // Open edit modal for a voice
  const openEditVoice = (voice: UserVoice) => {
    setEditingVoice(voice);
    setEditName(voice.name);
    setEditRelation(voice.relation);
    setEditCategorySlug(voice.category || 'narrator_family');
  };

  // Save updated voice details (name, relation/role, category)
  const handleSaveVoiceEdit = async () => {
    if (!editingVoice || !editName.trim() || !editRelation.trim()) return;
    setIsSavingEdit(true);

    try {
      const targetCat = allCategories.find((c) => c.id === editCategorySlug);
      const { error } = await supabase
        .from('user_voices')
        .update({
          name: editName.trim(),
          relation: editRelation.trim(),
          category: editCategorySlug,
          category_name: targetCat?.label || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingVoice.id);

      if (error) throw error;

      toast({
        title: "🎉 Voix mise à jour !",
        description: `La voix est désormais enregistrée sous « ${editName.trim()} ».`,
      });

      setEditingVoice(null);
      await fetchVoicesAndCategories();
    } catch (err: any) {
      console.error('Error updating voice:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de modifier la voix",
        variant: "destructive"
      });
    } finally {
      setIsSavingEdit(false);
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

  // Upload Voice to Supabase (Création ou Enrichissement Multi-Style)
  const handleSaveVoice = async () => {
    if (!audioBlob || !relationName.trim() || !user) return;
    setRecordingStep('uploading');

    try {
      const format = audioFormatRef.current;
      const emoConfig = VOICE_EMOTION_CONFIGS[activeEmotionStyle];
      const transcript = getTranscriptText(targetCategorySlug, activeEmotionStyle, relationName);

      // CAS A : Enrichissement d'une voix existante avec une nouvelle émotion
      if (enrichingVoice) {
        const filePath = `${user.id}/${enrichingVoice.id}_${activeEmotionStyle}.${format.ext}`;

        const { error: uploadError } = await supabase.storage
          .from('voice-clones')
          .upload(filePath, audioBlob, {
            contentType: format.mimeType || audioBlob.type || 'audio/webm',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const currentSamples = (enrichingVoice.emotional_samples || {}) as Record<string, any>;
        const updatedSamples = {
          ...currentSamples,
          [activeEmotionStyle]: {
            voice_ref_path: filePath,
            transcript: transcript,
            recorded_at: new Date().toISOString()
          }
        };

        const updatePayload: any = {
          emotional_samples: updatedSamples,
          updated_at: new Date().toISOString()
        };

        // Si on met à jour la prise 'calm', on maintient aussi le champ racine voice_ref_path
        if (activeEmotionStyle === 'calm') {
          updatePayload.voice_ref_path = filePath;
          updatePayload.transcript = transcript;
        }

        const { error: dbError } = await supabase
          .from('user_voices')
          .update(updatePayload)
          .eq('id', enrichingVoice.id);

        if (dbError) throw dbError;

        toast({
          title: `🎉 Prise « ${emoConfig.label} » ajoutée !`,
          description: `La ${enrichingVoice.name} s'adaptera désormais aux récits de type ${emoConfig.label.toLowerCase()}.`,
        });

        closeRecordingModal();
        await fetchVoicesAndCategories();
        return;
      }

      // CAS B : Nouvelle voix personnalisée
      const voiceId = crypto.randomUUID();
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

      // 2. Initialiser emotional_samples avec cette première prise
      const initialSamples = {
        [activeEmotionStyle]: {
          voice_ref_path: filePath,
          transcript: transcript,
          recorded_at: new Date().toISOString()
        }
      };

      // 3. Save metadata in DB
      const { error: dbError } = await supabase
        .from('user_voices')
        .insert({
          id: voiceId,
          user_id: user.id,
          name: `Voix de ${relationName}`,
          voice_ref_path: filePath,
          transcript: transcript,
          relation: relationName,
          category: targetCategorySlug,
          category_name: activeCat?.label || null,
          emotional_samples: initialSamples
        });

      if (dbError) throw dbError;

      toast({
        title: "🎉 Clone vocal créé !",
        description: `La voix de « ${relationName} » est prête (${emoConfig.label}). Vous pouvez ajouter d'autres émotions à tout moment.`,
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

      // Nettoyer tous les fichiers de stockage associés (échantillon principal + variantes émotionnelles)
      const samples = (voice.emotional_samples || {}) as Record<string, any>;
      const pathsToRemove = [voice.voice_ref_path];
      Object.values(samples).forEach((s: any) => {
        if (s?.voice_ref_path && !pathsToRemove.includes(s.voice_ref_path)) {
          pathsToRemove.push(s.voice_ref_path);
        }
      });

      await supabase.storage
        .from('voice-clones')
        .remove(pathsToRemove);

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

  // ✨ Aperçu vocal IA (5s) avec le moteur CosyVoice 2 sur GPU
  const handleAiPreview = async (voice: UserVoice) => {
    // Si déjà en train de jouer cet aperçu : pause
    if (previewVoiceId === voice.id && aiPreviewAudioRef.current) {
      aiPreviewAudioRef.current.pause();
      aiPreviewAudioRef.current = null;
      setPreviewVoiceId(null);
      setIsPreviewLoading(false);
      return;
    }

    if (aiPreviewAudioRef.current) {
      aiPreviewAudioRef.current.pause();
      aiPreviewAudioRef.current = null;
    }
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
      setPlayingVoiceId(null);
    }

    setPreviewVoiceId(voice.id);
    setIsPreviewLoading(true);

    try {
      // 1. Obtenir l'URL signée du clone vocal
      const { data: signedData, error: signError } = await supabase.storage
        .from('voice-clones')
        .createSignedUrl(voice.voice_ref_path, 300);

      if (signError || !signedData?.signedUrl) {
        throw new Error("Impossible d'accéder au fichier vocal de référence");
      }

      toast({
        title: "✨ Synthèse de l'aperçu IA (5s)...",
        description: "Génération du rendu CosyVoice 2 sur GPU en cours.",
      });

      // 2. Appel au point de terminaison synchrone de Modal GPU
      const MODAL_SYNCHRONOUS_URL = "https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize.modal.run";
      const sampleText = "Bonne nuit mon petit trésor, fais de doux rêves dans les étoiles.";

      const response = await fetch(MODAL_SYNCHRONOUS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sampleText,
          voice_ref_url: signedData.signedUrl,
          ref_text: voice.transcript || "",
          instruct: "Soft, warm, soothing bedtime story narrator for a child.",
          voiceId: voice.id,
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur de synthèse (${response.status})`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      aiPreviewAudioRef.current = audio;
      setIsPreviewLoading(false);

      audio.onended = () => {
        setPreviewVoiceId(null);
        setIsPreviewLoading(false);
      };

      audio.onerror = () => {
        setPreviewVoiceId(null);
        setIsPreviewLoading(false);
        toast({
          title: "Erreur audio",
          description: "Impossible de lire l'aperçu audio généré.",
          variant: "destructive"
        });
      };

      await audio.play();

      toast({
        title: "🎙️ Aperçu CosyVoice 2 actif",
        description: `Lecture de l'échantillon généré pour ${voice.name}.`,
      });

    } catch (err: any) {
      console.error("AI Preview error:", err);
      setPreviewVoiceId(null);
      setIsPreviewLoading(false);
      toast({
        title: "Erreur d'aperçu",
        description: err.message || "Le service GPU n'a pas pu générer l'aperçu.",
        variant: "destructive"
      });
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
            Voix actives : {voices.length} / {limits?.max_voice_clones ?? 0}
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
                <CardContent className="pb-3 text-xs space-y-2.5">
                  {/* Prises émotionnelles Multi-Style */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['calm', 'adventure', 'joy'] as VoiceEmotionStyle[]).map((emo) => {
                      const cfg = VOICE_EMOTION_CONFIGS[emo];
                      const samples = (voice.emotional_samples || {}) as Record<string, any>;
                      const sample = samples[emo] || (emo === 'calm' ? { voice_ref_path: voice.voice_ref_path, transcript: voice.transcript } : null);
                      const isRecorded = Boolean(sample?.voice_ref_path);
                      const isPlaying = playingEmotion?.voiceId === voice.id && playingEmotion?.emotion === emo;

                      return (
                        <div
                          key={emo}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all",
                            isRecorded
                              ? "bg-primary-soft/10 border-primary/20 text-foreground font-medium"
                              : "border-dashed border-muted-foreground/30 text-muted-foreground bg-muted/10 hover:border-primary/40"
                          )}
                        >
                          <span>{cfg.emoji}</span>
                          <span>{cfg.label.split('&')[0].trim()}</span>
                          {isRecorded ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayEmotionalSample(voice, emo, sample.voice_ref_path);
                              }}
                              className="ml-0.5 p-0.5 text-muted-foreground hover:text-primary transition-colors"
                              title={`Écouter la prise « ${cfg.label} »`}
                            >
                              {isPlaying ? (
                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              ) : (
                                <Volume2 className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEnrichModal(voice, emo);
                              }}
                              className="ml-0.5 text-[10px] text-primary hover:underline font-bold"
                              title={`Enregistrer la prise « ${cfg.label} »`}
                            >
                              +
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-muted-foreground truncate italic">
                    "{voice.transcript?.substring(0, 48)}..."
                  </p>
                </CardContent>
                <CardFooter className="pt-2 border-t flex justify-between items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    {/* Écoute de l'enregistrement original */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "text-xs h-8 text-muted-foreground hover:text-foreground hover:bg-muted px-2",
                        playingVoiceId === voice.id && "text-amber-500 hover:text-amber-600 bg-amber-50"
                      )}
                      onClick={() => handleTestListen(voice)}
                      title="Écouter l'enregistrement original de référence"
                    >
                      {playingVoiceId === voice.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 mr-1" /> Original
                        </>
                      )}
                    </Button>

                    {/* ✨ Aperçu CosyVoice 2 IA 5s */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "text-xs h-8 px-2 font-medium border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all",
                        previewVoiceId === voice.id && "bg-purple-100 dark:bg-purple-900/40 border-purple-400"
                      )}
                      onClick={() => handleAiPreview(voice)}
                      disabled={isPreviewLoading && previewVoiceId !== voice.id}
                      title="Écouter une phrase de coucher générée par l'IA CosyVoice 2"
                    >
                      {isPreviewLoading && previewVoiceId === voice.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-purple-500" /> IA…
                        </>
                      ) : previewVoiceId === voice.id ? (
                        <>
                          <Pause className="w-3.5 h-3.5 mr-1 text-purple-600" /> Stop IA
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-500" /> Aperçu IA
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => openEditVoice(voice)}
                      title="Modifier le nom ou le rôle de cette voix"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteVoice(voice)}
                      title="Supprimer cette voix"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
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

      {/* 🔴 1. MODALE D'ENREGISTREMENT PAS-À-PAS & MULTI-STYLE */}
      <Dialog open={isRecordingModalOpen} onOpenChange={closeRecordingModal}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {enrichingVoice ? (
                <>
                  <Sparkles className="h-5 w-5 text-primary" />
                  Enrichir : {enrichingVoice.name}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 text-primary" />
                  Créer votre voix personnalisée
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {enrichingVoice ? (
                <>
                  Ajoutez la prise vocale <strong>{VOICE_EMOTION_CONFIGS[activeEmotionStyle].label}</strong> ({VOICE_EMOTION_CONFIGS[activeEmotionStyle].tagline.toLowerCase()}).
                </>
              ) : (
                <>
                  Enregistrez un échantillon guidé de 15 secondes pour la section <strong>{allCategories.find(c => c.id === targetCategorySlug)?.label}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* ÉTAPE 1 : Choix de l'intonation, rôle et microphone */}
          {recordingStep === 'info' && (
            <div className="space-y-4 py-2">
              
              {/* Sélecteur d'Intonation & Émotion Multi-Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Intonation & Émotion</span>
                  <span className="text-[11px] font-normal lowercase text-muted-foreground">
                    {VOICE_EMOTION_CONFIGS[activeEmotionStyle].tagline}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['calm', 'adventure', 'joy'] as VoiceEmotionStyle[]).map((emo) => {
                    const cfg = VOICE_EMOTION_CONFIGS[emo];
                    const isSelected = activeEmotionStyle === emo;
                    const samples = (enrichingVoice?.emotional_samples || {}) as Record<string, any>;
                    const isRecorded = enrichingVoice ? Boolean(samples[emo]?.voice_ref_path || (emo === 'calm' && enrichingVoice.voice_ref_path)) : false;

                    return (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setActiveEmotionStyle(emo)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all",
                          isSelected
                            ? "border-primary bg-primary-soft/20 text-primary font-bold shadow-sm ring-1 ring-primary/40"
                            : "border-border hover:bg-muted/60 text-muted-foreground"
                        )}
                      >
                        <span className="text-xl">{cfg.emoji}</span>
                        <span className="text-xs mt-1 leading-tight font-semibold">{cfg.label.split('&')[0].trim()}</span>
                        {isRecorded ? (
                          <span className="text-[9px] text-green-600 dark:text-green-400 font-medium mt-0.5">
                            ✓ Prêt
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground mt-0.5">
                            15s
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground italic pt-0.5">
                  💡 {VOICE_EMOTION_CONFIGS[activeEmotionStyle].promptDescription}
                </p>
              </div>

              {/* Si nouvelle voix : Category Selector & Role Input */}
              {!enrichingVoice && (
                <>
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

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Nom du personnage ou rôle
                    </label>
                    <Input
                      placeholder="Ex: Papa, Maman, L'Ours doux, Chouette..."
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
                </>
              )}

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

              <div className="text-xs text-muted-foreground space-y-1 leading-relaxed bg-muted/30 p-3 rounded-lg border">
                <p className="font-semibold text-foreground">Multi-Style Voice Enrollment</p>
                <p>
                  Enregistrez chaque émotion (Douceur, Aventure, Joie) pour que vos récits s'adaptent naturellement à l'action.
                </p>
              </div>

              <DialogFooter>
                <Button 
                  onClick={startRecording}
                  disabled={!relationName.trim()}
                  className="w-full flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" /> Commencer à parler ({VOICE_EMOTION_CONFIGS[activeEmotionStyle].emoji})
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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>{VOICE_EMOTION_CONFIGS[activeEmotionStyle].emoji}</span>
                    <span>Intonation {VOICE_EMOTION_CONFIGS[activeEmotionStyle].label} :</span>
                  </p>
                </div>
                <p className="text-sm font-medium leading-relaxed italic text-foreground">
                  "{getTranscriptText(targetCategorySlug, activeEmotionStyle, relationName)}"
                </p>
                <p className="text-[11px] text-muted-foreground mt-2 italic">
                  💡 {VOICE_EMOTION_CONFIGS[activeEmotionStyle].promptDescription}
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
                <h4 className="font-bold text-base flex items-center justify-center gap-1.5">
                  <span>{VOICE_EMOTION_CONFIGS[activeEmotionStyle].emoji}</span>
                  <span>Prise {VOICE_EMOTION_CONFIGS[activeEmotionStyle].label} capturée !</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
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
                  {enrichingVoice ? 'Enregistrer cette prise' : 'Enregistrer ma voix'}
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

      {/* ✏️ 4. MODALE DE MODIFICATION D'UNE VOIX */}
      <Dialog open={!!editingVoice} onOpenChange={(open) => !open && setEditingVoice(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Modifier la voix
            </DialogTitle>
            <DialogDescription>
              Personnalisez le nom affiché, le rôle associé ou la catégorie de cette voix.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nom de la voix
              </label>
              <Input
                placeholder="Ex: Voix de Papa, Voix de L'Ours Gaston..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rôle ou personnage associé
              </label>
              <Input
                placeholder="Ex: Papa, Ours Gaston, Chouette..."
                value={editRelation}
                onChange={(e) => setEditRelation(e.target.value)}
                className="w-full"
              />
              <p className="text-[11px] text-muted-foreground">
                Ce rôle permet à l'intelligence artificielle d'attribuer automatiquement les dialogues à ce personnage.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Catégorie
              </label>
              <select
                value={editCategorySlug}
                onChange={(e) => setEditCategorySlug(e.target.value)}
                className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {allCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingVoice(null)}
                disabled={isSavingEdit}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveVoiceEdit}
                disabled={!editName.trim() || !editRelation.trim() || isSavingEdit}
                className="flex items-center gap-2"
              >
                {isSavingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer les modifications
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceStudio;
