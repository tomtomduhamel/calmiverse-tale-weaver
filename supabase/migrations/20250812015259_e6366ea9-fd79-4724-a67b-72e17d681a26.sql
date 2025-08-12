-- Seed initial prompt templates and versions for admin view
-- Inserts 3 templates if they don't exist and sets their active versions

-- 1) System Prompt - Generation
WITH existing AS (
  SELECT id FROM public.prompt_templates WHERE key = 'story_system_prompt'
), ins AS (
  INSERT INTO public.prompt_templates (key, title, description, created_by)
  SELECT 'story_system_prompt', 'System Prompt - Génération d''histoires', 'Instructions système utilisées par OpenAI pour générer les histoires (chemin principal).', gen_random_uuid()
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
), tmpl AS (
  SELECT id FROM ins
  UNION ALL
  SELECT id FROM existing
), ver_ins AS (
  INSERT INTO public.prompt_template_versions (template_id, version, changelog, content, created_by)
  SELECT t.id, 1, 'Version initiale importée du code',
  $$Tu es un expert en création d''histoires pour enfants. 

FORMAT DE L''HISTOIRE :
- Longueur : 6000-10000 mots
- Structure narrative fluide et continue, sans découpage visible
- Pas de titre explicite

RÈGLES FONDAMENTALES POUR PERSONNAGES MULTIPLES :
- Adapte le langage à l''âge du plus jeune enfant présent
- Crée des personnages mémorables et appropriés à chaque genre et âge
- Utilise des dialogues engageants adaptés aux capacités linguistiques
- Ajoute des répétitions et des onomatopées pour les très jeunes enfants
- Intègre harmonieusement les animaux de compagnie comme personnages à part entière
- Évite absolument tout contenu effrayant ou angoissant
- Termine toujours sur une note positive et rassurante
- Respecte les différences de genre sans tomber dans les stéréotypes
- Favorise la coopération et l''amitié entre tous les personnages$$,
  gen_random_uuid()
  FROM tmpl t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.prompt_template_versions v
    WHERE v.template_id = t.id AND v.version = 1
  )
  RETURNING id, template_id
)
UPDATE public.prompt_templates pt
SET active_version_id = v.id
FROM (
  SELECT v.id, v.template_id FROM ver_ins v
  UNION ALL
  SELECT vv.id, vv.template_id
  FROM public.prompt_template_versions vv
  JOIN tmpl t ON t.id = vv.template_id
  WHERE vv.version = 1
) v
WHERE pt.id = v.template_id AND (pt.active_version_id IS NULL);


-- 2) System Prompt - Regeneration
WITH existing AS (
  SELECT id FROM public.prompt_templates WHERE key = 'regenerate_system_prompt'
), ins AS (
  INSERT INTO public.prompt_templates (key, title, description, created_by)
  SELECT 'regenerate_system_prompt', 'System Prompt - Régénération d''histoires', 'Instructions système utilisées par OpenAI pour régénérer une histoire avec paramètres personnalisés.', gen_random_uuid()
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
), tmpl AS (
  SELECT id FROM ins
  UNION ALL
  SELECT id FROM existing
), ver_ins AS (
  INSERT INTO public.prompt_template_versions (template_id, version, changelog, content, created_by)
  SELECT t.id, 1, 'Version initiale importée du code',
  $$Tu es un expert en création d''histoires pour enfants. 

FORMAT DE L''HISTOIRE :
- Longueur : 6000-10000 mots
- Structure narrative fluide et continue, sans découpage visible
- Pas de titre explicite

RÈGLES FONDAMENTALES :
- Adapte le langage à l''âge de l''enfant
- Crée des personnages mémorables et appropriés
- Utilise des dialogues engageants
- Ajoute des répétitions pour les jeunes enfants
- Évite tout contenu effrayant ou angoissant
- Termine toujours sur une note positive$$,
  gen_random_uuid()
  FROM tmpl t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.prompt_template_versions v
    WHERE v.template_id = t.id AND v.version = 1
  )
  RETURNING id, template_id
)
UPDATE public.prompt_templates pt
SET active_version_id = v.id
FROM (
  SELECT v.id, v.template_id FROM ver_ins v
  UNION ALL
  SELECT vv.id, vv.template_id
  FROM public.prompt_template_versions vv
  JOIN tmpl t ON t.id = vv.template_id
  WHERE vv.version = 1
) v
WHERE pt.id = v.template_id AND (pt.active_version_id IS NULL);


-- 3) Advanced User Prompt Template for n8n
WITH existing AS (
  SELECT id FROM public.prompt_templates WHERE key = 'advanced_story_prompt_template'
), ins AS (
  INSERT INTO public.prompt_templates (key, title, description, created_by)
  SELECT 'advanced_story_prompt_template', 'Template Prompt Utilisateur - Histoire Avancée', 'Modèle utilisé pour construire le prompt envoyé à n8n avec analyse multi-personnages et adaptation d''âge.', gen_random_uuid()
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
), tmpl AS (
  SELECT id FROM ins
  UNION ALL
  SELECT id FROM existing
), ver_ins AS (
  INSERT INTO public.prompt_template_versions (template_id, version, changelog, content, created_by)
  SELECT t.id, 1, 'Version initiale alignée sur generateAdvancedStoryPrompt()',
  $$VARIANTES PAR OBJECTIF (appliquées selon {{objective}}) :
- sleep : Créer une histoire douce et apaisante pour aider {{names}} à s''endormir. L''histoire doit être calme, réconfortante et se terminer de manière paisible. Utilisez un langage simple et des images relaxantes. L''histoire doit utiliser les techniques d''hypnose ericksonienne pour permettre un endormissement apaisé et régénérateur.
- focus : Créer une histoire engageante qui aide {{names}} à se concentrer. L''histoire doit captiver l''attention tout en étant éducative et stimulante intellectuellement. Intègre des défis et des mystères adaptés à leur âge.
- relax : Créer une histoire relaxante pour aider {{names}} à se détendre. L''histoire doit être apaisante, avec un rythme lent et des éléments qui favorisent la relaxation. Privilégie les paysages naturels et les moments de contemplation.
- fun : Créer une histoire amusante et divertissante pour {{names}}. L''histoire doit être joyeuse, pleine d''aventures et de moments ludiques qui feront sourire. Intègre de l''humour adapté à leur âge.

BASE :
Créer une histoire pour enfants personnalisée pour {{names}} avec pour objectif : {{objective}}.
{{#if selected_title}}Le titre de l''histoire doit être : "{{selected_title}}". Assure-toi que l''histoire correspond bien à ce titre et développe le thème de manière créative et engageante.{{/if}}

{{character_context}}

ADAPTATION D''ÂGE ET VOCABULAIRE :
{{vocabulary_instructions}}
- Âge des enfants : de {{youngest_age}} à {{oldest_age}} ans (moyenne : {{average_age}} ans)
- Adapte la complexité narrative à l''âge le plus jeune pour que tous puissent suivre
- Si plusieurs âges, crée des niveaux de lecture multiples dans la même histoire

INSTRUCTIONS SPÉCIFIQUES AUX GENRES :
{{gender_instructions}}
- Évite tous stéréotypes de genre tout en respectant les préférences naturelles
- Valorise l''égalité et la complémentarité entre tous les personnages

INSTRUCTIONS POUR LA GÉNÉRATION :
- Personnaliser l''histoire avec tous les prénoms : {{names}}
- Créer une histoire d''environ {{target_words}} mots décomposée ainsi : début (~{{start_words}} mots), développement (~{{middle_words}} mots), fin (~{{end_words}} mots)
- Structurer avec un début, un développement et une fin satisfaisante avec des sauts de lignes pour faciliter la lecture
- Inclure des éléments magiques ou imaginaires adaptés à l''enfance
- S''assurer que l''histoire respecte l''objectif : {{objective}}
- Utiliser un ton bienveillant et positif sans utiliser trop de superlatifs
- Interdire tout contenu effrayant ou inapproprié
- Développer les relations entre les personnages selon leurs caractéristiques
{{#if duration_minutes}}- L''histoire doit pouvoir être lue en environ {{duration_minutes}} minutes{{/if}}

Sortie attendue : Générer maintenant l''histoire complète en français en respectant le nombre de mots demandé (environ {{target_words}} mots).$$,
  gen_random_uuid()
  FROM tmpl t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.prompt_template_versions v
    WHERE v.template_id = t.id AND v.version = 1
  )
  RETURNING id, template_id
)
UPDATE public.prompt_templates pt
SET active_version_id = v.id
FROM (
  SELECT v.id, v.template_id FROM ver_ins v
  UNION ALL
  SELECT vv.id, vv.template_id
  FROM public.prompt_template_versions vv
  JOIN tmpl t ON t.id = vv.template_id
  WHERE vv.version = 1
) v
WHERE pt.id = v.template_id AND (pt.active_version_id IS NULL);
