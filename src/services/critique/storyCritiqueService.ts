import { supabase } from "@/integrations/supabase/client";
import { StoryCritique, QualityKPIs, DetailedScores, SeverityLevel } from "@/types/critique";

const N8N_CRITIQUE_WEBHOOK = "https://n8n.srv856374.hstgr.cloud/webhook/critique-histoire";

export interface EvaluateStoryParams {
  title: string;
  content: string;
  targetAge?: string;
  objective?: string;
  targetWordCount?: number;
  storyId?: string | null;
  userId?: string | null;
  saveToDb?: boolean;
}

export const storyCritiqueService = {
  /**
   * Appelle le webhook n8n pour évaluer une histoire et persiste le résultat dans Supabase
   */
  async evaluateStory(params: EvaluateStoryParams): Promise<StoryCritique> {
    const payload = {
      title: params.title.trim() || "Histoire sans titre",
      content: params.content.trim(),
      targetAge: params.targetAge || "4-6 ans",
      objective: params.objective || "sleep",
      targetWordCount: params.targetWordCount || 300,
      storyId: params.storyId || null,
      userId: params.userId || null
    };

    const response = await fetch(N8N_CRITIQUE_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erreur lors de l'évaluation n8n (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (!data.success || !data.critique) {
      throw new Error(data.message || "Réponse d'évaluation n8n invalide");
    }

    const critiqueData = data.critique;
    const meta = data.storyMeta || {};

    const critiqueRecord: Omit<StoryCritique, "id" | "created_at"> = {
      story_id: params.storyId || null,
      title: payload.title,
      content: payload.content,
      target_age: payload.targetAge,
      objective: payload.objective,
      target_word_count: payload.targetWordCount,
      actual_word_count: meta.actualWordCount || payload.content.split(/\s+/).filter(Boolean).length,
      overall_score: critiqueData.overall_score || data.score || 5.0,
      badge: data.badge || "🟡 PASSABLE",
      verdict: critiqueData.verdict_punchline || data.verdict || "Analyse complétée",
      detailed_scores: critiqueData.detailed_scores || {},
      critique_summary: critiqueData.critique_summary || {},
      strengths: critiqueData.strengths || [],
      weaknesses: critiqueData.weaknesses || [],
      calmi_pitfalls: critiqueData.calmi_pitfalls_analysis || {},
      actionable_improvements: critiqueData.actionable_improvements || [],
      rewrite_demonstration: critiqueData.rewrite_demonstration || {},
      stats: meta,
      markdown_report: data.markdownReport || "",
      evaluator_model: "gpt-4o"
    };

    // Sauvegarde dans Supabase si saveToDb n'est pas false
    if (params.saveToDb !== false) {
      try {
        const { data: inserted, error } = await supabase
          .from("story_critiques" as any)
          .insert(critiqueRecord)
          .select()
          .single();

        if (error) {
          console.warn("⚠️ Impossible d'enregistrer la critique dans Supabase:", error.message);
        } else if (inserted) {
          return inserted as unknown as StoryCritique;
        }
      } catch (err: any) {
        console.warn("⚠️ Erreur d'enregistrement Supabase:", err?.message);
      }
    }

    return {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...critiqueRecord
    } as StoryCritique;
  },

  /**
   * Récupère la liste de toutes les critiques enregistrées
   */
  async fetchCritiques(filters?: {
    age?: string;
    objective?: string;
    search?: string;
    limit?: number;
  }): Promise<StoryCritique[]> {
    let query = supabase
      .from("story_critiques" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.age && filters.age !== "all") {
      query = query.eq("target_age", filters.age);
    }
    if (filters?.objective && filters.objective !== "all") {
      query = query.eq("objective", filters.objective);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Erreur récupération critiques:", error);
      return [];
    }

    let results = (data || []) as unknown as StoryCritique[];

    if (filters?.search && filters.search.trim()) {
      const s = filters.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(s) ||
          c.verdict.toLowerCase().includes(s) ||
          c.content.toLowerCase().includes(s)
      );
    }

    return results;
  },

  /**
   * Récupère des histoires existantes depuis la table stories pour les soumettre à l'évaluation
   */
  async fetchStoriesForEvaluation(limit = 20): Promise<{
    id: string;
    title: string;
    objective: string;
    content: string;
    createdat: string;
    alreadyEvaluated: boolean;
  }[]> {
    const [{ data: stories, error: sErr }, { data: critiques, error: cErr }] = await Promise.all([
      supabase
        .from("stories")
        .select("id, title, objective, content, createdat")
        .order("createdat", { ascending: false })
        .limit(limit),
      supabase
        .from("story_critiques" as any)
        .select("story_id")
    ]);

    if (sErr || !stories) {
      console.error("Erreur récupération stories:", sErr);
      return [];
    }

    const evaluatedStoryIds = new Set(
      ((critiques || []) as any[]).map((c) => c.story_id).filter(Boolean)
    );

    return stories.map((s) => ({
      id: s.id,
      title: s.title || "Histoire sans titre",
      objective: s.objective || "sleep",
      content: s.content || "",
      createdat: s.createdat,
      alreadyEvaluated: evaluatedStoryIds.has(s.id)
    }));
  },

  /**
   * Supprime une critique
   */
  async deleteCritique(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("story_critiques" as any)
      .delete()
      .eq("id", id);
    return !error;
  },

  /**
   * Calcule les KPIs agrégés, tendances et statistiques pour le Dashboard
   */
  calculateKPIs(critiques: StoryCritique[]): QualityKPIs {
    if (!critiques || critiques.length === 0) {
      return {
        meanScore: 0,
        medianScore: 0,
        totalEvaluated: 0,
        passRatePercent: 0,
        calmiComplianceRate: 0,
        distribution: [
          { label: "Chef-d'œuvre (>= 8.5)", count: 0, percentage: 0, color: "#16a34a", range: "8.5 - 10" },
          { label: "Très bon (7.0 - 8.4)", count: 0, percentage: 0, color: "#22c55e", range: "7.0 - 8.4" },
          { label: "Passable (5.5 - 6.9)", count: 0, percentage: 0, color: "#eab308", range: "5.5 - 6.9" },
          { label: "Brouillon fragile (4.0 - 5.4)", count: 0, percentage: 0, color: "#f97316", range: "4.0 - 5.4" },
          { label: "À revoir (< 4.0)", count: 0, percentage: 0, color: "#e11d48", range: "0.0 - 3.9" }
        ],
        criteriaAverages: [
          { key: "structure_rythme", label: "Structure & Rythme", score: 0, fullMark: 10, description: "Progression et dénouement" },
          { key: "style_prosodie_oralite", label: "Style & Oralité", score: 0, fullMark: 10, description: "Musicalité lecture à voix haute" },
          { key: "personnages_empathie", label: "Personnages & Empathie", score: 0, fullMark: 10, description: "Authenticité des émotions d'enfant" },
          { key: "originalite_imaginaire", label: "Originalité & Imaginaire", score: 0, fullMark: 10, description: "Fraîcheur des situations sans clichés" },
          { key: "adequation_objectif_age", label: "Adéquation Âge / Objectif", score: 0, fullMark: 10, description: "Respect du public cible" },
          { key: "rigueur_technique_calmi", label: "Rigueur Règles Calmi", score: 0, fullMark: 10, description: "Onomatopées <= 3, Show don't tell" }
        ],
        topIssues: [],
        topStrengths: [],
        scoresByAge: [],
        scoresByObjective: [],
        timeline: []
      };
    }

    const total = critiques.length;
    const scores = critiques.map((c) => Number(c.overall_score)).sort((a, b) => a - b);
    
    // Moyenne
    const sum = scores.reduce((acc, s) => acc + s, 0);
    const meanScore = Math.round((sum / total) * 10) / 10;

    // Médiane
    const mid = Math.floor(scores.length / 2);
    const medianScore =
      scores.length % 2 !== 0
        ? Math.round(scores[mid] * 10) / 10
        : Math.round(((scores[mid - 1] + scores[mid]) / 2) * 10) / 10;

    // Pass rate (>= 7.0)
    const passCount = scores.filter((s) => s >= 7.0).length;
    const passRatePercent = Math.round((passCount / total) * 100);

    // Calmi Compliance Rate
    const compliantCount = critiques.filter((c) => {
      const onomCount = c.stats?.onomatopoeiaCount ?? 0;
      const heavyMoral = c.calmi_pitfalls?.heavy_moralizing_detected ?? false;
      return onomCount <= 3 && !heavyMoral;
    }).length;
    const calmiComplianceRate = Math.round((compliantCount / total) * 100);

    // Distribution
    const dChef = critiques.filter((c) => c.overall_score >= 8.5).length;
    const dBon = critiques.filter((c) => c.overall_score >= 7.0 && c.overall_score < 8.5).length;
    const dPass = critiques.filter((c) => c.overall_score >= 5.5 && c.overall_score < 7.0).length;
    const dFrag = critiques.filter((c) => c.overall_score >= 4.0 && c.overall_score < 5.5).length;
    const dRev = critiques.filter((c) => c.overall_score < 4.0).length;

    const distribution = [
      { label: "Chef-d'œuvre (>= 8.5)", count: dChef, percentage: Math.round((dChef / total) * 100), color: "#16a34a", range: "8.5 - 10" },
      { label: "Très bon (7.0 - 8.4)", count: dBon, percentage: Math.round((dBon / total) * 100), color: "#22c55e", range: "7.0 - 8.4" },
      { label: "Passable (5.5 - 6.9)", count: dPass, percentage: Math.round((dPass / total) * 100), color: "#eab308", range: "5.5 - 6.9" },
      { label: "Brouillon fragile (4.0 - 5.4)", count: dFrag, percentage: Math.round((dFrag / total) * 100), color: "#f97316", range: "4.0 - 5.4" },
      { label: "À revoir (< 4.0)", count: dRev, percentage: Math.round((dRev / total) * 100), color: "#e11d48", range: "0.0 - 3.9" }
    ];

    // Critères détaillés
    const criteriaKeys: { key: keyof DetailedScores; label: string; description: string }[] = [
      { key: "structure_rythme", label: "Structure & Rythme", description: "Progression et dénouement" },
      { key: "style_prosodie_oralite", label: "Style & Oralité", description: "Musicalité lecture à voix haute" },
      { key: "personnages_empathie", label: "Personnages & Empathie", description: "Authenticité des émotions d'enfant" },
      { key: "originalite_imaginaire", label: "Originalité & Imaginaire", description: "Fraîcheur des situations sans clichés" },
      { key: "adequation_objectif_age", label: "Adéquation Âge / Objectif", description: "Respect du public cible" },
      { key: "rigueur_technique_calmi", label: "Rigueur Règles Calmi", description: "Onomatopées <= 3, Show don't tell" }
    ];

    const criteriaAverages = criteriaKeys.map(({ key, label, description }) => {
      const validScores = critiques
        .map((c) => c.detailed_scores?.[key])
        .filter((v): v is number => typeof v === "number" && !isNaN(v));
      const avg =
        validScores.length > 0
          ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
          : 0;
      return {
        key,
        label,
        score: avg,
        fullMark: 10,
        description
      };
    });

    // Problèmes récurrents
    const issueMap = new Map<string, { count: number; severity: SeverityLevel; impact: string; sampleQuote?: string }>();
    critiques.forEach((c) => {
      if (Array.isArray(c.weaknesses)) {
        c.weaknesses.forEach((w) => {
          const key = w.issue.trim();
          if (!issueMap.has(key)) {
            issueMap.set(key, {
              count: 1,
              severity: w.severity || "majeur",
              impact: w.impact,
              sampleQuote: w.quote
            });
          } else {
            const entry = issueMap.get(key)!;
            entry.count += 1;
            if (w.severity === "critique") entry.severity = "critique";
          }
        });
      }
    });

    const topIssues = Array.from(issueMap.entries())
      .map(([issue, data]) => ({ issue, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Points forts généraux
    const strengthMap = new Map<string, { count: number; sampleAnalysis: string; sampleQuote?: string }>();
    critiques.forEach((c) => {
      if (Array.isArray(c.strengths)) {
        c.strengths.forEach((s) => {
          const key = s.aspect.trim();
          if (!strengthMap.has(key)) {
            strengthMap.set(key, {
              count: 1,
              sampleAnalysis: s.analysis,
              sampleQuote: s.quote
            });
          } else {
            const entry = strengthMap.get(key)!;
            entry.count += 1;
          }
        });
      }
    });

    const topStrengths = Array.from(strengthMap.entries())
      .map(([aspect, data]) => ({ aspect, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Groupement par tranche d'âge
    const ageMap = new Map<string, { sum: number; count: number }>();
    critiques.forEach((c) => {
      const age = c.target_age || "Non défini";
      const curr = ageMap.get(age) || { sum: 0, count: 0 };
      curr.sum += Number(c.overall_score);
      curr.count += 1;
      ageMap.set(age, curr);
    });
    const scoresByAge = Array.from(ageMap.entries()).map(([age, data]) => ({
      age,
      avgScore: Math.round((data.sum / data.count) * 10) / 10,
      count: data.count
    }));

    // Groupement par objectif
    const objMap = new Map<string, { sum: number; count: number }>();
    critiques.forEach((c) => {
      const obj = c.objective || "Non défini";
      const curr = objMap.get(obj) || { sum: 0, count: 0 };
      curr.sum += Number(c.overall_score);
      curr.count += 1;
      objMap.set(obj, curr);
    });
    const scoresByObjective = Array.from(objMap.entries()).map(([objective, data]) => ({
      objective,
      avgScore: Math.round((data.sum / data.count) * 10) / 10,
      count: data.count
    }));

    // Timeline chronologique
    const timeline = critiques
      .slice()
      .reverse()
      .map((c) => ({
        date: new Date(c.created_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short"
        }),
        score: Number(c.overall_score),
        title: c.title,
        age: c.target_age
      }));

    return {
      meanScore,
      medianScore,
      totalEvaluated: total,
      passRatePercent,
      calmiComplianceRate,
      distribution,
      criteriaAverages,
      topIssues,
      topStrengths,
      scoresByAge,
      scoresByObjective,
      timeline
    };
  }
};
