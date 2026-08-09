import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { storyCritiqueService } from "@/services/critique/storyCritiqueService";
import { StoryCritique } from "@/types/critique";
import { 
  Sparkles, 
  Loader2, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Target, 
  Copy, 
  Check, 
  Layers, 
  Send, 
  Search,
  RotateCcw,
  Sparkle
} from "lucide-react";

const AGE_OPTIONS = ["0-2 ans", "2-4 ans", "4-6 ans", "8-12 ans", "13+ ans"];
const OBJECTIVE_OPTIONS = [
  { value: "sleep", label: "Sommeil (Coucher / Apaisement)" },
  { value: "fun", label: "Humour / Fun (Rire & Énergie)" },
  { value: "courage", label: "Courage / Confiance en soi" },
  { value: "focus", label: "Concentration / Attention" },
  { value: "autonomy", label: "Autonomie & Grandir" },
  { value: "situation_conflict", label: "Gestion des conflits" }
];

interface UnitAnalysisTabProps {
  onCritiqueCreated?: () => void;
}

export const UnitAnalysisTab: React.FC<UnitAnalysisTabProps> = ({ onCritiqueCreated }) => {
  const [mode, setMode] = useState<"database" | "sandbox">("database");
  const [loadingStories, setLoadingStories] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [storySearch, setStorySearch] = useState("");

  // Form State
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAge, setTargetAge] = useState("4-6 ans");
  const [objective, setObjective] = useState("sleep");
  const [targetWordCount, setTargetWordCount] = useState(300);

  // Evaluation State
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationStage, setEvaluationStage] = useState("");
  const [resultCritique, setResultCritique] = useState<StoryCritique | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);

  useEffect(() => {
    loadDatabaseStories();
  }, []);

  const loadDatabaseStories = async () => {
    setLoadingStories(true);
    try {
      const data = await storyCritiqueService.fetchStoriesForEvaluation(30);
      setStories(data);
    } catch (err: any) {
      toast.error("Erreur chargement des histoires: " + err.message);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleSelectStory = (st: any) => {
    setSelectedStoryId(st.id);
    setTitle(st.title);
    setContent(st.content);
    setObjective(st.objective || "sleep");
    toast.info(`Histoire « ${st.title} » sélectionnée`);
  };

  const handleRunEvaluation = async () => {
    if (!content || content.trim().length < 20) {
      toast.error("Veuillez fournir un texte d'histoire d'au moins 20 caractères.");
      return;
    }

    setEvaluating(true);
    setResultCritique(null);
    setEvaluationStage("Transmission au juré littéraire n8n...");

    try {
      const timer = setTimeout(() => {
        setEvaluationStage("Analyse stylistique et prosodique en cours (GPT-4o)...");
      }, 2500);

      const critique = await storyCritiqueService.evaluateStory({
        title: title || "Histoire sans titre",
        content,
        targetAge,
        objective,
        targetWordCount,
        storyId: selectedStoryId,
        saveToDb: true
      });

      clearTimeout(timer);
      setResultCritique(critique);
      toast.success(`Évaluation terminée : Note de ${critique.overall_score}/10 !`);
      if (onCritiqueCreated) {
        onCritiqueCreated();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Échec de l'évaluation: " + err.message);
    } finally {
      setEvaluating(false);
      setEvaluationStage("");
    }
  };

  const handleCopyReport = () => {
    if (resultCritique?.markdown_report) {
      navigator.clipboard.writeText(resultCritique.markdown_report);
      setCopiedMd(true);
      toast.success("Rapport Markdown copié !");
      setTimeout(() => setCopiedMd(false), 2000);
    }
  };

  const filteredStories = stories.filter((s) =>
    s.title.toLowerCase().includes(storySearch.toLowerCase()) ||
    s.objective.toLowerCase().includes(storySearch.toLowerCase())
  );

  const getScoreColor = (val: number) => {
    if (val >= 8.5) return "text-emerald-500";
    if (val >= 7.0) return "text-green-500";
    if (val >= 5.5) return "text-amber-500";
    if (val >= 4.0) return "text-orange-500";
    return "text-rose-500";
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de Mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Atelier d'Évaluation Unitaire
          </h2>
          <p className="text-sm text-muted-foreground">
            Soumettez une histoire au critique littéraire pour obtenir un audit sans complaisance et un plan d'amélioration.
          </p>
        </div>
        <Tabs value={mode} onValueChange={(v: any) => setMode(v)}>
          <TabsList>
            <TabsTrigger value="database" className="flex items-center gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              Depuis la base de données
            </TabsTrigger>
            <TabsTrigger value="sandbox" className="flex items-center gap-1.5 text-xs">
              <Sparkle className="w-3.5 h-3.5" />
              Bac à sable (Texte libre)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne de Gauche : Sélecteur / Formulaire */}
        <div className="lg:col-span-5 space-y-4">
          {mode === "database" && (
            <Card className="border-border">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Histoires récentes générées</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={loadDatabaseStories}
                    disabled={loadingStories}
                    className="h-7 px-2 text-xs"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${loadingStories ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="pt-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Filtrer par titre ou objectif..."
                      value={storySearch}
                      onChange={(e) => setStorySearch(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 max-h-[300px] overflow-y-auto space-y-2">
                {loadingStories ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    Chargement des histoires...
                  </div>
                ) : filteredStories.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">Aucune histoire trouvée.</p>
                ) : (
                  filteredStories.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleSelectStory(st)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedStoryId === st.id
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 hover:border-primary/40 bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate text-foreground">{st.title}</span>
                        {st.alreadyEvaluated && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-emerald-500 border-emerald-500/30">
                            Déjà évaluée
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                        <span>🎯 {st.objective}</span>
                        <span>{new Date(st.createdat).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Formulaire de configuration de l'histoire */}
          <Card className="border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Paramètres de l'histoire</CardTitle>
              <CardDescription className="text-xs">
                Ajustez les métadonnées pour affiner l'évaluation du critique.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Titre de l'histoire</label>
                <Input
                  placeholder="Ex : Le voyage du petit ours"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Public Cible (Âge)</label>
                  <Select value={targetAge} onValueChange={setTargetAge}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((a) => (
                        <SelectItem key={a} value={a} className="text-xs">
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Objectif</label>
                  <Select value={objective} onValueChange={setObjective}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OBJECTIVE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-foreground">Longueur cible</label>
                  <span className="text-muted-foreground font-mono">{targetWordCount} mots</span>
                </div>
                <Input
                  type="number"
                  min={50}
                  max={2000}
                  step={50}
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-foreground">Texte intégral de l'histoire</label>
                  <span className="text-[10px] text-muted-foreground">
                    {content ? `${content.split(/\s+/).filter(Boolean).length} mots` : "0 mot"}
                  </span>
                </div>
                <Textarea
                  placeholder="Collez ou rédigez ici le texte complet de l'histoire..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="text-xs leading-relaxed font-serif resize-y"
                />
              </div>

              <Button
                onClick={handleRunEvaluation}
                disabled={evaluating || !content.trim()}
                className="w-full h-9 flex items-center justify-center gap-2 font-semibold shadow-md"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Évaluation en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Lancer la Critique Littéraire</span>
                  </>
                )}
              </Button>

              {evaluating && (
                <div className="p-3 rounded-lg bg-muted/40 border border-primary/20 text-center space-y-2 animate-pulse">
                  <p className="text-xs font-medium text-primary">{evaluationStage}</p>
                  <Progress value={65} className="h-1" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne de Droite : Résultat & Rapport Critique */}
        <div className="lg:col-span-7">
          {resultCritique ? (
            <div className="space-y-4">
              {/* Carte Score & Punchline */}
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/10 shadow-sm overflow-hidden">
                <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold">{resultCritique.title}</CardTitle>
                      <Badge className="font-semibold text-xs">{resultCritique.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Public : <strong>{resultCritique.target_age}</strong> • Objectif : <strong>{resultCritique.objective}</strong> • Longueur : <strong>{resultCritique.actual_word_count} mots</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopyReport} className="h-8 gap-1 text-xs">
                      {copiedMd ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copier Markdown</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/80 border border-border">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Verdict du Critique
                      </span>
                      <p className="text-sm font-medium italic text-foreground">
                        « {resultCritique.verdict} »
                      </p>
                    </div>
                    <div className="text-right pl-4">
                      <div className={`text-4xl font-black ${getScoreColor(resultCritique.overall_score)}`}>
                        {Number(resultCritique.overall_score).toFixed(1)}
                        <span className="text-sm font-normal text-muted-foreground">/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Grille des 6 critères */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Sous-scores par critère éditorial
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: "Structure & Arc", val: resultCritique.detailed_scores?.structure_rythme },
                        { label: "Style & Oralité", val: resultCritique.detailed_scores?.style_prosodie_oralite },
                        { label: "Personnages", val: resultCritique.detailed_scores?.personnages_empathie },
                        { label: "Originalité", val: resultCritique.detailed_scores?.originalite_imaginaire },
                        { label: "Adéquation Âge", val: resultCritique.detailed_scores?.adequation_objectif_age },
                        { label: "Règles Calmi", val: resultCritique.detailed_scores?.rigueur_technique_calmi }
                      ].map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg border border-border bg-card/60 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-muted-foreground truncate">{item.label}</span>
                            <span className={`font-bold ${getScoreColor(item.val ?? 0)}`}>
                              {item.val !== undefined ? `${item.val}/10` : "N/A"}
                            </span>
                          </div>
                          <Progress value={(item.val ?? 0) * 10} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Analyse de fond */}
                  {resultCritique.critique_summary?.executive_summary && (
                    <div className="p-3.5 rounded-lg bg-card border border-border text-xs space-y-2">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        Synthèse d'analyse
                      </span>
                      <p className="text-foreground/80 leading-relaxed">
                        {resultCritique.critique_summary.executive_summary}
                      </p>
                    </div>
                  )}

                  {/* Points Forts & Faiblesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Points forts */}
                    <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ce qui fonctionne
                      </span>
                      <div className="space-y-2">
                        {resultCritique.strengths && resultCritique.strengths.length > 0 ? (
                          resultCritique.strengths.map((s, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <strong className="block text-[11px] text-foreground">{s.aspect}</strong>
                              <p className="text-[11px] text-foreground/80">{s.analysis}</p>
                              {s.quote && (
                                <blockquote className="text-[10px] italic text-muted-foreground pl-1.5 border-l-2 border-emerald-500/40">
                                  {s.quote}
                                </blockquote>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">Aucun point fort relevé.</p>
                        )}
                      </div>
                    </div>

                    {/* Faiblesses */}
                    <div className="p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-2">
                      <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Ce qui pêche & Clichés
                      </span>
                      <div className="space-y-2">
                        {resultCritique.weaknesses && resultCritique.weaknesses.length > 0 ? (
                          resultCritique.weaknesses.map((w, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <strong className="text-[11px] text-foreground">{w.issue}</strong>
                                <Badge variant={w.severity === "critique" ? "destructive" : "outline"} className="text-[9px] px-1 py-0 uppercase">
                                  {w.severity}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-foreground/80">{w.impact}</p>
                              {w.quote && (
                                <blockquote className="text-[10px] italic text-muted-foreground pl-1.5 border-l-2 border-rose-500/40">
                                  {w.quote}
                                </blockquote>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">Aucune faiblesse majeure.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plan d'action prioritaire */}
                  {resultCritique.actionable_improvements && resultCritique.actionable_improvements.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-card border border-border text-xs space-y-2">
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        Recommandations & Actions pour le Prompteur
                      </span>
                      <div className="space-y-1.5">
                        {resultCritique.actionable_improvements.map((act, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px]">
                            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                              {act.priority || idx + 1}
                            </span>
                            <div>
                              <strong>[{act.target_area}]</strong> : <span className="text-muted-foreground">{act.recommendation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Démonstration de réécriture */}
                  {resultCritique.rewrite_demonstration?.rewritten_version && (
                    <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-2">
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Atelier Réécriture (Avant vs Après)
                      </span>
                      <div className="space-y-2 text-[11px]">
                        <div className="p-2 rounded bg-muted/40 border border-border">
                          <span className="text-muted-foreground block font-medium">Original :</span>
                          <p className="italic text-foreground/80">« {resultCritique.rewrite_demonstration.original_excerpt} »</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10 border border-primary/30">
                          <span className="text-primary block font-medium">🌟 Sublimé par le juré :</span>
                          <p className="font-semibold text-foreground">« {resultCritique.rewrite_demonstration.rewritten_version} »</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-muted/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-sm font-semibold">Aucune histoire évaluée pour le moment</h3>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez une histoire à gauche ou collez un texte dans le bac à sable, puis cliquez sur <strong>Lancer la Critique</strong> pour faire auditer le récit.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
