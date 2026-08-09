import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryCritique } from "@/types/critique";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  Quote, 
  BookOpen, 
  Target, 
  Clock, 
  Layers
} from "lucide-react";
import { toast } from "sonner";

interface CritiqueDetailModalProps {
  critique: StoryCritique | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CritiqueDetailModal: React.FC<CritiqueDetailModalProps> = ({
  critique,
  open,
  onOpenChange,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!critique) return null;

  const score = Number(critique.overall_score) || 0;
  const ds = critique.detailed_scores || {};
  const meta = critique.stats || {};

  const getScoreColor = (val: number) => {
    if (val >= 8.5) return "text-emerald-500";
    if (val >= 7.0) return "text-green-500";
    if (val >= 5.5) return "text-amber-500";
    if (val >= 4.0) return "text-orange-500";
    return "text-rose-500";
  };

  const getBadgeVariant = (val: number) => {
    if (val >= 7.0) return "default";
    if (val >= 5.5) return "secondary";
    return "destructive";
  };

  const handleCopyMarkdown = () => {
    if (critique.markdown_report) {
      navigator.clipboard.writeText(critique.markdown_report);
      setCopied(true);
      toast.success("Rapport Markdown copié dans le presse-papier");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden bg-background/95 backdrop-blur-md border-border/80">
        <DialogHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-bold">{critique.title}</DialogTitle>
              <Badge variant={getBadgeVariant(score)} className="font-semibold text-xs">
                {critique.badge || `${score}/10`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-3">
              <span>🎯 Public : <strong>{critique.target_age}</strong></span>
              <span>•</span>
              <span>🧭 Objectif : <strong>{critique.objective}</strong></span>
              <span>•</span>
              <span>📅 Évalué le {new Date(critique.created_at).toLocaleDateString("fr-FR")}</span>
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copier le rapport</span>
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 space-y-6">
          {/* Note Globale & Verdict Banner */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-primary/10 via-background to-secondary/20 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verdict du Critique Littéraire
                </span>
                <p className="text-base font-medium italic mt-1 text-foreground">
                  « {critique.verdict} »
                </p>
              </div>
              <div className="text-right pl-4">
                <div className={`text-4xl font-extrabold tracking-tight ${getScoreColor(score)}`}>
                  {score.toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground">/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grille des 6 critères */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Grille des 6 Critères d'Édition Jeunesse
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Structure & Arc Narratif", val: ds.structure_rythme, desc: "Progression et dénouement mérité" },
                { label: "Style, Prosodie & Oralité", val: ds.style_prosodie_oralite, desc: "Musicalité pour la lecture à voix haute" },
                { label: "Personnages & Empathie", val: ds.personnages_empathie, desc: "Authenticité psychologique de l'enfant" },
                { label: "Originalité & Imaginaire", val: ds.originalite_imaginaire, desc: "Fraîcheur des situations sans clichés" },
                { label: "Adéquation Âge & Objectif", val: ds.adequation_objectif_age, desc: "Alignement avec la cible" },
                { label: "Règles Calmi (Onomatopées <= 3)", val: ds.rigueur_technique_calmi, desc: "Show, don't tell et sobriété" }
              ].map((c, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-border/60 bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-foreground">{c.label}</span>
                    <span className={`font-bold ${getScoreColor(c.val ?? 0)}`}>
                      {c.val !== undefined ? `${c.val}/10` : "N/A"}
                    </span>
                  </div>
                  <Progress value={(c.val ?? 0) * 10} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analyse de fond */}
          {critique.critique_summary && (
            <div className="space-y-2 p-4 rounded-xl bg-card border border-border">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Analyse de Fond & Réception Enfant
              </h4>
              {critique.critique_summary.executive_summary && (
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {critique.critique_summary.executive_summary}
                </p>
              )}
              {critique.critique_summary.audience_fit && (
                <div className="pt-2 border-t border-border/50 text-xs space-y-1">
                  <strong className="text-muted-foreground">Adéquation public : </strong>
                  <span>{critique.critique_summary.audience_fit}</span>
                </div>
              )}
              {critique.critique_summary.emotional_impact && (
                <div className="text-xs space-y-1">
                  <strong className="text-muted-foreground">Impact émotionnel réel : </strong>
                  <span>{critique.critique_summary.emotional_impact}</span>
                </div>
              )}
            </div>
          )}

          {/* Points Forts & Faiblesses en 2 colonnes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Points Forts */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-emerald-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Ce qui fonctionne ({critique.strengths?.length || 0})
              </h4>
              <div className="space-y-2.5">
                {critique.strengths && critique.strengths.length > 0 ? (
                  critique.strengths.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                      <div className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {s.aspect}
                      </div>
                      <p className="text-xs text-foreground/80 leading-snug">{s.analysis}</p>
                      {s.quote && (
                        <blockquote className="text-[11px] italic text-muted-foreground pl-2 border-l-2 border-emerald-500/40">
                          {s.quote}
                        </blockquote>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucun point fort particulier relevé.</p>
                )}
              </div>
            </div>

            {/* Faiblesses */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-rose-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Ce qui pêche & Clichés ({critique.weaknesses?.length || 0})
              </h4>
              <div className="space-y-2.5">
                {critique.weaknesses && critique.weaknesses.length > 0 ? (
                  critique.weaknesses.map((w, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-rose-600 dark:text-rose-400">
                          {w.issue}
                        </span>
                        <Badge
                          variant={w.severity === "critique" ? "destructive" : "outline"}
                          className="text-[10px] uppercase h-5"
                        >
                          {w.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground/80 leading-snug">{w.impact}</p>
                      {w.quote && (
                        <blockquote className="text-[11px] italic text-muted-foreground pl-2 border-l-2 border-rose-500/40">
                          {w.quote}
                        </blockquote>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucune faiblesse majeure signalée.</p>
                )}
              </div>
            </div>
          </div>

          {/* Plan d'action prioritaire */}
          {critique.actionable_improvements && critique.actionable_improvements.length > 0 && (
            <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Target className="w-4 h-4" />
                Plan d'Action & Recommandations pour le Prompteur
              </h4>
              <div className="space-y-2">
                {critique.actionable_improvements.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[11px]">
                      {act.priority || idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-foreground">[{act.target_area}] : </span>
                      <span className="text-muted-foreground">{act.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Atelier de Réécriture Avant / Après */}
          {critique.rewrite_demonstration?.rewritten_version && (
            <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-background to-secondary/10 border border-primary/20">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Sparkles className="w-4 h-4" />
                Démonstration de Réécriture (Avant vs Après)
              </h4>
              {critique.rewrite_demonstration.scene_context && (
                <p className="text-xs text-muted-foreground">
                  Contexte : {critique.rewrite_demonstration.scene_context}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-1">
                  <span className="font-semibold text-muted-foreground">Version Originale :</span>
                  <p className="italic text-foreground/80 leading-relaxed">
                    « {critique.rewrite_demonstration.original_excerpt} »
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 space-y-1">
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Version Sublimée :
                  </span>
                  <p className="font-medium text-foreground leading-relaxed">
                    « {critique.rewrite_demonstration.rewritten_version} »
                  </p>
                </div>
              </div>
              {critique.rewrite_demonstration.editor_explanation && (
                <p className="text-[11px] text-muted-foreground italic pt-1">
                  💡 <strong>Note de l'éditeur :</strong> {critique.rewrite_demonstration.editor_explanation}
                </p>
              )}
            </div>
          )}

          {/* Métriques quantitatives */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2 text-xs">
            <h4 className="font-semibold flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Indicateurs Techniques Calmiverse
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="p-2 rounded bg-background border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Mots</span>
                <strong className="text-sm">{meta.actualWordCount || critique.actual_word_count}</strong>
              </div>
              <div className="p-2 rounded bg-background border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Mots / Phrase</span>
                <strong className="text-sm">{meta.avgWordsPerSentence || "N/A"}</strong>
              </div>
              <div className="p-2 rounded bg-background border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Onomatopées</span>
                <strong className={`text-sm ${(meta.onomatopoeiaCount ?? 0) > 3 ? "text-rose-500" : "text-emerald-500"}`}>
                  {meta.onomatopoeiaCount ?? 0} / max 3
                </strong>
              </div>
              <div className="p-2 rounded bg-background border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Clichés IA Détectés</span>
                <strong className="text-sm">
                  {meta.detectedCliches && meta.detectedCliches.length > 0 ? meta.detectedCliches.length : "0"}
                </strong>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
