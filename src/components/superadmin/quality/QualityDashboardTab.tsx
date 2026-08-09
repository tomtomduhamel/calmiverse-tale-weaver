import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoryCritique, QualityKPIs } from "@/types/critique";
import { 
  TrendingUp, 
  Award, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  RotateCcw, 
  Layers, 
  BookOpen, 
  Sparkles,
  ShieldCheck,
  Target,
  FileText
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

interface QualityDashboardTabProps {
  critiques: StoryCritique[];
  kpis: QualityKPIs;
  loading: boolean;
  ageFilter: string;
  onAgeFilterChange: (age: string) => void;
  objectiveFilter: string;
  onObjectiveFilterChange: (obj: string) => void;
  onRefresh: () => void;
  onSelectCritique: (critique: StoryCritique) => void;
  onNavigateToUnitAnalysis: () => void;
}

const AGE_FILTER_OPTIONS = [
  { value: "all", label: "Toutes les tranches d'âge" },
  { value: "0-2 ans", label: "0-2 ans" },
  { value: "2-4 ans", label: "2-4 ans" },
  { value: "4-6 ans", label: "4-6 ans" },
  { value: "8-12 ans", label: "8-12 ans" },
  { value: "13+ ans", label: "13+ ans" }
];

const OBJECTIVE_FILTER_OPTIONS = [
  { value: "all", label: "Tous les objectifs" },
  { value: "sleep", label: "Sommeil / Coucher" },
  { value: "fun", label: "Humour / Fun" },
  { value: "courage", label: "Courage / Confiance" },
  { value: "focus", label: "Concentration" },
  { value: "autonomy", label: "Autonomie" },
  { value: "situation_conflict", label: "Gestion des conflits" }
];

export const QualityDashboardTab: React.FC<QualityDashboardTabProps> = ({
  critiques,
  kpis,
  loading,
  ageFilter,
  onAgeFilterChange,
  objectiveFilter,
  onObjectiveFilterChange,
  onRefresh,
  onSelectCritique,
  onNavigateToUnitAnalysis
}) => {
  const getScoreBadge = (score: number) => {
    if (score >= 8.5) return { label: "Chef-d'œuvre", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
    if (score >= 7.0) return { label: "Très bon niveau", color: "bg-green-500/10 text-green-600 border-green-500/30" };
    if (score >= 5.5) return { label: "Passable", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
    if (score >= 4.0) return { label: "Brouillon", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" };
    return { label: "À revoir", color: "bg-rose-500/10 text-rose-600 border-rose-500/30" };
  };

  const radarData = useMemo(() => {
    return kpis.criteriaAverages.map((c) => ({
      subject: c.label.replace(" & ", "\n& "),
      score: c.score,
      fullMark: 10
    }));
  }, [kpis]);

  return (
    <div className="space-y-6">
      {/* Barre de Filtres & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filtres analytiques</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Select value={ageFilter} onValueChange={onAgeFilterChange}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGE_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={objectiveFilter} onValueChange={onObjectiveFilterChange}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJECTIVE_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Rafraîchir</span>
          </Button>

          <Button
            size="sm"
            onClick={onNavigateToUnitAnalysis}
            className="h-8 px-3 text-xs gap-1.5 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nouvelle évaluation</span>
          </Button>
        </div>
      </div>

      {/* Cartes KPI Principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Note Moyenne */}
        <Card className="border-border bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Note Moyenne</span>
              <Award className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-black tracking-tight flex items-baseline gap-1.5">
              <span>{kpis.meanScore > 0 ? kpis.meanScore.toFixed(1) : "—"}</span>
              <span className="text-xs font-normal text-muted-foreground">/10</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Badge variant="outline" className={`text-[10px] ${getScoreBadge(kpis.meanScore).color}`}>
              {getScoreBadge(kpis.meanScore).label}
            </Badge>
          </CardContent>
        </Card>

        {/* Note Médiane */}
        <Card className="border-border bg-gradient-to-br from-card to-secondary/5">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Note Médiane</span>
              <TrendingUp className="w-4 h-4 text-secondary-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl font-black tracking-tight flex items-baseline gap-1.5">
              <span>{kpis.medianScore > 0 ? kpis.medianScore.toFixed(1) : "—"}</span>
              <span className="text-xs font-normal text-muted-foreground">/10</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">Valeur centrale robuste</p>
          </CardContent>
        </Card>

        {/* Total Histoires Évaluées */}
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Histoires Évaluées</span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-black tracking-tight">
              {kpis.totalEvaluated}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">Dans l'échantillon filtré</p>
          </CardContent>
        </Card>

        {/* Taux de Réussite (>= 7.0) */}
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Qualité Pro (≥ 7.0/10)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {kpis.passRatePercent}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">Niveau publiable jeunesse</p>
          </CardContent>
        </Card>

        {/* Conformité Règles Calmi */}
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Conformité Calmi</span>
              <ShieldCheck className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-black tracking-tight text-primary">
              {kpis.calmiComplianceRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">Onomatopées ≤ 3 & sans morale</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques Principaux : Tendance Temporelle & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tendance Chronologique */}
        <Card className="lg:col-span-7 border-border">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Évolution de la Qualité des Histoires (Tendance)
                </CardTitle>
                <CardDescription className="text-xs">
                  Suivi de la note globale sur les dernières histoires générées
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">Cible: ≥ 7.5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            {kpis.timeline.length > 0 ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpis.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg p-2.5 bg-background border border-border shadow-md text-xs space-y-1">
                              <p className="font-bold text-foreground">{data.title}</p>
                              <p className="text-primary font-semibold">Note : {data.score}/10</p>
                              <p className="text-[10px] text-muted-foreground">Âge : {data.age} • {data.date}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground italic">
                Pas assez de données pour afficher la courbe de tendance.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar des 6 Critères Éditoriaux */}
        <Card className="lg:col-span-5 border-border">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Radar des 6 Piliers Littéraires
            </CardTitle>
            <CardDescription className="text-xs">
              Moyennes des critères d'édition jeunesse (sur 10)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {kpis.totalEvaluated > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid opacity={0.2} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} angle={30} />
                    <Radar
                      name="Moyenne"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground italic">
                Aucune évaluation disponible.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribution des Notes & Détails des Critères */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Distribution par segments */}
        <Card className="lg:col-span-5 border-border">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Distribution des Notes
            </CardTitle>
            <CardDescription className="text-xs">
              Répartition des récits par tranche de qualité
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-4 space-y-3">
            {kpis.distribution.map((d, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">{d.label}</span>
                  <span className="text-muted-foreground font-mono">
                    {d.count} ({d.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.percentage}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Moyennes Détaillées des 6 Critères */}
        <Card className="lg:col-span-7 border-border">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Moyennes Détaillées par Pilier Éditorial
            </CardTitle>
            <CardDescription className="text-xs">
              Diagnostics sur les compétences d'écriture du générateur
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {kpis.criteriaAverages.map((c, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-border bg-card/60 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">{c.label}</span>
                    <span className="font-bold font-mono text-primary">{c.score}/10</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{c.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problèmes Récurrents & Points Forts Généralisés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problèmes Récurrents */}
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Problèmes & Clichés Récurrents (Axes d'Amélioration Prompt)
            </CardTitle>
            <CardDescription className="text-xs">
              Faiblesses signalées le plus fréquemment par le critique
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            {kpis.topIssues.length > 0 ? (
              kpis.topIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-rose-500/20 bg-background/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-foreground">{issue.issue}</strong>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] text-rose-500 border-rose-500/30">
                        {issue.count}x détecté
                      </Badge>
                      <Badge
                        variant={issue.severity === "critique" ? "destructive" : "secondary"}
                        className="text-[9px] uppercase px-1 py-0"
                      >
                        {issue.severity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{issue.impact}</p>
                  {issue.sampleQuote && (
                    <blockquote className="text-[10px] italic text-rose-600 dark:text-rose-400 border-l border-rose-500/40 pl-1.5 mt-1">
                      « {issue.sampleQuote} »
                    </blockquote>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                Aucun problème récurrent détecté pour l'instant.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Points Forts Généralisés */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Ce qui est bien géré de manière générale
            </CardTitle>
            <CardDescription className="text-xs">
              Points forts solides validés régulièrement par le critique
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            {kpis.topStrengths.length > 0 ? (
              kpis.topStrengths.map((str, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-emerald-500/20 bg-background/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-foreground">{str.aspect}</strong>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                      {str.count}x validé
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{str.sampleAnalysis}</p>
                  {str.sampleQuote && (
                    <blockquote className="text-[10px] italic text-emerald-600 dark:text-emerald-400 border-l border-emerald-500/40 pl-1.5 mt-1">
                      « {str.sampleQuote} »
                    </blockquote>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                Aucun point fort relevé pour le moment.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dernières Critiques Réalisées (Accès Rapide) */}
      <Card className="border-border">
        <CardHeader className="p-5 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Dernières Évaluations Littéraires
              </CardTitle>
              <CardDescription className="text-xs">
                Cliquez sur une histoire pour ouvrir l'analyse chirurgicale complète
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {critiques.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {critiques.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectCritique(c)}
                  className="p-3.5 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted/20 cursor-pointer transition-all space-y-2 group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {c.title}
                    </h4>
                    <span className="font-bold text-xs font-mono text-primary">
                      {Number(c.overall_score).toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                    « {c.verdict} »
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>🎯 {c.target_age}</span>
                    <span>🧭 {c.objective}</span>
                    <span>{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-6">
              Aucune évaluation dans la base. Utilisez l'onglet <strong>Analyse Unitaire</strong> pour tester vos premières histoires !
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
