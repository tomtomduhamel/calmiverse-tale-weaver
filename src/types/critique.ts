export type SeverityLevel = 'critique' | 'majeur' | 'mineur';

export interface DetailedScores {
  structure_rythme?: number;
  style_prosodie_oralite?: number;
  personnages_empathie?: number;
  originalite_imaginaire?: number;
  adequation_objectif_age?: number;
  rigueur_technique_calmi?: number;
}

export interface CritiqueSummary {
  executive_summary?: string;
  audience_fit?: string;
  emotional_impact?: string;
}

export interface StrengthItem {
  aspect: string;
  analysis: string;
  quote?: string;
}

export interface WeaknessItem {
  issue: string;
  impact: string;
  quote?: string;
  severity: SeverityLevel;
}

export interface CalmiPitfalls {
  excessive_onomatopoeia?: boolean;
  onomatopoeia_critique?: string;
  ai_cliches_critique?: string;
  heavy_moralizing_detected?: boolean;
  moralizing_critique?: string;
}

export interface ActionableImprovement {
  priority: number;
  target_area: string;
  recommendation: string;
}

export interface RewriteDemonstration {
  scene_context?: string;
  original_excerpt?: string;
  rewritten_version?: string;
  editor_explanation?: string;
}

export interface StoryStats {
  title?: string;
  objective?: string;
  targetAge?: string;
  targetWordCount?: number;
  actualWordCount?: number;
  actualSentenceCount?: number;
  avgWordsPerSentence?: number;
  onomatopoeiaCount?: number;
  onomatopoeiaList?: string[];
  detectedCliches?: string[];
  storyId?: string | null;
  userId?: string | null;
}

export interface StoryCritique {
  id: string;
  story_id?: string | null;
  title: string;
  content: string;
  target_age: string;
  objective: string;
  target_word_count: number;
  actual_word_count: number;
  overall_score: number;
  badge: string;
  verdict: string;
  detailed_scores: DetailedScores;
  critique_summary: CritiqueSummary;
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  calmi_pitfalls: CalmiPitfalls;
  actionable_improvements: ActionableImprovement[];
  rewrite_demonstration: RewriteDemonstration;
  stats: StoryStats;
  markdown_report?: string;
  evaluator_model?: string;
  created_at: string;
  updated_at?: string;
}

export interface QualityKPIs {
  meanScore: number;
  medianScore: number;
  totalEvaluated: number;
  passRatePercent: number; // score >= 7.0
  calmiComplianceRate: number; // <= 3 onomatopoeias & no heavy moralizing
  distribution: {
    label: string;
    count: number;
    percentage: number;
    color: string;
    range: string;
  }[];
  criteriaAverages: {
    key: keyof DetailedScores;
    label: string;
    score: number;
    fullMark: number;
    description: string;
  }[];
  topIssues: {
    issue: string;
    count: number;
    severity: SeverityLevel;
    impact: string;
    sampleQuote?: string;
  }[];
  topStrengths: {
    aspect: string;
    count: number;
    sampleAnalysis: string;
    sampleQuote?: string;
  }[];
  scoresByAge: {
    age: string;
    avgScore: number;
    count: number;
  }[];
  scoresByObjective: {
    objective: string;
    avgScore: number;
    count: number;
  }[];
  timeline: {
    date: string;
    score: number;
    title: string;
    age: string;
  }[];
}
