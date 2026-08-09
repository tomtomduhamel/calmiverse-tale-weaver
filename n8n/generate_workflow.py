import json

workflow = {
    "name": "Critique Littéraire Jeunesse & Notation (Calmiverse)",
    "nodes": [
        {
            "parameters": {
                "httpMethod": "POST",
                "path": "critique-histoire",
                "responseMode": "responseNode",
                "options": {
                    "responseHeaders": {
                        "entries": [
                            {
                                "name": "Access-Control-Allow-Origin",
                                "value": "*"
                            },
                            {
                                "name": "Access-Control-Allow-Headers",
                                "value": "authorization, content-type, apikey, x-client-info"
                            },
                            {
                                "name": "Access-Control-Allow-Methods",
                                "value": "POST, OPTIONS, GET"
                            }
                        ]
                    }
                }
            },
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 2,
            "position": [-680, 140],
            "id": "1a2b3c4d-webhook-critique",
            "name": "1. Webhook - Évaluation Histoire",
            "webhookId": "critique-histoire-webhook"
        },
        {
            "parameters": {
                "assignments": {
                    "assignments": [
                        {
                            "id": "manual-input-story",
                            "name": "body",
                            "value": "={{ { content: $json.content || $json.text || 'Il était une fois un petit renard nommé Barnabé qui cherchait son doudou dans la grande forêt magique. Tout à coup, un papillon scintillant passa en disant : Viens avec moi ! Barnabé sauta de joie. Hop ! Hop ! Plouf ! Youpi ! Et ils vécurent heureux.', title: $json.title || 'Barnabé et le doudou perdu', objective: $json.objective || 'sleep', targetAge: $json.targetAge || '4-6 ans', targetWordCount: $json.targetWordCount || 300 } }}",
                            "type": "object"
                        }
                    ]
                },
                "options": {}
            },
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.4,
            "position": [-680, 340],
            "id": "2b3c4d5e-manual-test",
            "name": "1b. Déclencheur Test Manuel"
        },
        {
            "parameters": {
                "jsCode": """// ==========================================================================
// Pré-analyse statistique et validation de l'histoire avant critique LLM
// ==========================================================================
const rawData = $json.body || $json;

// Récupération sécurisée du texte de l'histoire
const content = (rawData.content || rawData.story || rawData.text || rawData.histoire || '').trim();
const title = (rawData.title || rawData.titre || 'Sans titre').trim();
const objective = (rawData.objective || rawData.objectif || 'Non spécifié').trim();
const targetAge = (rawData.targetAge || rawData.age || rawData.age_range || '4-6 ans').trim();
const targetWordCount = rawData.targetWordCount || rawData.wordCount || 0;
const storyId = rawData.storyId || rawData.id || null;
const userId = rawData.userId || null;

if (!content || content.length < 20) {
  return [{
    json: {
      error: true,
      message: "Le texte de l'histoire est manquant ou trop court pour être évalué.",
      received: rawData
    }
  }];
}

// 1. Analyse quantitative du texte
const words = content.split(/\\s+/).filter(w => w.length > 0);
const wordCount = words.length;
const charactersCount = content.length;

// 2. Détection des phrases
const sentences = content.split(/[.!?…]+/).map(s => s.trim()).filter(s => s.length > 0);
const sentenceCount = sentences.length || 1;
const avgWordsPerSentence = Math.round((wordCount / sentenceCount) * 10) / 10;

// 3. Détection des onomatopées courantes en littérature jeunesse
const onomatopoeiaRegex = /\\b(hop|plouf|youpi|oups|chut|boum|crac|toc|vlan|paf|splash|snif|hihi|haha|bzz|meuh|miaou|wouf|cocorico|ding|dong|patatras|tada|tadam|froufrou|glou|miam|beurk|brrr|tic-tac|chuuut|ouah|hourra)\\b[!?,.]*/gi;
const matchesOnomatopoeia = content.match(onomatopoeiaRegex) || [];
const onomatopoeiaCount = matchesOnomatopoeia.length;

// 4. Détection des clichés récurrents de l'IA jeunesse
const aiClichePatterns = [
  { pattern: /\\bmagique[s]?\\b/gi, label: "'magique' (facilité descriptive)" },
  { pattern: /\\bmerveilleu[x|se|ses]?\\b/gi, label: "'merveilleux' (adjectif laudatif plat)" },
  { pattern: /\\bscintillant[e|es|s]?\\b/gi, label: "'scintillant' (cliché visuel IA)" },
  { pattern: /\\bétincelant[e|es|s]?\\b/gi, label: "'étincelant' (cliché visuel IA)" },
  { pattern: /\\btout à coup\\b/gi, label: "'tout à coup' (rupture artificielle)" },
  { pattern: /\\bsoudainement\\b/gi, label: "'soudainement' (adverbe lourd)" },
  { pattern: /\\bet ils vécurent heureux\\b/gi, label: "'et ils vécurent heureux' (fin paresseuse)" },
  { pattern: /\\bapprit une grande leçon\\b/gi, label: "'grande leçon' (moralisme asséné)" }
];

const detectedCliches = [];
for (const c of aiClichePatterns) {
  const found = content.match(c.pattern);
  if (found && found.length > 0) {
    detectedCliches.push(`${c.label} (${found.length}x)`);
  }
}

// 5. Normalisation des métadonnées pour le prompt
return [{
  json: {
    storyMeta: {
      storyId,
      userId,
      title,
      objective,
      targetAge,
      targetWordCount,
      actualWordCount: wordCount,
      actualSentenceCount: sentenceCount,
      avgWordsPerSentence,
      onomatopoeiaCount,
      onomatopoeiaList: matchesOnomatopoeia.slice(0, 10),
      detectedCliches
    },
    storyContent: content
  }
}];"""
            },
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [-380, 240],
            "id": "3c4d5e6f-preprocess-story",
            "name": "2. Pré-analyse & Statistiques"
        },
        {
            "parameters": {
                "conditions": {
                    "options": {
                        "caseSensitive": True,
                        "leftValue": "",
                        "typeValidation": "loose",
                        "version": 2
                    },
                    "conditions": [
                        {
                            "id": "valid-check",
                            "leftValue": "={{ $json.storyMeta ? true : false }}",
                            "rightValue": True,
                            "operator": {
                                "type": "boolean",
                                "operation": "true"
                            }
                        }
                    ],
                    "combinator": "and"
                },
                "options": {}
            },
            "type": "n8n-nodes-base.if",
            "typeVersion": 2.2,
            "position": [-140, 240],
            "id": "4d5e6f7a-check-valid-input",
            "name": "3. Entrée Valide ?"
        },
        {
            "parameters": {
                "modelId": {
                    "__rl": True,
                    "value": "gpt-4o",
                    "mode": "list"
                },
                "messages": {
                    "values": [
                        {
                            "content": """=Tu es un GRAND JURÉ ET CRITIQUE LITTÉRAIRE D'ÉLITE spécialisé en LITTÉRATURE JEUNESSE (style comités éditoriaux de L'école des loisirs, Gallimard Jeunesse, Seuil Jeunesse, Milan, Bologna Ragazzi).

TON IDENTITÉ & POSTURE :
- Tu es impitoyable, lucide, honnête et direct ("sans scrupule"). Zéro complaisance, zéro flatterie, zéro formule creuse.
- Tu traites l'enfant comme un lecteur intelligent, sensible aux rythmes, aux vraies émotions, à la musique des mots et au respect de sa psychologie.
- Tu détestes par-dessus tout : la mièvrerie niaise, les leçons de morale martelées au pied-de-biche, les facilités narratives (deus ex machina), les adjectifs creux de l'IA (magique, merveilleux, scintillant), les accumulations d'onomatopées inutiles et le faux style littéraire ampoulé.
- Ton but suprême : Élever drastiquement le niveau d'écriture pour transformer un brouillon en chef-d'œuvre de la littérature jeunesse.

---
INFORMATIONS SUR L'HISTOIRE À ÉVALUER :
- Titre : "{{ $json.storyMeta.title }}"
- Objectif visé : {{ $json.storyMeta.objective }}
- Public cible (Tranche d'âge) : {{ $json.storyMeta.targetAge }}
- Longueur cible : {{ $json.storyMeta.targetWordCount }} mots (Longueur réelle : {{ $json.storyMeta.actualWordCount }} mots)
- Moyenne mots/phrase : {{ $json.storyMeta.avgWordsPerSentence }} mots/phrase
- Onomatopées détectées : {{ $json.storyMeta.onomatopoeiaCount }} (Liste : {{ $json.storyMeta.onomatopoeiaList.join(', ') || 'Aucune' }})
- Clichés IA repérés par l'analyseur : {{ $json.storyMeta.detectedCliches.join(', ') || 'Aucun' }}

---
TEXTE INTÉGRAL DE L'HISTOIRE :
```text
{{ $json.storyContent }}
```

---
GRILLE DE NOTATION STRICTE (SUR 10) :
1. `overall_score` (Note Globale /10, avec 1 décimale ex: 6.8) :
   - 9.0 - 10.0 : Chef-d'œuvre jeunesse (originalité foudroyante, oralité parfaite, émotion brute, fin mémorable).
   - 7.5 - 8.9 : Très bon texte, publiable avec de légers ajustements de rythme ou de dialogues.
   - 5.5 - 7.4 : Histoire moyenne / convenable mais trop générique, mécanique ou perfectible.
   - 3.5 - 5.4 : Brouillon faible (incohérences, moralisme lourd, vocabulaire inadapté, personnage creux).
   - 0.0 - 3.4 : Échec narratif complet (verbiage, hors-sujet, clichés insupportables).

2. Sous-scores détaillés (sur 10) :
   - `structure_rythme` : Progression dramatique, gestion de la tension, qualité du début/milieu/fin, pas de fin bâclée.
   - `style_prosodie_oralite` : Musique des phrases lues à voix haute, justesse lexicale adaptée à l'âge, rejet du style précieux ou précieux-pédant.
   - `personnages_empathie` : Épaisseur des protagonistes, crédibilité des réactions d'enfants, pas de pantins sans âme.
   - `originalite_imaginaire` : Singularité du monde et des situations, absence de copier-coller des contes génériques.
   - `adequation_objectif_age` : Adéquation avec la tranche d'âge et l'objectif (ex: s'il s'agit de 'sleep', décélération apaisante ; si 'fun', rire franc et énergie sans ton mielleux).
   - `rigueur_technique_calmi` : Respect de la limite de maximum 3 onomatopées, absence de moralisme appuyé ("Show, Don't Tell").

---
CONSIGNES SUR LES RETOURS CRITIQUES :
- Sois chirurgical : cite des passages EXACTS de l'histoire entre guillemets pour prouver tes remarques.
- Donne un VRAI exemple de réécriture d'un passage faible (Avant vs Après) pour démontrer concrètement comment sublimer l'histoire.

---
FORMAT DE RÉPONSE OBLIGATOIRE :
Tu dois retourner UNIQUEMENT un objet JSON valide respectant rigoureusement la structure suivante :
{
  "overall_score": number,
  "verdict_punchline": "string (1 phrase percutante et tranchante résumant la qualité de l'histoire)",
  "detailed_scores": {
    "structure_rythme": number,
    "style_prosodie_oralite": number,
    "personnages_empathie": number,
    "originalite_imaginaire": number,
    "adequation_objectif_age": number,
    "rigueur_technique_calmi": number
  },
  "critique_summary": {
    "executive_summary": "string (synthèse critique lucide de 2-3 paragraphes)",
    "audience_fit": "string (analyse de l'adéquation exacte avec la tranche d'âge indiquée)",
    "emotional_impact": "string (ce que l'enfant va réellement ressentir : ennui, rire, émerveillement, confusion)"
  },
  "strengths": [
    {
      "aspect": "string",
      "analysis": "string",
      "quote": "string"
    }
  ],
  "weaknesses": [
    {
      "issue": "string",
      "impact": "string",
      "quote": "string",
      "severity": "critique"
    }
  ],
  "calmi_pitfalls_analysis": {
    "excessive_onomatopoeia": false,
    "onomatopoeia_critique": "string",
    "ai_cliches_critique": "string",
    "heavy_moralizing_detected": false,
    "moralizing_critique": "string"
  },
  "actionable_improvements": [
    {
      "priority": 1,
      "target_area": "string",
      "recommendation": "string"
    }
  ],
  "rewrite_demonstration": {
    "scene_context": "string",
    "original_excerpt": "string",
    "rewritten_version": "string",
    "editor_explanation": "string"
  }
}""",
                            "role": "system"
                        }
                    ]
                },
                "options": {
                    "temperature": 0.3,
                    "responseFormat": "json_object"
                }
            },
            "type": "@n8n/n8n-nodes-langchain.openAi",
            "typeVersion": 1.8,
            "position": [120, 140],
            "id": "5e6f7a8b-llm-literary-critic",
            "name": "4. Critique Littéraire LLM",
            "credentials": {
                "openAiApi": {
                    "id": "MSayxruZLmsTpuw2",
                    "name": "OpenAi account"
                }
            }
        },
        {
            "parameters": {
                "jsCode": """// ==========================================================================
// Formatage du rapport critique en JSON et Markdown professionnel
// ==========================================================================
const step2 = $('2. Pré-analyse & Statistiques').item?.json || {};
if (step2.error) {
  return [{
    json: {
      success: false,
      error: true,
      message: step2.message || 'Texte manquant ou trop court',
      received: step2.received
    }
  }];
}

const meta = step2.storyMeta || {};
const rawLlmOutput = $json;

let critique = {};
try {
  let rawText = '';
  if (rawLlmOutput.message && rawLlmOutput.message.content) {
    rawText = rawLlmOutput.message.content;
  } else if (rawLlmOutput.output) {
    rawText = rawLlmOutput.output;
  } else if (typeof rawLlmOutput === 'string') {
    rawText = rawLlmOutput;
  } else {
    critique = rawLlmOutput;
  }

  if (typeof rawText === 'string') {
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    critique = JSON.parse(cleaned);
  }
} catch (e) {
  critique = {
    overall_score: 5.0,
    verdict_punchline: "Erreur de parsing de l'évaluation critique.",
    detailed_scores: {},
    error: e.message,
    raw: rawLlmOutput
  };
}

// Badges de note
const score = critique.overall_score || 0;
let badge = "🔴 À REVOIR";
if (score >= 8.5) {
  badge = "🌟 CHEF-D'ŒUVRE JEUNESSE";
} else if (score >= 7.0) {
  badge = "🟢 TRÈS BON NIVEAU";
} else if (score >= 5.5) {
  badge = "🟡 PASSABLE / PERFECTIBLE";
} else if (score >= 4.0) {
  badge = "🟠 BROUILLON FRAGILE";
}

// Génération du rapport Markdown
let md = `# 📖 Rapport Critique Littéraire Jeunesse : "${meta.title}"\\n\\n`;
md += `**Note Globale :** \`${score}/10\` — **${badge}**\\n\\n`;
md += `> 💡 *"${critique.verdict_punchline || 'Aucun verdict'}"*\\n\\n`;

md += `### 🎯 Métadonnées & Calibrage\\n`;
md += `- **Public cible :** ${meta.targetAge}\\n`;
md += `- **Objectif de l'histoire :** ${meta.objective}\\n`;
md += `- **Nombre de mots :** ${meta.actualWordCount} mots (cible: ${meta.targetWordCount || 'N/A'})\\n`;
md += `- **Rythme moyen :** ${meta.avgWordsPerSentence} mots / phrase\\n`;
md += `- **Onomatopées :** ${meta.onomatopoeiaCount} détectée(s) (règle Calmi: max 3)\\n\\n`;

md += `### 📊 Grille d'Évaluation Détaillée\\n\\n`;
md += `| Critère Littéraire | Note | Appréciation |\\n`;
md += `| :--- | :---: | :--- |\\n`;
if (critique.detailed_scores) {
  const ds = critique.detailed_scores;
  md += `| 🎭 **Structure & Arc Narratif** | **${ds.structure_rythme || 'N/A'}/10** | Progression, enjeu, dénouement |\\n`;
  md += `| ✍️ **Style, Prosodie & Oralité** | **${ds.style_prosodie_oralite || 'N/A'}/10** | Musicalité lecture à voix haute, lexique |\\n`;
  md += `| 🧸 **Personnages & Empathie** | **${ds.personnages_empathie || 'N/A'}/10** | Authenticité des émotions d'enfant |\\n`;
  md += `| 💡 **Originalité & Imaginaire** | **${ds.originalite_imaginaire || 'N/A'}/10** | Fraîcheur des situations, anti-clichés |\\n`;
  md += `| 🎯 **Adéquation Âge & Objectif** | **${ds.adequation_objectif_age || 'N/A'}/10** | Respect du public cible |\\n`;
  md += `| ⚙️ **Rigueur Technique & Règle Calmi** | **${ds.rigueur_technique_calmi || 'N/A'}/10** | Onomatopées <= 3, Show don't tell |\\n\\n`;
}

md += `### 📝 Analyse de Fond\\n`;
if (critique.critique_summary) {
  md += `${critique.critique_summary.executive_summary || ''}\\n\\n`;
  md += `**Adéquation public :** ${critique.critique_summary.audience_fit || ''}\\n\\n`;
  md += `**Impact émotionnel ressenti :** ${critique.critique_summary.emotional_impact || ''}\\n\\n`;
}

md += `### ✨ Points Forts (Ce qui fonctionne)\\n`;
if (Array.isArray(critique.strengths)) {
  for (const s of critique.strengths) {
    md += `- **${s.aspect}** : ${s.analysis}\\n`;
    if (s.quote) md += `  > *${s.quote}*\\n`;
  }
  md += `\\n`;
}

md += `### ⚠️ Faiblesses & Écueils (Ce qui pêche)\\n`;
if (Array.isArray(critique.weaknesses)) {
  for (const w of critique.weaknesses) {
    const sev = w.severity === 'critique' ? '🔴 [CRITIQUE]' : w.severity === 'majeur' ? '🟠 [MAJEUR]' : '🟡 [MINEUR]';
    md += `- ${sev} **${w.issue}** : ${w.impact}\\n`;
    if (w.quote) md += `  > *${w.quote}*\\n`;
  }
  md += `\\n`;
}

md += `### 🚀 Plan d'Action & Axes d'Amélioration\\n`;
if (Array.isArray(critique.actionable_improvements)) {
  for (const act of critique.actionable_improvements) {
    md += `1. **[${act.target_area}]** : ${act.recommendation}\\n`;
  }
  md += `\\n`;
}

if (critique.rewrite_demonstration) {
  const rw = critique.rewrite_demonstration;
  md += `### 🛠️ Démonstration de Réécriture (Avant / Après)\\n\\n`;
  md += `*Contexte : ${rw.scene_context || 'Extrait clé'}*\\n\\n`;
  md += `**Version originale :**\\n> ${rw.original_excerpt || ''}\\n\\n`;
  md += `**Version sublimée (Critique) :**\\n> 🌟 **${rw.rewritten_version || ''}**\\n\\n`;
  md += `*Explication éditoriale :* ${rw.editor_explanation || ''}\\n\\n`;
}

return [{
  json: {
    success: true,
    storyMeta: meta,
    score,
    verdict: critique.verdict_punchline,
    badge,
    critique,
    markdownReport: md
  }
}];"""
            },
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [380, 140],
            "id": "6f7a8b9c-postprocess-report",
            "name": "5. Formatage Rapport & Markdown"
        },
        {
            "parameters": {
                "respondWith": "json",
                "responseBody": "={{ $json }}",
                "options": {}
            },
            "type": "n8n-nodes-base.respondToWebhook",
            "typeVersion": 1.1,
            "position": [640, 140],
            "id": "7a8b9c0d-respond-webhook",
            "name": "6. Réponse Webhook"
        }
    ],
    "connections": {
        "1. Webhook - Évaluation Histoire": {
            "main": [
                [
                    {
                        "node": "2. Pré-analyse & Statistiques",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "1b. Déclencheur Test Manuel": {
            "main": [
                [
                    {
                        "node": "2. Pré-analyse & Statistiques",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "2. Pré-analyse & Statistiques": {
            "main": [
                [
                    {
                        "node": "3. Entrée Valide ?",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "3. Entrée Valide ?": {
            "main": [
                [
                    {
                        "node": "4. Critique Littéraire LLM",
                        "type": "main",
                        "index": 0
                    }
                ],
                [
                    {
                        "node": "5. Formatage Rapport & Markdown",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "4. Critique Littéraire LLM": {
            "main": [
                [
                    {
                        "node": "5. Formatage Rapport & Markdown",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "5. Formatage Rapport & Markdown": {
            "main": [
                [
                    {
                        "node": "6. Réponse Webhook",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        }
    },
    "settings": {
        "executionOrder": "v1",
        "saveManualExecutions": True,
        "saveDataErrorExecution": "all",
        "saveDataSuccessExecution": "all"
    }
}

with open("n8n/wf_critique_litteraire.json", "w", encoding="utf-8") as f:
    json.dump(workflow, f, indent=2, ensure_ascii=False)

print("Generated n8n/wf_critique_litteraire.json successfully!")
