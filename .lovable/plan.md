

## Plan : Refonte des tables de génération d'histoires avec variété narrative

### Contexte actuel

Aujourd'hui, la variété narrative repose uniquement sur le prompt textuel stocké dans `prompt_templates` / `prompt_template_versions`. Le prompt est sélectionné par objectif (`story_prompt_sleep`, `story_prompt_focus`, etc.) puis enrichi avec des variables (`{{children_names}}`, `{{vocabulary_level}}`, etc.) avant envoi à n8n. Il n'y a aucune table structurée pour les schémas narratifs, les canaux sensoriels, les univers symboliques ou les techniques ericksoniennes.

### Proposition

#### 1. Nouvelles tables Supabase (5 tables)

```text
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   age_cognition      │  │  narrative_schemas    │  │    vakog_focus       │
│──────────────────────│  │──────────────────────│  │──────────────────────│
│ id (uuid PK)         │  │ id (uuid PK)         │  │ id (uuid PK)         │
│ range (text)         │  │ type (text)           │  │ sensory_type (text)  │
│ characteristics(text)│  │ description (text)    │  │ sensory_keywords     │
│ preferred_supports   │  │ mechanism (text)      │  │   (text[])           │
│   (text[])           │  │ is_active (bool)      │  │ is_active (bool)     │
│ is_active (bool)     │  └──────────────────────┘  └──────────────────────┘
└──────────────────────┘
┌──────────────────────┐  ┌──────────────────────────┐
│ symbolic_universes   │  │ ericksonian_techniques   │
│──────────────────────│  │──────────────────────────│
│ id (uuid PK)         │  │ id (uuid PK)             │
│ name (text)          │  │ name (text)              │
│ description (text)   │  │ linguistic_pattern (text) │
│ visual_style (text)  │  │ objective_affinity        │
│ objective_affinity   │  │   (text[])  -- sleep,relax│
│   (text[])           │  │ is_active (bool)          │
│ is_active (bool)     │  └──────────────────────────┘
└──────────────────────┘
```

**Points clés de design :**
- `objective_affinity` (text[]) sur `symbolic_universes` et `ericksonian_techniques` permet de filtrer optionnellement par objectif (sleep, focus, relax, fun) tout en gardant la possibilité de "random select" global.
- `is_active` sur chaque table permet d'activer/désactiver des entrées sans les supprimer.
- RLS : lecture pour `authenticated`, modification pour `admin` uniquement.
- Pas de foreign key vers `age_cognition` depuis les autres tables -- le matching par âge se fait côté application.

#### 2. Seed data (INSERT via l'outil insert)

Exactement les données décrites dans la demande, plus quelques entrées complémentaires VAKOG :
- **age_cognition** : 5 tranches (0-2, 2-4, 4-6, 8-12, 13+)
- **narrative_schemas** : 4 types (Linéaire, Répétitif, Boucle, Tiroir)
- **vakog_focus** : 5 sens (Visuel, Auditif, Kinesthésique, Olfactif, Gustatif)
- **symbolic_universes** : 4+ univers (Volcan/Dragons, Bulle de protection, Animaux ressources, Espace, Nature, Micro-monde)
- **ericksonian_techniques** : 4 techniques (Double lien, Présupposition, Confusion, Saupoudrage)

#### 3. Modifications côté application

**a) Nouveau hook `useStoryVariation.ts`**
- Requête les 4 tables (narrative_schemas, vakog_focus, symbolic_universes, ericksonian_techniques) avec `is_active = true`
- Filtre optionnel par `objective_affinity` pour symbolic_universes et ericksonian_techniques
- Sélectionne 1 entrée aléatoire par table (random select JS)
- Requête `age_cognition` filtrée par l'âge du plus jeune enfant
- Retourne un objet `StoryVariation` avec les 5 éléments sélectionnés

**b) Mise à jour de `useN8nStoryFromTitle.tsx`**
- Appeler `useStoryVariation` pour obtenir les éléments aléatoires
- Ajouter les nouvelles variables au payload envoyé à n8n :
  - `{{narrative_schema}}` -- type + mechanism
  - `{{vakog_focus}}` -- type sensoriel + mots-clés
  - `{{symbolic_universe}}` -- nom + description + style visuel
  - `{{ericksonian_technique}}` -- nom + pattern linguistique
  - `{{age_cognition}}` -- caractéristiques + supports préférés
- Ces variables sont injectées dans le template via `replacePromptVariables()`

**c) Mise à jour de `promptVariables.ts`**
- Ajouter les nouvelles variables à l'interface `PromptVariables` :
  ```
  narrative_schema?: string;
  narrative_mechanism?: string;
  vakog_focus?: string;
  vakog_keywords?: string;
  symbolic_universe?: string;
  symbolic_description?: string;
  symbolic_visual_style?: string;
  ericksonian_technique?: string;
  ericksonian_pattern?: string;
  age_characteristics?: string;
  age_preferred_supports?: string;
  ```

**d) Mise à jour des templates de prompts dans la DB**
- Mettre à jour le contenu des prompts existants (`advanced_story_prompt_template`, `story_prompt_sleep`, etc.) pour inclure les nouvelles variables `{{narrative_schema}}`, `{{vakog_focus}}`, `{{symbolic_universe}}`, `{{ericksonian_technique}}`, `{{age_characteristics}}`.
- Créer de nouvelles versions via l'admin existant (pas de migration, utilisation du versioning en place).

**e) Admin : nouvelle page ou section pour gérer ces tables**
- Ajouter une page `/admin/story-ingredients` avec des CRUD simples pour les 5 tables (lister, ajouter, activer/désactiver, éditer).
- Interface compacte avec des onglets par table.

#### 4. Logique de sélection aléatoire

```text
Flux de génération :
1. Utilisateur choisit objectif + enfants + titre
2. App récupère age_cognition (filtre par âge)
3. App fait un random select dans :
   - narrative_schemas (tous actifs)
   - vakog_focus (tous actifs)
   - symbolic_universes (filtre optionnel par objectif)
   - ericksonian_techniques (filtre optionnel par objectif)
4. Variables injectées dans le template prompt
5. Payload envoyé à n8n avec prompt enrichi
```

La longueur de l'histoire reste pilotée par `durationMinutes` / `targetWordCount`, indépendamment de l'âge (conformément à la demande).

#### 5. Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | CREATE 5 tables + RLS + index |
| INSERT SQL | Seed data pour les 5 tables |
| `src/hooks/stories/useStoryVariation.ts` | **Nouveau** -- random select |
| `src/utils/promptVariables.ts` | Ajouter nouvelles variables |
| `src/hooks/stories/useN8nStoryFromTitle.tsx` | Intégrer variations dans le payload |
| `src/utils/storyPromptUtils.ts` | Retirer la logique vocabulaire/âge hardcodée (remplacée par DB) |
| `src/pages/admin/StoryIngredients.tsx` | **Nouveau** -- CRUD admin des 5 tables |
| `src/App.tsx` | Ajouter route `/admin/story-ingredients` |

#### 6. Ce qui ne change PAS

- La structure `prompt_templates` / `prompt_template_versions` reste intacte
- Le flux n8n reste le même (il reçoit juste un prompt plus riche)
- Le hook `useActivePrompts` continue de fonctionner
- L'interface admin des prompts reste en place
- Les Edge Functions existantes ne sont pas modifiées

