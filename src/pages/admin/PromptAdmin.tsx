import React, { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminGuard from "@/components/admin/AdminGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Plus, Save, CheckCircle2, Zap, BookOpen, Sparkles, Archive,
  HelpCircle, Copy, Check, ChevronLeft, MoreVertical, AlertTriangle,
  FileText, History, Settings, Bot, RefreshCw,
} from "lucide-react";
import { FAST_STORY_PROMPT_CONFIG, FAST_STORY_PROMPT_KEYS } from "@/config/fastStoryConfig";
import { autoPromptOptimizerService } from "@/services/prompts/autoPromptOptimizerService";

interface PromptTemplate {
  id: string;
  key: string;
  title: string;
  description: string | null;
  active_version_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PromptVersion {
  id: string;
  template_id: string;
  version: number;
  content: string;
  changelog: string | null;
  created_by: string;
  created_at: string;
}

const ACTIVE_PROMPTS_CONFIG: Record<string, {
  label: string;
  description: string;
  category: 'generation' | 'sequel' | 'other';
  icon: React.ElementType;
}> = {
  'advanced_story_prompt_template': {
    label: '📦 [Archivé] Ancien prompt générique',
    description: 'Remplacé par les prompts spécifiques par objectif (sleep, focus, relax, fun)',
    category: 'other',
    icon: Archive,
  },
  'sequel_prompt_template': {
    label: '🟢 Suite d\'histoire',
    description: 'Template pour créer les tomes suivants d\'une série',
    category: 'sequel',
    icon: BookOpen,
  },
  'title_generation_prompt': {
    label: '🟢 Génération Titres',
    description: 'Template pour la génération des 3 propositions de titres',
    category: 'generation',
    icon: Sparkles,
  },
  'image_generation_prompt': {
    label: '🎨 Génération Image',
    description: 'Prompt pour la création de l\'image de couverture',
    category: 'generation',
    icon: Sparkles,
  },
  'video_generation_prompt': {
    label: '🎥 Génération Vidéo',
    description: 'Prompt pour la création de la vidéo d\'introduction',
    category: 'generation',
    icon: Sparkles,
  },
  'story_prompt_sleep': {
    label: '🌙 Histoire du Soir',
    description: 'Prompt spécifique pour l\'objectif Sommeil',
    category: 'generation',
    icon: Sparkles,
  },
  'story_prompt_focus': {
    label: '🧠 Histoire Focus',
    description: 'Prompt spécifique pour l\'objectif Concentration',
    category: 'generation',
    icon: Sparkles,
  },
  'story_prompt_relax': {
    label: '🌸 Histoire Détente',
    description: 'Prompt spécifique pour l\'objectif Relaxation',
    category: 'generation',
    icon: Sparkles,
  },
  'story_prompt_fun': {
    label: '🎉 Histoire Fun',
    description: 'Prompt spécifique pour l\'objectif Amusement',
    category: 'generation',
    icon: Sparkles,
  },
  // ─── Histoires rapides ────────────────────────────────────────────────────
  ...Object.fromEntries(
    Object.entries(FAST_STORY_PROMPT_CONFIG).map(([key, config]) => [
      key,
      {
        label: config.label,
        description: config.description,
        category: 'generation' as const,
        icon: Zap,
      }
    ])
  ),
};

const getFastStoryDefaultContent = (key: string, label: string, description: string, section: string) => {
  const baseInstructions = `
Rôle : Tu es un auteur jeunesse d'élite et expert en storytelling captivant et bienveillant.

MODÈLE NARRATIF EN 2 TEMPS :
1. Temps 1 (Accroche sensorielle - 30-45s) : Capte immédiatement l'attention par un détail sensoriel curieux, un bruit rigolo ou une surprise pour déconnecter l'enfant de ses ruminations et l'ancrer dans le moment présent.
2. Temps 2 (Trame de Cause à Effet à 100%) : Déploie l'histoire pour aborder le thème : "${label.replace('⚡ Rapide — ', '')}".
Description du besoin : ${description}

TRAME CONTINUE (CAUSE À EFFET) :
- Défi ou problème tangible dès la 1ère minute.
- Le protagoniste prend des initiatives et trouve des solutions actives.
- Chaque action provoque un rebondissement qui mène à la scène suivante ("Et donc... / Mais alors...").

CALIBRAGE DU VOCABULAIRE & RÈGLE DU CONCRET :
- Vocabulaire simple, vivant, direct et adapté à un enfant d'environ 6 ans.
- RÈGLE ZÉRO MÉTAPHORE SUPERFLUE : Maximum 1 à 2 comparaisons physiques simples dans toute l'histoire. Interdiction formelle des comparaisons poétiques lentes ("comme du miel", "comme une offrande", etc.).
- LISTE NOIRE STRICTE : Proscrire absolument les mots 'irisé', 'nacre', 'nacré', 'diaphane', 'béatitude', 'onde', 'offrande', 'cérémonieux', 'murmure machinal', 'alcôve', 'zéphyr', 'lueur feutrée', 'contemplation', 'indicible'.
- INTERDICTION DES TICS HYPNOTIQUES PASSIFS : Proscrire 'en laissant ses épaules s'abaisser', 'peut-être en inspirant', 'comme une respiration lente' si l'histoire n'est pas pour s'endormir.
- RÈGLE DES ONOMATOPÉES : MAXIMUM 3 ONOMATOPÉES DANS TOUTE L'HISTOIRE.
- Longueur : Environ {{target_word_count}} mots (~{{duration_minutes}} minutes).
- Structure narrative fluide avec des sauts de lignes pour la lecture à voix haute.
`;

  if (section === 'regulation') {
    return `${baseInstructions}
Instructions spécifiques (Régulation Émotionnelle) :
1. L'histoire doit aider l'enfant à apprivoiser l'émotion difficile sans forcer un calme artificiel.
2. Canalise l'énergie (colère, agitation, anxiété) dans une action ingénieuse, un jeu d'équipe ou un rire libérateur.
3. DÉNOUEMENT OBLIGATOIRE : Termine sur un ÉLAN D'ACTION, DE COURAGE ET DE FIERTÉ (l'enfant est prêt à retourner jouer et agir dans sa journée).`.trim();
  }

  if (section === 'renforcement') {
    return `${baseInstructions}
Instructions spécifiques (Renforcement de Ressources) :
1. Met en avant la découverte d'une compétence insoupçonnée ou d'une force intérieure.
2. Crée un ancrage positif (un geste complice, un mot fétiche ou une sensation de fierté).
3. Ton enthousiaste, pétillant et valorisant. Termine par un sentiment solide de fierté et de confiance en soi.`.trim();
  }

  return `${baseInstructions}
Instructions spécifiques (Situation de Vie) :
1. Met en scène une situation similaire transposée dans un univers métaphorique et captivant.
2. Propose une résolution ingénieuse, positive et amusante.
3. Si la situation se déroule en journée (école, séparation, conflit), termine sur un ÉLAN D'ACTION ET DE CONFIANCE. Si la situation est "le coucher", accompagne doucement vers le sommeil.`.trim();
};

const PromptAdmin: React.FC = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [savingMeta, setSavingMeta] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [activateConfirm, setActivateConfirm] = useState<{ versionId: string; versionNum: number } | null>(null);

  const handleCopyPrompt = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      toast({ title: "Prompt copié dans le presse-papiers" });
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, [toast]);

  const selected = useMemo(
    () => templates.find(t => t.id === selectedId) || null,
    [templates, selectedId]
  );

  const [metaDraft, setMetaDraft] = useState<{ title: string; description: string; key: string }>({
    title: "", description: "", key: "",
  });

  const [newVersionDraft, setNewVersionDraft] = useState<{ content: string; changelog: string }>(
    { content: "", changelog: "" }
  );

  const [optimizing, setOptimizing] = useState(false);

  const handleAutoOptimize = async () => {
    if (!selected) return;
    setOptimizing(true);
    try {
      let objective = "all";
      if (selected.key.startsWith("story_prompt_")) {
        objective = selected.key.replace("story_prompt_", "");
      }
      
      toast({
        title: "Auto-optimisation lancée 🚀",
        description: `Analyse des 20 dernières histoires avec gpt-5.6-terra pour ${selected.title}...`,
      });

      const res = await autoPromptOptimizerService.triggerOptimization({
        objective: objective as any,
        batchSize: 20
      });

      if (res.success) {
        toast({
          title: "Nouvelle version générée !",
          description: "La version optimisée par gpt-5.6-terra est disponible dans l'onglet Versions. Vous pouvez l'activer en 1 clic.",
        });
        await fetchVersions(selected.id);
      } else {
        throw new Error(res.error || "Erreur lors de l'optimisation");
      }
    } catch (err: any) {
      toast({
        title: "Erreur d'optimisation",
        description: err?.message || "Impossible de joindre le workflow n8n",
        variant: "destructive",
      });
    } finally {
      setOptimizing(false);
    }
  };

  const groupedTemplates = useMemo(() => {
    const active: PromptTemplate[] = [];
    const inactive: PromptTemplate[] = [];
    templates.forEach(t => {
      const config = ACTIVE_PROMPTS_CONFIG[t.key];
      if (config && config.category !== 'other') {
        active.push(t);
      } else {
        inactive.push(t);
      }
    });
    return { active, inactive };
  }, [templates]);

  useEffect(() => {
    document.title = "Administration des prompts | Calmi";
    void fetchTemplates();
  }, []);

  useEffect(() => {
    if (selected) {
      setMetaDraft({
        title: selected.title,
        description: selected.description ?? "",
        key: selected.key,
      });
      void fetchVersions(selected.id);
    } else {
      setVersions([]);
    }
  }, [selectedId]);

  const handleSelectTemplate = (id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileView('detail');
  };

  const handleBack = () => {
    setMobileView('list');
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("id, key, title, description, active_version_id, created_at, updated_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setTemplates(data || []);
      if (!selectedId && data && data.length > 0) setSelectedId(data[0].id);
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from("prompt_template_versions")
        .select("id, template_id, version, content, changelog, created_by, created_at")
        .eq("template_id", templateId)
        .order("version", { ascending: false });
      if (error) throw error;
      setVersions(data || []);
      if (data && data.length > 0) {
        setNewVersionDraft({ content: data[0].content, changelog: "" });
      } else {
        setNewVersionDraft({ content: "", changelog: "" });
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const DEFAULT_TITLE_PROMPT = `Tu es un agent qui est chargé de créer 3 titres d'histoires pour enfants selon ce prompt : 
"Génère 3 titres d'histoires originales pour enfants, adaptés au thème suivant : {{objective}}.
Objectif : Les titres doivent captiver l'attention tout en respectant l'intention du thème.
- "sleep" : choisis des titres doux, rassurants et poétiques.
- "focus" : choisis des titres engageants, stimulant la curiosité et l'attention.
- "relax" : choisis des titres apaisants, inspirant le calme et la légèreté.
- "fun" : choisis des titres drôles, surprenants et qui déclenche un sourire aux lecteurs (enfants).
Chaque titre doit :
- Être adapté à des enfants de 3 à 8 ans
- Contenir maximum 10 mots
- Donner envie d'écouter l'histoire."

ATTENTION : Concernant les titres proposés, je veux que les règles d'écriture de la langue française soit respectée. C'est à dire que les majuscules soient pour la première lettre du titre et ensuite, seulement pour les noms propres.

Les titres doivent être courts en interdisant les adjectifs qualificatifs laudatifs (exemple : merveilleux, surprenant, brillant, joyeux, farfelue, magique, etc.). Évite aussi les titres de type : "Quelche-chose qui fait une action". Inspire toi de la littérature jeunesse sans jamais répéter un titre déjà existant.

Pour le titre de l'histoire (title),analyse utilise la mémoire "title_memory" et crée trois titres originaux qui sont différents des titres des 10 dernières histoires. Je souhaite que les titres ne contiennent pas les noms des enfants pour laquelle est créée l'histoire. Ne mets donc pas de nom d'enfant dans le titre des histoires.

Renvoie le nombre de tokens iuput, le nombre de tokens output et le modèle llm utilisé (gpt-5) dans les variable "input_tokens", "output_tokens" et "model_llm" du json en sortie.

Je veux que tu retournes un format json à l'aide de l'outil structured output parser.

Conclusion : le format json final devra avoir la structure suivante :
{
	"title_1": "...",
	"title_2": "...",
    "title_3" : "...",
  "input_tokens": string,
  "output_tokens": string,
  "model_llm": string
}`;

  const DEFAULT_IMAGE_PROMPT = `Crée une image pour cette histoire : {{ $json.summary }}.
L'image doit illustrer parfaitement l'histoire pour enfants en restant simple et très visuelle. Elle est vouée à être l'image de couverture de l'histoire. Elle doit intéresser les enfants et les encourager à écouter l'histoire et donc ne pas être surchargée visuellement. L'image doit être adaptée aux âges des enfants de l'histoire ({{ $('Webhook').item.json.body.childrenData }})

Le titre de l'histoire ({{ $('Webhook').item.json.body.selectedTitle }}) doit se retrouver dans la partie supérieure de l'image avec une police et un style adapté aux enfants.

IMPORTANT : L'image ne doit contenir aucune incitation à la haine ou à la discrimination.

IMPORTANT : l'image ne doit pas être tronquée. Elle doit être complète et le titre doit être bien parfaitement visible.`;

  const DEFAULT_VIDEO_PROMPT = `Génère un prompt pour la création d'une courte vidéo d'introduction d'une histoire pour enfants. Ce prompt sera envoyé à une IA génératrice de vidéo (ex: Kling AI, Luma Dream Machine, Runway).
Voici le résumé de l'histoire : {{ $json.summary }}.
Les enfants qui participent à l'histoire sont : {{ $('Webhook').item.json.body.childrenData }}.

La vidéo doit être immersive, cinématographique et au format portrait (9:16).
Elle doit représenter le personnage principal ou le monde imaginaire de l'histoire.
Rédige le prompt UNIQUEMENT EN ANGLAIS, car les IA vidéos le comprennent mieux.
Utilise des mots-clés descriptifs séparés par des virgules pour définir l'ambiance, les mouvements de caméra (ex: slow pan, zoom in) et le style visuel adapté aux enfants (ex: 3d animation, pixar style, soft lighting, vibrant colors, magical atmosphere).
Le résultat doit être directement utilisable par l'IA vidéo sans aucun texte supplémentaire.`;

  const initializeDefaultPrompts = async () => {
    try {
      setLoading(true);
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error("Utilisateur non connecté");

      let baseContent = "";
      const genericPrompt = templates.find(t => t.key === 'advanced_story_prompt_template');

      if (genericPrompt?.active_version_id) {
        const { data } = await supabase
          .from("prompt_template_versions")
          .select("content")
          .eq("id", genericPrompt.active_version_id)
          .single();
        if (data?.content) baseContent = data.content;
      }

      const keysToInit = [
        'title_generation_prompt', 'image_generation_prompt', 'video_generation_prompt',
        'story_prompt_sleep', 'story_prompt_focus', 'story_prompt_relax', 'story_prompt_fun',
        ...FAST_STORY_PROMPT_KEYS
      ];

      let initCount = 0;

      for (const key of keysToInit) {
        const config = ACTIVE_PROMPTS_CONFIG[key];
        const existing = templates.find(t => t.key === key);

        if (!existing) {
          let initialContent = "";
          if (key === 'title_generation_prompt') initialContent = DEFAULT_TITLE_PROMPT;
          else if (key === 'image_generation_prompt') initialContent = DEFAULT_IMAGE_PROMPT;
          else if (key === 'video_generation_prompt') initialContent = DEFAULT_VIDEO_PROMPT;
          else if (key.startsWith('fast_story_')) {
            const fConfig = FAST_STORY_PROMPT_CONFIG[key];
            initialContent = getFastStoryDefaultContent(key, fConfig?.label || '', fConfig?.description || '', fConfig?.section || '');
          }
          else initialContent = baseContent || "Génère une histoire pour enfants...";

          const { data: templateData, error: templateError } = await supabase
            .from("prompt_templates")
            .insert({
              key: key as string,
              title: config.label.replace(/[🟢🌙🧠🌸🎉🎨🎥]\s?/g, ''),
              description: config.description,
              created_by: userId
            })
            .select("id")
            .single();

          if (templateError) { console.error(`Erreur création template ${key}:`, templateError); continue; }

          const { data: versionData, error: versionError } = await supabase
            .from("prompt_template_versions")
            .insert({
              template_id: templateData.id,
              version: 1,
              content: initialContent,
              changelog: 'Initialisation automatique',
              created_by: userId,
            })
            .select("id")
            .single();

          if (versionError) { console.error(`Erreur création version ${key}:`, versionError); continue; }

          await supabase
            .from("prompt_templates")
            .update({ active_version_id: versionData.id })
            .eq("id", templateData.id);

          initCount++;
        }
      }

      if (initCount > 0) {
        toast({ title: `${initCount} prompt(s) initialisé(s)` });
        await fetchTemplates();
      } else {
        toast({ title: "Tous les prompts sont déjà initialisés" });
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur d'initialisation", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      const tKey = prompt("Clé technique (ex: story_generation):")?.trim();
      const tTitle = tKey ? prompt("Titre lisible:")?.trim() : undefined;
      if (!tKey || !tTitle) return;

      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from("prompt_templates")
        .insert({ key: tKey, title: tTitle, description: null, created_by: userId })
        .select("id").maybeSingle();
      if (error) throw error;

      toast({ title: "Template créé", description: tKey });
      await fetchTemplates();
      if (data?.id) {
        setSelectedId(data.id);
        if (isMobile) setMobileView('detail');
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const saveMeta = async () => {
    if (!selected) return;
    try {
      setSavingMeta(true);
      const { error } = await supabase
        .from("prompt_templates")
        .update({ title: metaDraft.title, description: metaDraft.description, key: metaDraft.key })
        .eq("id", selected.id);
      if (error) throw error;
      toast({ title: "Modifications enregistrées" });
      await fetchTemplates();
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSavingMeta(false);
    }
  };

  const createNewVersion = async () => {
    if (!selected) return;
    try {
      setCreatingVersion(true);
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error("Utilisateur non connecté");

      const nextVersion = (versions[0]?.version ?? 0) + 1;
      const { data, error } = await supabase
        .from("prompt_template_versions")
        .insert({
          template_id: selected.id,
          version: nextVersion,
          content: newVersionDraft.content,
          changelog: newVersionDraft.changelog || `Version ${nextVersion}`,
          created_by: userId,
        })
        .select("id, version").maybeSingle();
      if (error) throw error;

      toast({ title: "Version créée", description: `v${data?.version}` });
      await fetchVersions(selected.id);
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setCreatingVersion(false);
    }
  };

  const setActive = async (versionId: string) => {
    if (!selected) return;
    try {
      const { error } = await supabase
        .from("prompt_templates")
        .update({ active_version_id: versionId })
        .eq("id", selected.id);
      if (error) throw error;
      toast({ title: "Version activée en production" });
      await fetchTemplates();
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const isActivePrompt = (key: string) => !!ACTIVE_PROMPTS_CONFIG[key];
  const getPromptConfig = (key: string) => ACTIVE_PROMPTS_CONFIG[key];

  // ─── Template list item ───
  const renderTemplateItem = (t: PromptTemplate) => {
    const config = getPromptConfig(t.key);
    const isActive = isActivePrompt(t.key);
    const Icon = config?.icon || Archive;

    return (
      <button
        key={t.id}
        onClick={() => handleSelectTemplate(t.id)}
        className={`w-full text-left p-3 rounded-lg border transition-all ${
          selectedId === t.id && !isMobile
            ? 'bg-primary/10 border-primary ring-1 ring-primary/30'
            : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md shrink-0 ${isActive ? 'bg-green-500/10' : 'bg-muted'}`}>
            <Icon className={`h-4 w-4 ${isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {t.title}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {config?.description || t.description || t.key}
            </p>
          </div>
          <div className="shrink-0">
            {isActive ? (
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                Actif
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 opacity-60">
                Archive
              </Badge>
            )}
          </div>
        </div>
        {!t.active_version_id && (
          <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1 ml-11">
            <HelpCircle className="h-3 w-3" />
            Aucune version active
          </p>
        )}
      </button>
    );
  };

  // ─── List view ───
  const renderList = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-lg font-semibold">Prompts</h1>
          <p className="text-xs text-muted-foreground">
            {templates.length} template{templates.length > 1 ? 's' : ''}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={createTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={initializeDefaultPrompts}>
              <Sparkles className="h-4 w-4 mr-2" />
              Initialiser les prompts manquants
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {loading && <p className="text-sm text-muted-foreground p-2">Chargement...</p>}
        {!loading && templates.length === 0 && (
          <p className="text-sm text-muted-foreground p-2">Aucun template.</p>
        )}

        {!loading && groupedTemplates.active.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-green-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <CheckCircle2 className="h-3 w-3" />
              En production ({groupedTemplates.active.length})
            </h3>
            <div className="space-y-1.5">
              {groupedTemplates.active.map(renderTemplateItem)}
            </div>
          </div>
        )}

        {!loading && groupedTemplates.active.length > 0 && groupedTemplates.inactive.length > 0 && (
          <Separator />
        )}

        {!loading && groupedTemplates.inactive.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Archive className="h-3 w-3" />
              Archives ({groupedTemplates.inactive.length})
            </h3>
            <div className="space-y-1.5">
              {groupedTemplates.inactive.map(renderTemplateItem)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Detail view ───
  const renderDetail = () => {
    if (!selected) {
      return (
        <div className="h-full flex items-center justify-center text-center p-6">
          <div>
            <Sparkles className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Sélectionnez un template</p>
            <p className="text-sm text-muted-foreground/60 mt-1">pour l'éditer</p>
          </div>
        </div>
      );
    }

    const config = getPromptConfig(selected.key);
    const isProduction = isActivePrompt(selected.key);

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 -ml-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base truncate">
              {selected.title}
            </h2>
            {isProduction ? (
              <p className="text-xs text-green-500 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3" />
                En production
              </p>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Archive className="h-3 w-3" />
                Archivé
              </p>
            )}
          </div>
        </div>

        {/* Production warning banner */}
        {isProduction && (
          <div className="mx-4 mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Les modifications seront appliquées immédiatement à la génération.
            </p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0 mt-2">
          <TabsList className="mx-4 w-auto grid grid-cols-3">
            <TabsTrigger value="content" className="text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Contenu</span>
            </TabsTrigger>
            <TabsTrigger value="versions" className="text-xs gap-1.5">
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Versions</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* ─ Tab: Contenu ─ */}
          <TabsContent value="content" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Contenu du prompt</label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => handleCopyPrompt(newVersionDraft.content, 'draft')}
                  disabled={!newVersionDraft.content}
                >
                  {copiedId === 'draft' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  Copier
                </Button>
              </div>
              <Textarea
                value={newVersionDraft.content}
                onChange={e => setNewVersionDraft(v => ({ ...v, content: e.target.value }))}
                className="min-h-[40vh] font-mono text-xs leading-relaxed"
              />

              <div>
                <label className="text-sm font-medium">Changelog</label>
                <Input
                  value={newVersionDraft.changelog}
                  onChange={e => setNewVersionDraft(v => ({ ...v, changelog: e.target.value }))}
                  placeholder="Décrivez les modifications..."
                  className="mt-1"
                />
              </div>

              <Button
                onClick={createNewVersion}
                disabled={creatingVersion}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Créer une nouvelle version
              </Button>
            </div>
          </TabsContent>

          {/* ─ Tab: Versions ─ */}
          <TabsContent value="versions" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
            <div className="space-y-3 pt-3">
              {/* Carte d'action d'auto-optimisation IA pour les prompts d'histoire */}
              {selected.key.startsWith('story_prompt_') && (
                <Card className="p-3 bg-gradient-to-br from-purple-500/10 via-primary/5 to-background border-purple-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-purple-400">
                            Auto-Optimisation Continue (gpt-5.6-terra)
                          </h4>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-purple-500/40 text-purple-300">
                            n8n Flywheel
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Analyse les 20 dernières histoires, notes parents et critiques IA pour proposer une nouvelle version affinée.
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAutoOptimize}
                      disabled={optimizing}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs shrink-0 gap-1.5"
                    >
                      {optimizing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Analyse en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Lancer l'optimisation IA
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}

              {versions.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune version</p>
              )}
              {versions.map(v => {
                const isVersionActive = selected.active_version_id === v.id;
                const isAiGenerated = v.changelog?.includes('gpt-5.6-terra') || v.changelog?.includes('Auto-n8n');
                return (
                  <Card
                    key={v.id}
                    className={`p-3 ${isVersionActive ? 'border-primary bg-primary/5' : isAiGenerated ? 'border-purple-500/40 bg-purple-500/5' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="font-medium text-sm">v{v.version}</span>
                        {isVersionActive && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                            Active
                          </Badge>
                        )}
                        {isAiGenerated && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] flex items-center gap-1">
                            <Bot className="h-2.5 w-2.5" />
                            gpt-5.6-terra
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyPrompt(v.content, v.id)}
                          title="Copier"
                        >
                          {copiedId === v.id ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        {!isVersionActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setActivateConfirm({ versionId: v.id, versionNum: v.version })}
                          >
                            Activer
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{v.changelog || '—'}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(v.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Voir le contenu
                      </summary>
                      <pre className="mt-2 bg-muted p-2 rounded whitespace-pre-wrap text-xs font-mono max-h-[200px] overflow-auto">
                        {v.content}
                      </pre>
                    </details>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ─ Tab: Paramètres ─ */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
            <div className="space-y-4 pt-3">
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={metaDraft.title}
                  onChange={e => setMetaDraft(v => ({ ...v, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Clé technique</label>
                <Input
                  value={metaDraft.key}
                  onChange={e => setMetaDraft(v => ({ ...v, key: e.target.value }))}
                  className="mt-1 font-mono text-sm"
                />
                {isActivePrompt(metaDraft.key) && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Clé reconnue comme active
                  </p>
                )}
                {!isActivePrompt(metaDraft.key) && metaDraft.key && (
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Cette clé n'est pas liée à une fonctionnalité active
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={metaDraft.description}
                  onChange={e => setMetaDraft(v => ({ ...v, description: e.target.value }))}
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <Button onClick={saveMeta} disabled={savingMeta} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les paramètres
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ─── Main layout ───
  return (
    <AdminGuard>
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)]">
        {isMobile ? (
          // Mobile: drill-down navigation
          <Card className="flex-1 overflow-hidden">
            {mobileView === 'list' ? renderList() : renderDetail()}
          </Card>
        ) : (
          // Desktop: side-by-side
          <div className="flex-1 grid grid-cols-[320px_1fr] gap-4 p-6 min-h-0">
            <Card className="overflow-hidden">
              {renderList()}
            </Card>
            <Card className="overflow-hidden">
              {renderDetail()}
            </Card>
          </div>
        )}
      </div>

      {/* Activation confirmation dialog */}
      <AlertDialog open={!!activateConfirm} onOpenChange={(open) => !open && setActivateConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activer cette version ?</AlertDialogTitle>
            <AlertDialogDescription>
              La version <strong>v{activateConfirm?.versionNum}</strong> sera immédiatement utilisée en production
              pour la génération d'histoires. L'ancienne version restera disponible dans l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (activateConfirm) {
                  setActive(activateConfirm.versionId);
                  setActivateConfirm(null);
                }
              }}
            >
              Activer v{activateConfirm?.versionNum}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminGuard>
  );
};

export default PromptAdmin;
