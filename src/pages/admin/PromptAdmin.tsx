import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminGuard from "@/components/admin/AdminGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, CheckCircle2, Zap, BookOpen, Sparkles, Archive, HelpCircle } from "lucide-react";

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

// Configuration des prompts actifs en production
// Ces clés correspondent aux prompts réellement utilisés dans le code
const ACTIVE_PROMPTS_CONFIG: Record<string, {
  label: string;
  description: string;
  category: 'generation' | 'sequel' | 'other';
  icon: React.ElementType;
}> = {
  'advanced_story_prompt_template': {
    label: '🟢 Génération histoire (n8n)',
    description: 'Template principal envoyé à n8n pour créer les histoires',
    category: 'generation',
    icon: Sparkles,
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
    description: 'Prompt pour la création de l\'image de couverture (contient des variables n8n)',
    category: 'generation',
    icon: Sparkles,
  },
  'video_generation_prompt': {
    label: '🎥 Génération Vidéo',
    description: 'Prompt pour la création de la vidéo d\'introduction (contient des variables n8n)',
    category: 'generation',
    icon: Sparkles,
  },
  'story_prompt_sleep': {
    label: '🌙 Histoire du Soir (Sleep)',
    description: 'Prompt spécifique pour l\'objectif Sommeil/Endormissement',
    category: 'generation',
    icon: Sparkles,
  },
  'story_prompt_focus': {
    label: '🧠 Histoire Focus',
    description: 'Prompt spécifique pour l\'objectif Concentration/Éveil',
    category: 'generation',
    icon: Sparkles,
  },
  'story_prompt_relax': {
    label: '🌸 Histoire Détente (Relax)',
    description: 'Prompt spécifique pour l\'objectif Relaxation/Calme',
    category: 'generation',
    icon: Sparkles,
  },
  'story_prompt_fun': {
    label: '🎉 Histoire Fun',
    description: 'Prompt spécifique pour l\'objectif Amusement/Aventure',
    category: 'generation',
    icon: Sparkles,
  },
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'generation': return 'Génération d\'histoires';
    case 'sequel': return 'Suites & Séries';
    default: return 'Autres';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'generation': return Sparkles;
    case 'sequel': return BookOpen;
    default: return Archive;
  }
};

const PromptAdmin: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [savingMeta, setSavingMeta] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);

  const selected = useMemo(
    () => templates.find(t => t.id === selectedId) || null,
    [templates, selectedId]
  );

  const [metaDraft, setMetaDraft] = useState<{ title: string; description: string; key: string }>({
    title: "",
    description: "",
    key: "",
  });

  const [newVersionDraft, setNewVersionDraft] = useState<{ content: string; changelog: string }>(
    { content: "", changelog: "" }
  );

  // Grouper les templates par catégorie
  const groupedTemplates = useMemo(() => {
    const active: PromptTemplate[] = [];
    const inactive: PromptTemplate[] = [];

    templates.forEach(t => {
      if (ACTIVE_PROMPTS_CONFIG[t.key]) {
        active.push(t);
      } else {
        inactive.push(t);
      }
    });

    return { active, inactive };
  }, [templates]);

  useEffect(() => {
    document.title = "Administration des prompts | Calmiverse";
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
Objectif : Les titres doivent captiver l’attention tout en respectant l’intention du thème.
- "sleep" : choisis des titres doux, rassurants et poétiques.
- "focus" : choisis des titres engageants, stimulant la curiosité et l’attention.
- "relax" : choisis des titres apaisants, inspirant le calme et la légèreté.
- "fun" : choisis des titres drôles, surprenants et qui déclenche un sourire aux lecteurs (enfants).
Chaque titre doit :
- Être adapté à des enfants de 3 à 8 ans
- Contenir maximum 10 mots
- Donner envie d’écouter l’histoire."

ATTENTION : Concernant les titres proposés, je veux que les règles d'écriture de la langue française soit respectée. C'est à dire que les majuscules soient pour la première lettre du titre et ensuite, seulement pour les noms propres.

Les titres doivent être courts en interdisant les adjectifs qualificatifs laudatifs (exemple : merveilleux, surprenant, brillant, joyeux, farfelue, magique, etc.). Évite aussi les titres de type : "Quelche-chose qui fait une action". Inspire toi de la littérature jeunesse sans jamais répéter un titre déjà existant.

Pour le titre de l'histoire (title),analyse utilise la mémoire "title_memory" et crée trois titres originaux qui sont différents des titres des 10 dernières histoires. Je souhaite que les titres ne contiennent pas les noms des enfants pour laquelle est créée l'histoire. Ne mets donc pas de nom d'enfant dans le titre des histoires.

Renvoie le nombre de tokens iuput, le nombre de tokens output et le modèle llm utilisé (gpt-5) dans les variable "input_tokens", "output_tokens" et "model_llm" du json en sortie.

Je veux que tu retournes un format json à l'aide de l’outil structured output parser.

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

      // 1. Récupérer le contenu du prompt générique actuel pour l'utiliser comme base
      // Ou utiliser une base vide si aucun n'existe
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

      // Liste des clés à initialiser (ajout des titre + les 4 objectifs + image + vidéo)
      const keysToInit = [
        'title_generation_prompt',
        'image_generation_prompt',
        'video_generation_prompt',
        'story_prompt_sleep',
        'story_prompt_focus',
        'story_prompt_relax',
        'story_prompt_fun'
      ];

      let initCount = 0;

      for (const key of keysToInit) {
        const config = ACTIVE_PROMPTS_CONFIG[key];
        const existing = templates.find(t => t.key === key);

        if (!existing) {
          // Déterminer le contenu initial
          let initialContent = "";
          if (key === 'title_generation_prompt') {
            initialContent = DEFAULT_TITLE_PROMPT;
          } else if (key === 'image_generation_prompt') {
            initialContent = DEFAULT_IMAGE_PROMPT;
          } else if (key === 'video_generation_prompt') {
            initialContent = DEFAULT_VIDEO_PROMPT;
          } else {
            // Pour les prompts d'histoire, on utilise le prompt générique s'il existe, sinon un placeholder
            initialContent = baseContent || "Génère une histoire pour enfants...";
          }

          // Créer le template
          const { data: templateData, error: templateError } = await supabase
            .from("prompt_templates")
            .insert({
              key: key as string,
              title: config.label.replace('🟢 ', '').replace('🌙 ', '').replace('🧠 ', '').replace('🌸 ', '').replace('🎉 ', ''),
              description: config.description,
              created_by: userId
            })
            .select("id")
            .single();

          if (templateError) {
            console.error(`Erreur création template ${key}:`, templateError);
            continue;
          }

          // Créer la version initiale
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

          if (versionError) {
            console.error(`Erreur création version ${key}:`, versionError);
            continue;
          }

          // Activer la version
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
      if (data?.id) setSelectedId(data.id);
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
      toast({ title: "Version activée" });
      await fetchTemplates();
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const isActivePrompt = (key: string) => !!ACTIVE_PROMPTS_CONFIG[key];
  const getPromptConfig = (key: string) => ACTIVE_PROMPTS_CONFIG[key];

  const renderTemplateButton = (t: PromptTemplate) => {
    const config = getPromptConfig(t.key);
    const isActive = isActivePrompt(t.key);
    const Icon = config?.icon || Archive;

    return (
      <button
        key={t.id}
        onClick={() => setSelectedId(t.id)}
        className={`w-full text-left p-3 rounded-lg border transition-all ${selectedId === t.id
          ? 'bg-primary/10 border-primary ring-1 ring-primary/30'
          : 'hover:bg-muted/50 hover:border-muted-foreground/20'
          }`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-1.5 rounded-md ${isActive ? 'bg-green-500/10' : 'bg-muted'}`}>
            <Icon className={`h-4 w-4 ${isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">
                {config?.label || t.title}
              </span>
              {isActive && (
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                  En production
                </Badge>
              )}
              {!isActive && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 opacity-60">
                  Non utilisé
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {config?.description || t.description || t.key}
            </p>
            {!t.active_version_id && (
              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Aucune version active
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <AdminGuard>
      <div className="flex flex-col h-[calc(100vh-2rem)] p-4 md:p-6 gap-4">
        <header className="flex-none">
          <h1 className="text-2xl font-semibold">Administration des prompts</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les templates et leurs versions utilisées pour la génération des histoires.
          </p>
        </header>

        {/* Légende */}
        <Card className="flex-none p-3 bg-muted/30">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                En production
              </Badge>
              <span className="text-muted-foreground">= Prompt utilisé dans l'application</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="opacity-60">Non utilisé</Badge>
              <span className="text-muted-foreground">= Prompt archivé ou en développement</span>
            </div>
          </div>
        </Card>

        <section className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
          {/* Liste des templates (Sidebar) - Scroll indépendant */}
          <Card className="flex flex-col h-full overflow-hidden">
            <div className="p-4 flex-none space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Templates
                </h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={initializeDefaultPrompts} title="Initialiser les prompts manquants">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={createTemplate}>
                    <Plus className="h-4 w-4 mr-1" /> Nouveau
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="flex-none" />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}

              {!loading && templates.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun template.</p>
              )}

              {/* Prompts actifs en production */}
              {!loading && groupedTemplates.active.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-green-500 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-background/95 backdrop-blur py-1 z-10">
                    <CheckCircle2 className="h-3 w-3" />
                    Actifs ({groupedTemplates.active.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTemplates.active.map(renderTemplateButton)}
                  </div>
                </div>
              )}

              {/* Separator visual between groups */}
              {!loading && groupedTemplates.active.length > 0 && groupedTemplates.inactive.length > 0 && (
                <Separator className="my-4" />
              )}

              {/* Prompts non utilisés */}
              {!loading && groupedTemplates.inactive.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-background/95 backdrop-blur py-1 z-10">
                    <Archive className="h-3 w-3" />
                    Archives ({groupedTemplates.inactive.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTemplates.inactive.map(renderTemplateButton)}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Détail du template sélectionné - Scroll indépendant */}
          <div className="md:col-span-2 h-full overflow-y-auto pr-1 space-y-4">
            {selected ? (
              <>
                {/* Status banner */}
                {isActivePrompt(selected.key) ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-green-400">Ce prompt est utilisé en production</p>
                      <p className="text-xs text-green-400/70">
                        Les modifications seront appliquées immédiatement à la génération d'histoires.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 border border-muted rounded-lg p-3 flex items-center gap-3">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ce prompt n'est pas utilisé actuellement</p>
                      <p className="text-xs text-muted-foreground/70">
                        Il s'agit d'un prompt archivé ou en développement.
                      </p>
                    </div>
                  </div>
                )}

                <Card className="p-4 space-y-3">
                  <h2 className="font-medium">Métadonnées</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">Titre</label>
                      <Input value={metaDraft.title} onChange={e => setMetaDraft(v => ({ ...v, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm">Clé technique</label>
                      <Input
                        value={metaDraft.key}
                        onChange={e => setMetaDraft(v => ({ ...v, key: e.target.value }))}
                        className="font-mono text-sm"
                      />
                      {isActivePrompt(metaDraft.key) && (
                        <p className="text-xs text-green-500 mt-1">✓ Clé reconnue comme active</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm">Description</label>
                      <Textarea value={metaDraft.description} onChange={e => setMetaDraft(v => ({ ...v, description: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveMeta} disabled={savingMeta}>
                      <Save className="h-4 w-4 mr-1" /> Enregistrer
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium">Versions</h2>
                    <Button variant="secondary" onClick={createNewVersion} disabled={creatingVersion}>
                      Créer une nouvelle version
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Contenu (nouvelle version)</label>
                    <Textarea
                      value={newVersionDraft.content}
                      onChange={e => setNewVersionDraft(v => ({ ...v, content: e.target.value }))}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <label className="text-sm">Changelog</label>
                    <Input
                      value={newVersionDraft.changelog}
                      onChange={e => setNewVersionDraft(v => ({ ...v, changelog: e.target.value }))}
                      placeholder="Décrivez les modifications apportées..."
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3 mt-4">
                    {versions.map(v => (
                      <div key={v.id} className={`p-3 rounded-md border ${selected.active_version_id === v.id
                        ? 'border-primary bg-primary/5'
                        : ''
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Version v{v.version}</span>
                            {selected.active_version_id === v.id && (
                              <Badge className="bg-primary/20 text-primary border-primary/30">
                                Version active
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {selected.active_version_id !== v.id && (
                              <Button size="sm" variant="outline" onClick={() => setActive(v.id)}>
                                Activer cette version
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{v.changelog}</p>
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Voir le contenu
                          </summary>
                          <pre className="mt-2 bg-muted p-2 rounded whitespace-pre-wrap text-sm font-mono max-h-[300px] overflow-auto">
                            {v.content}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-6 h-full flex items-center justify-center text-center">
                <div>
                  <Sparkles className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Sélectionnez un template dans la liste pour l'éditer.</p>
                  <p className="text-sm text-muted-foreground/60 mt-2">Vous pourrez gérer ses versions et son contenu.</p>
                </div>
              </Card>
            )}
          </div>
        </section>
      </div>
    </AdminGuard>
  );
};

export default PromptAdmin;
