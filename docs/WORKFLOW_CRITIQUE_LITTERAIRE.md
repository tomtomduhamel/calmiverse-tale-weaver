# 📖 Workflow n8n : Critique Littéraire Jeunesse & Notation Qualité (Calmiverse)

Ce workflow n8n a été conçu pour agir comme un **grand juré et critique littéraire jeunesse d'élite** (inspiré des comités de lecture de *L'école des loisirs*, *Gallimard Jeunesse*, *Seuil Jeunesse*, *Milan*, *Prix Sorcières*).

Son objectif est de fournir une **évaluation sans complaisance (« sans scrupule »)** de chaque histoire générée :
- Une **note globale sur 10** et **6 sous-notes thématiques**.
- Un **verdict percutant** et une **analyse de fond**.
- La mise en exergue des **points forts réels** (avec citations).
- Le repérage chirurgical des **faiblesses, facilités et clichés IA** (avec sévérité).
- Un **plan d'action d'amélioration priorisé**.
- Une **démonstration de réécriture (Avant / Après)** pour montrer concrètement comment sublimer le texte.

---

## 🚀 Accès & Déploiement

- **ID du Workflow sur le serveur n8n** : `X642IwAdfKdcHcXn`
- **Fichier source dans le dépôt** : [`n8n/wf_critique_litteraire.json`](file:///c:/Users/thoma/Calmi/calmiverse-tale-weaver/n8n/wf_critique_litteraire.json)
- **URL du Webhook de Production** :
  ```http
  POST https://n8n.srv856374.hstgr.cloud/webhook/critique-histoire
  ```
- **URL du Webhook de Test n8n** :
  ```http
  POST https://n8n.srv856374.hstgr.cloud/webhook-test/critique-histoire
  ```

---

## 📥 Format d'Entrée (Payload JSON)

Envoyez une requête `POST` avec le corps JSON suivant :

```json
{
  "title": "Le Secret de la Boîte à Musique",
  "content": "Texte intégral de l'histoire...",
  "objective": "sleep",
  "targetAge": "4-6 ans",
  "targetWordCount": 350,
  "storyId": "UUID_OPTIONNEL_HISTOIRE",
  "userId": "UUID_OPTIONNEL_UTILISATEUR"
}
```

> **Note :** Les champs `objective`, `targetAge` et `targetWordCount` sont optionnels (valeurs par défaut intelligentes : `4-6 ans`, objectif détecté).

---

## 📊 Grille de Notation Rigoureuse (0 à 10)

L'évaluation est intransigeante pour garantir une progression constante de la qualité :

| Note | Échelle d'Appréciation | Signification |
| :---: | :--- | :--- |
| **9.0 - 10.0** | 🌟 **CHEF-D'ŒUVRE JEUNESSE** | Originalité foudroyante, oralité parfaite, zéro cliché, émotion brute. |
| **7.5 - 8.9** | 🟢 **TRÈS BON NIVEAU** | Texte très bien mené, publiable avec de menues retouches de rythme. |
| **5.5 - 7.4** | 🟡 **PASSABLE / PERFECTIBLE** | Histoire convenable mais trop générique, mécanique ou prévisible. |
| **3.5 - 5.4** | 🟠 **BROUILLON FRAGILE** | Clichés IA, moralisme lourd, vocabulaire inadapté, personnage plat. |
| **0.0 - 3.4** | 🔴 **À REVOIR TOTALEMENT** | Échec narratif complet, verbiage creux, accumulation de facilités. |

### Les 6 Piliers d'Évaluation sous-notés :
1. **🎭 Structure & Arc Narratif (`structure_rythme`)** : Accroche sensorielle, montée en tension, péripéties, climax et résolution méritée (rejet du *deus ex machina*).
2. **✍️ Style, Prosodie & Oralité (`style_prosodie_oralite`)** : Musique des phrases pour la lecture à haute voix par les parents, justesse du lexique selon l'âge (ni précieux ni infantilisant).
3. **🧸 Personnages & Empathie (`personnages_empathie`)** : Épaisseur psychologique de l'enfant/héros, crédibilité des réactions, rejet des pantins sans âme.
4. **💡 Originalité & Imaginaire (`originalite_imaginaire`)** : Fraîcheur des situations, élimination des poncifs IA (*arbres enchantés génériques*, *lumières scintillantes*, *vieux sages*).
5. **🎯 Adéquation Âge & Objectif (`adequation_objectif_age`)** : Respect de la tranche d'âge (0-2, 2-4, 4-6, 8-12, 13+) et de la finalité (décélération vers le sommeil vs rire franc et quiproquos sans ton lénifiant).
6. **⚙️ Rigueur Technique & Règles Calmi (`rigueur_technique_calmi`)** : Règle stricte des maximum 3 onomatopées, principe du *Show, Don't Tell* (pas de morale martelée).

---

## 📤 Format de Sortie (Réponse JSON & Rapport Markdown)

Le webhook renvoie un objet complet contenant à la fois la donnée brute exploitable et un rapport Markdown soigné :

```json
{
  "success": true,
  "score": 8.2,
  "badge": "🟢 TRÈS BON NIVEAU",
  "verdict": "Une aventure sensorielle vive avec un dialogue authentique qui fait mouche.",
  "storyMeta": {
    "title": "Le Secret de la Boîte à Musique",
    "targetAge": "4-6 ans",
    "actualWordCount": 320,
    "actualSentenceCount": 38,
    "avgWordsPerSentence": 8.4,
    "onomatopoeiaCount": 2,
    "onomatopoeiaList": ["Chut", "Clic"],
    "detectedCliches": []
  },
  "critique": {
    "overall_score": 8.2,
    "detailed_scores": {
      "structure_rythme": 8.5,
      "style_prosodie_oralite": 8.0,
      "personnages_empathie": 8.5,
      "originalite_imaginaire": 7.5,
      "adequation_objectif_age": 9.0,
      "rigueur_technique_calmi": 8.0
    },
    "critique_summary": {
      "executive_summary": "...",
      "audience_fit": "...",
      "emotional_impact": "..."
    },
    "strengths": [
      {
        "aspect": "Accroche sensorielle",
        "analysis": "Plongée directe dans les bruits du plancher sans préambule superflu.",
        "quote": "« Le bois grinça sous la chaussette de Léon. »"
      }
    ],
    "weaknesses": [
      {
        "issue": "Ralentissement au paragraphe 4",
        "impact": "L'explication casse le rythme de l'exploration.",
        "quote": "« Léon savait que sa grand-mère rangeait toujours... »",
        "severity": "mineur"
      }
    ],
    "actionable_improvements": [
      {
        "priority": 1,
        "target_area": "Rythme de la transition",
        "recommendation": "Remplacer l'aparté explicatif par un indice visuel immédiat."
      }
    ],
    "rewrite_demonstration": {
      "scene_context": "Transition vers le grenier",
      "original_excerpt": "« ... »",
      "rewritten_version": "« ... »",
      "editor_explanation": "..."
    }
  },
  "markdownReport": "# 📖 Rapport Critique Littéraire..."
}
```

---

## 🛠️ Scripts & Outils Disponibles

1. **Tester le Webhook en direct** :
   ```bash
   python n8n/test_critique_webhook.py
   ```
2. **Déployer / Mettre à jour le workflow sur n8n** :
   ```bash
   python n8n/generate_workflow.py ; python n8n/deploy_critique_workflow.py
   ```
