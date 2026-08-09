// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { storyCritiqueService } from "@/services/critique/storyCritiqueService";
import { StoryCritique } from "@/types/critique";

const mockCritiques: StoryCritique[] = [
  {
    id: "crit-1",
    title: "Le Chariot Rouge de Léo",
    content: "Léo a un joli chariot rouge en bois. Les roues tournent vite : clic, clac !",
    target_age: "2-4 ans",
    objective: "autonomy",
    target_word_count: 200,
    actual_word_count: 120,
    overall_score: 8.5,
    badge: "🌟 CHEF-D'ŒUVRE",
    verdict: "Un modèle d'écriture sensorielle.",
    detailed_scores: {
      structure_rythme: 8.5,
      style_prosodie_oralite: 8.5,
      personnages_empathie: 9.0,
      originalite_imaginaire: 8.0,
      adequation_objectif_age: 9.0,
      rigueur_technique_calmi: 8.5
    },
    critique_summary: {
      executive_summary: "Très bon texte.",
      audience_fit: "Parfait pour 2-4 ans.",
      emotional_impact: "Fierté."
    },
    strengths: [
      { aspect: "Verbes d'action", analysis: "Vocabulaire adapté", quote: "Les roues tournent vite" },
      { aspect: "Accroche sensorielle", analysis: "Entrée immédiate", quote: "Léo a un joli chariot" }
    ],
    weaknesses: [
      { issue: "Péripétie courte", impact: "Manque un virage", severity: "mineur" }
    ],
    calmi_pitfalls: {
      excessive_onomatopoeia: false,
      heavy_moralizing_detected: false
    },
    actionable_improvements: [
      { priority: 1, target_area: "Action", recommendation: "Ajouter un virage" }
    ],
    rewrite_demonstration: {
      scene_context: "Blocage",
      original_excerpt: "Le chariot coince",
      rewritten_version: "Le tapis avale les roues",
      editor_explanation: "Sensorialité"
    },
    stats: {
      actualWordCount: 120,
      actualSentenceCount: 15,
      avgWordsPerSentence: 8.0,
      onomatopoeiaCount: 2,
      onomatopoeiaList: ["clic", "clac"],
      detectedCliches: []
    },
    created_at: "2026-08-01T10:00:00Z"
  },
  {
    id: "crit-2",
    title: "Le Dentier du Crocodile",
    content: "Barnabé le crocodile avait un dentier en bois. Splash ! Le poisson sauta.",
    target_age: "4-6 ans",
    objective: "fun",
    target_word_count: 300,
    actual_word_count: 150,
    overall_score: 7.5,
    badge: "🟢 TRÈS BON NIVEAU",
    verdict: "Une idée comique excellente.",
    detailed_scores: {
      structure_rythme: 7.5,
      style_prosodie_oralite: 8.0,
      personnages_empathie: 7.5,
      originalite_imaginaire: 8.0,
      adequation_objectif_age: 8.0,
      rigueur_technique_calmi: 7.5
    },
    critique_summary: {
      executive_summary: "Comédie vive.",
      audience_fit: "Bien pour 4-6 ans.",
      emotional_impact: "Rires."
    },
    strengths: [
      { aspect: "Comique de situation", analysis: "Dentier perdu", quote: "il portait un dentier" }
    ],
    weaknesses: [
      { issue: "Résolution facile", impact: "Trouvé tout de suite", severity: "majeur" }
    ],
    calmi_pitfalls: {
      excessive_onomatopoeia: false,
      heavy_moralizing_detected: false
    },
    actionable_improvements: [
      { priority: 1, target_area: "Climax", recommendation: "Ajouter une fausse piste" }
    ],
    rewrite_demonstration: {
      scene_context: "Recherche",
      original_excerpt: "Nina plongea",
      rewritten_version: "Nina remonta une vieille botte",
      editor_explanation: "Humour"
    },
    stats: {
      actualWordCount: 150,
      actualSentenceCount: 12,
      avgWordsPerSentence: 12.5,
      onomatopoeiaCount: 1,
      onomatopoeiaList: ["Splash"],
      detectedCliches: []
    },
    created_at: "2026-08-03T12:00:00Z"
  },
  {
    id: "crit-3",
    title: "Le Secret de la Forêt",
    content: "Dans une forêt magique et merveilleuse, un lapin vit une lumière scintillante. Hop ! Plouf ! Youpi !",
    target_age: "4-6 ans",
    objective: "sleep",
    target_word_count: 250,
    actual_word_count: 95,
    overall_score: 3.2,
    badge: "🔴 À REVOIR",
    verdict: "Récit plein de clichés et moralisme.",
    detailed_scores: {
      structure_rythme: 3.5,
      style_prosodie_oralite: 3.0,
      personnages_empathie: 2.5,
      originalite_imaginaire: 2.0,
      adequation_objectif_age: 4.0,
      rigueur_technique_calmi: 3.0
    },
    critique_summary: {
      executive_summary: "Échec narratif.",
      audience_fit: "Trop lourd.",
      emotional_impact: "Ennui."
    },
    strengths: [],
    weaknesses: [
      { issue: "Clichés IA", impact: "Adjectifs creux", severity: "critique", quote: "forêt magique" },
      { issue: "Moralisme lourd", impact: "Leçon directe", severity: "critique", quote: "obéis à tes parents" }
    ],
    calmi_pitfalls: {
      excessive_onomatopoeia: true,
      heavy_moralizing_detected: true
    },
    actionable_improvements: [
      { priority: 1, target_area: "Show don't tell", recommendation: "Supprimer la morale" }
    ],
    rewrite_demonstration: {
      scene_context: "Intro",
      original_excerpt: "forêt magique",
      rewritten_version: "forêt aux odeurs de mousse",
      editor_explanation: "Sensoriel"
    },
    stats: {
      actualWordCount: 95,
      actualSentenceCount: 13,
      avgWordsPerSentence: 7.3,
      onomatopoeiaCount: 4,
      onomatopoeiaList: ["Hop", "Plouf", "Youpi", "Bravo"],
      detectedCliches: ["magique", "merveilleux", "scintillante"]
    },
    created_at: "2026-08-05T14:00:00Z"
  }
];

describe("StoryCritiqueService - KPI Calculations", () => {
  it("should handle empty critiques list safely", () => {
    const kpis = storyCritiqueService.calculateKPIs([]);
    expect(kpis.meanScore).toBe(0);
    expect(kpis.medianScore).toBe(0);
    expect(kpis.totalEvaluated).toBe(0);
    expect(kpis.passRatePercent).toBe(0);
    expect(kpis.calmiComplianceRate).toBe(0);
    expect(kpis.distribution).toHaveLength(5);
    expect(kpis.criteriaAverages).toHaveLength(6);
    expect(kpis.topIssues).toHaveLength(0);
    expect(kpis.topStrengths).toHaveLength(0);
  });

  it("should correctly compute mean, median and pass rate", () => {
    const kpis = storyCritiqueService.calculateKPIs(mockCritiques);
    
    // Scores: 3.2, 7.5, 8.5 -> Mean = (3.2 + 7.5 + 8.5) / 3 = 19.2 / 3 = 6.4
    expect(kpis.meanScore).toBe(6.4);
    // Median of [3.2, 7.5, 8.5] is 7.5
    expect(kpis.medianScore).toBe(7.5);
    expect(kpis.totalEvaluated).toBe(3);

    // Pass rate (>= 7.0): 2 out of 3 = 67%
    expect(kpis.passRatePercent).toBe(67);

    // Calmi compliance (onomatopoeias <= 3 and no heavy moralizing): 2 out of 3 = 67%
    expect(kpis.calmiComplianceRate).toBe(67);
  });

  it("should correctly compute distribution brackets", () => {
    const kpis = storyCritiqueService.calculateKPIs(mockCritiques);
    const chef = kpis.distribution.find(d => d.label.includes("Chef-d'œuvre"));
    const bon = kpis.distribution.find(d => d.label.includes("Très bon"));
    const rev = kpis.distribution.find(d => d.label.includes("À revoir"));

    expect(chef?.count).toBe(1); // 8.5
    expect(bon?.count).toBe(1);  // 7.5
    expect(rev?.count).toBe(1);  // 3.2
  });

  it("should aggregate 6 criteria averages accurately", () => {
    const kpis = storyCritiqueService.calculateKPIs(mockCritiques);
    expect(kpis.criteriaAverages).toHaveLength(6);

    const structure = kpis.criteriaAverages.find(c => c.key === "structure_rythme");
    // (8.5 + 7.5 + 3.5) / 3 = 19.5 / 3 = 6.5
    expect(structure?.score).toBe(6.5);

    const style = kpis.criteriaAverages.find(c => c.key === "style_prosodie_oralite");
    // (8.5 + 8.0 + 3.0) / 3 = 19.5 / 3 = 6.5
    expect(style?.score).toBe(6.5);
  });

  it("should identify top issues and rank by severity and frequency", () => {
    const kpis = storyCritiqueService.calculateKPIs(mockCritiques);
    expect(kpis.topIssues.length).toBeGreaterThan(0);

    const issueNames = kpis.topIssues.map(i => i.issue);
    expect(issueNames).toContain("Clichés IA");
    expect(issueNames).toContain("Moralisme lourd");

    const clicheIssue = kpis.topIssues.find(i => i.issue === "Clichés IA");
    expect(clicheIssue?.severity).toBe("critique");
  });

  it("should group scores by age and by objective correctly", () => {
    const kpis = storyCritiqueService.calculateKPIs(mockCritiques);

    const age24 = kpis.scoresByAge.find(a => a.age === "2-4 ans");
    expect(age24?.avgScore).toBe(8.5);
    expect(age24?.count).toBe(1);

    const age46 = kpis.scoresByAge.find(a => a.age === "4-6 ans");
    // (7.5 + 3.2) / 2 = 5.35 -> 5.4
    expect(age46?.avgScore).toBe(5.4);
    expect(age46?.count).toBe(2);

    const objAutonomy = kpis.scoresByObjective.find(o => o.objective === "autonomy");
    expect(objAutonomy?.avgScore).toBe(8.5);
  });

  it("should build a chronological timeline", () => {
    const kpis = storyCritiqueService.calculateKPIs(mockCritiques);
    expect(kpis.timeline).toHaveLength(3);
    // Should be in chronological order
    expect(kpis.timeline[0].title).toBe("Le Secret de la Forêt");
    expect(kpis.timeline[2].title).toBe("Le Chariot Rouge de Léo");
  });
});
