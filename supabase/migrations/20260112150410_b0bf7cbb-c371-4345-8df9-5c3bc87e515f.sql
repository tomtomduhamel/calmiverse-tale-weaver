-- Insertion du template de prompt pour les suites d'histoires
-- Utilisation d'un ID admin existant pour created_by

DO $$
DECLARE
  v_template_id uuid;
  v_version_id uuid;
  v_admin_id uuid := '416d8301-31f0-47b1-8df3-1ac46cd971d2';
BEGIN
  -- Créer le template principal
  INSERT INTO public.prompt_templates (id, key, title, description, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'sequel_prompt_template',
    'Template Suite d''Histoire',
    'Template utilisé pour générer les suites d''histoires (tomes suivants d''une série)',
    v_admin_id,
    now(),
    now()
  )
  RETURNING id INTO v_template_id;

  -- Créer la première version du contenu
  INSERT INTO public.prompt_template_versions (id, template_id, version, content, changelog, created_by, created_at)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    1,
    'Tu es un expert en création d''histoires pour enfants. Tu dois créer la suite d''une histoire existante.

HISTOIRE PRÉCÉDENTE:
Titre: {{previous_story_title}}
Résumé: {{previous_story_summary}}

CONTEXTE DE LA SÉRIE:
- Tome numéro: {{tome_number}}
- Personnages établis: {{characters}}
- Enfants protagonistes: {{children_names}}

INSTRUCTIONS POUR LA SUITE:
{{sequel_instructions}}

RÈGLES IMPORTANTES:
1. Maintiens la cohérence avec l''histoire précédente
2. Fais évoluer les personnages de manière naturelle
3. Introduis de nouveaux éléments tout en respectant l''univers établi
4. Adapte le vocabulaire à l''âge des enfants: {{vocabulary_level}}
5. L''objectif de l''histoire est: {{objective_description}}

FORMAT:
- Longueur cible: {{target_word_count}} mots
- Structure narrative fluide sans découpage visible
- Pas de titre explicite dans le contenu',
    'Version initiale du template de suite d''histoire',
    v_admin_id,
    now()
  )
  RETURNING id INTO v_version_id;

  -- Activer cette version
  UPDATE public.prompt_templates
  SET active_version_id = v_version_id
  WHERE id = v_template_id;

  RAISE NOTICE 'Template sequel_prompt_template créé avec succès (ID: %)', v_template_id;
END $$;