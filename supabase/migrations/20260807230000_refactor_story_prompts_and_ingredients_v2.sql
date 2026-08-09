-- ============================================================
-- Migration V2 : Rénovation narrative, Dissociation Hypnose/Objectif,
-- Calibrage du vocabulaire selon l'âge et limitation des onomatopées.
-- ============================================================

-- 1. Ajout de la colonne objective_affinity sur narrative_schemas et vakog_focus si nécessaire
ALTER TABLE public.narrative_schemas 
  ADD COLUMN IF NOT EXISTS objective_affinity text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.vakog_focus 
  ADD COLUMN IF NOT EXISTS objective_affinity text[] NOT NULL DEFAULT '{}';

-- 2. Nettoyage et enrichissement de age_cognition avec directives de vocabulaire épuré et limite de 3 onomatopées
UPDATE public.age_cognition 
SET characteristics = 'Sensibilité sensorielle et rythmique simple. Phrases très courtes (Sujet-Verbe-Complément). Mots concrets du quotidien direct (doudou, chat, pomme, bain). Interdiction absolue du vocabulaire abstrait ou littéraire. Maximum 3 onomatopées simples dans toute l''histoire.',
    preferred_supports = ARRAY['mots du quotidien', 'phrases courtes', 'max 3 onomatopées', 'doudou familier']
WHERE range = '0-2 ans';

UPDATE public.age_cognition 
SET characteristics = 'Pensée animiste et imaginaire concret. Vocabulaire simple, vivant, imagé et chaleureux. Verbes d''action concrets (courir, grimper, rire). Interdiction formelle du style précieux ou pompeux. Maximum 3 onomatopées bien choisies.',
    preferred_supports = ARRAY['verbes d''action', 'animaux expressifs', 'objets magiques concrets', 'max 3 onomatopées']
WHERE range = '2-4 ans';

UPDATE public.age_cognition 
SET characteristics = 'Imagination active, identification aux héros et quiproquos rigolos. Vocabulaire accessible et direct. Aucun mot inutilement complexe. Humour de situation, bêtises innocentes et doudou gaffeur. Maximum 3 onomatopées.',
    preferred_supports = ARRAY['héros courageux', 'quiproquos loufoques', 'défis accessibles', 'max 3 onomatopées']
WHERE range = '4-6 ans';

UPDATE public.age_cognition 
SET characteristics = 'Pensée logique, aventures rythmées, chasses aux trésors déjantées et énigmes stimulantes. Vocabulaire adapté à l''école primaire avec au maximum 2 à 3 mots enrichissants immédiatement compréhensibles en contexte. Maximum 3 onomatopées.',
    preferred_supports = ARRAY['chasses au trésor', 'énigmes déjantées', 'dialogues rythmés', 'max 3 onomatopées']
WHERE range = '8-12 ans';

UPDATE public.age_cognition 
SET characteristics = 'Besoin d''autonomie, dialogues modernes et piquants, autodérision bienveillante et esprit critique. Rejet de l''infantilisation et du style grandiloquent. Élan d''action et de fierté. Maximum 3 onomatopées.',
    preferred_supports = ARRAY['dialogues vifs', 'ironie bienveillante', 'défis d''équipe', 'autonomie']
WHERE range = '13+ ans';

-- 3. Mise à jour et insertion dans narrative_schemas
UPDATE public.narrative_schemas
SET description = 'Déroulement fluide et progressif',
    mechanism = 'Début-Milieu-Fin. L''histoire avance naturellement vers la résolution de son objectif spécifique (sans forcer de détente si l''objectif est dynamique).',
    objective_affinity = ARRAY['sleep', 'relax', 'focus', 'fun']
WHERE type = 'Linéaire';

UPDATE public.narrative_schemas
SET description = 'Une situation ou un dialogue revient avec des variations comiques ou intrigantes',
    mechanism = 'Un élément narratif (running gag, phrase fétiche, défi récurrent) se répète avec une escalade inattendue.',
    objective_affinity = ARRAY['fun', 'focus', 'relax']
WHERE type = 'Répétitif';

UPDATE public.narrative_schemas
SET description = 'L''histoire boucle avec un gain d''expérience, de rire ou d''énergie',
    mechanism = 'Le personnage revient à sa situation initiale, mais transformé avec une fierté nouvelle ou un grand éclat de rire.',
    objective_affinity = ARRAY['fun', 'focus', 'sleep', 'relax']
WHERE type = 'En Boucle';

UPDATE public.narrative_schemas
SET description = 'Des mini-défis ou anecdotes imbriqués',
    mechanism = 'Une quête principale rythmée par de petites péripéties interactives et amusantes.',
    objective_affinity = ARRAY['fun', 'focus']
WHERE type = 'Tiroir';

INSERT INTO public.narrative_schemas (type, description, mechanism, objective_affinity, is_active)
VALUES
('Cascade de Quiproquos', 'Une série de malentendus loufoques qui s''enchaînent', 'Chaque tentative de résoudre un petit problème crée une péripétie encore plus drôle, jusqu''à une chute joyeuse.', ARRAY['fun'], true),
('Défi contre la Montre', 'Une aventure rythmée avec un compte à rebours stimulant', 'Les héros doivent accomplir une mission rigolote ou captivante avant un événement précis.', ARRAY['fun', 'focus'], true),
('Inversion des Rôles', 'L''enfant ou l''animal devient le guide d''un adulte ou d''une créature perdue', 'L''adulte ou la créature fait des bêtises et l''enfant trouve des solutions ingénieuses avec fierté.', ARRAY['fun', 'focus'], true),
('Enquête Mystère', 'Une recherche d''indices palpitante et interactive', 'Chaque étape révèle un détail inattendu qui fait appel à l''observation et à la déduction.', ARRAY['focus'], true),
('Explosion Libératrice', 'Une montée d''énergie transformée en triomphe créatif', 'Une émotion forte (colère, trop-plein d''énergie) est canalisée dans une action spectaculaire, drôle et valorisante.', ARRAY['fun'] , true)
ON CONFLICT DO NOTHING;

-- 4. Mise à jour et insertion dans vakog_focus
UPDATE public.vakog_focus
SET sensory_keywords = ARRAY['couleurs vives', 'lumières scintillantes', 'formes drôles', 'étincelles multicolores', 'reflets dorés'],
    objective_affinity = ARRAY['fun', 'focus']
WHERE sensory_type = 'Visuel';

UPDATE public.vakog_focus
SET sensory_keywords = ARRAY['éclats de rire', 'bruits de ressorts', 'ploufs sonores', 'mélodie entraînante', 'chuchotement complice'],
    objective_affinity = ARRAY['fun', 'focus']
WHERE sensory_type = 'Auditif';

UPDATE public.vakog_focus
SET sensory_keywords = ARRAY['rebonds joyeux', 'chatouilles', 'vent de course', 'énergie qui pétille', 'mains qui applaudissent'],
    objective_affinity = ARRAY['fun']
WHERE sensory_type = 'Kinesthésique';

INSERT INTO public.vakog_focus (sensory_type, sensory_keywords, objective_affinity, is_active)
VALUES
('Visuel Apaisant', ARRAY['ombres douces', 'étoiles bienveillantes', 'ciel nocturne', 'brume bleutée', 'lueur de veilleuse'], ARRAY['sleep', 'relax'], true),
('Auditif Cocon', ARRAY['murmure régulier', 'ronronnement doux', 'vent léger dans les feuilles', 'rythme d''une vague tiède'], ARRAY['sleep', 'relax'], true),
('Kinesthésique Apaisant', ARRAY['couverture moelleuse', 'chaleur du lit', 'bras réconfortants', 'paupières lourdes et calmes'], ARRAY['sleep', 'relax'], true),
('Gustatif et Olfactif Gourmand', ARRAY['odeur de gâteau chaud', 'parfum de fraise des bois', 'saveur de chocolat fondant', 'brise de vanille'], ARRAY['fun', 'relax', 'focus'], true)
ON CONFLICT DO NOTHING;

-- 5. Mise à jour et insertion dans symbolic_universes
UPDATE public.symbolic_universes
SET objective_affinity = ARRAY['fun', 'focus']
WHERE name = 'Volcan et Dragons';

UPDATE public.symbolic_universes
SET objective_affinity = ARRAY['sleep', 'relax']
WHERE name = 'Bulle de protection';

UPDATE public.symbolic_universes
SET objective_affinity = ARRAY['sleep', 'relax', 'focus', 'fun']
WHERE name = 'Animaux ressources';

UPDATE public.symbolic_universes
SET objective_affinity = ARRAY['sleep', 'relax']
WHERE name = 'Espace et étoiles';

UPDATE public.symbolic_universes
SET objective_affinity = ARRAY['sleep', 'relax', 'focus']
WHERE name = 'Nature enchantée';

UPDATE public.symbolic_universes
SET objective_affinity = ARRAY['focus', 'fun']
WHERE name = 'Micro-monde';

INSERT INTO public.symbolic_universes (name, description, visual_style, objective_affinity, is_active)
VALUES
('L''Académie des Animaux Gaffeurs', 'Une école loufoque où les animaux apprennent des tours impossibles et font rire la galerie.', 'Couleurs franches, scènes dynamiques et gags visuels', ARRAY['fun'], true),
('La Fabrique d''Inventions Farfelues', 'Un atelier secret où l''on construit des machines qui lancent des confettis ou font des crêpes carrées.', 'Engrenages dorés, vapeur colorée, étincelles joyeuses', ARRAY['fun', 'focus'], true),
('L''Île aux Énigmes Renversées', 'Une île où tout fonctionne à l''envers et où chaque énigme demande de la vivacité d''esprit.', 'Contrastes vifs, perspectives amusantes, sentiers secrets', ARRAY['focus', 'fun'], true),
('Le Défilé des Super-Doudous', 'Les doudous prennent vie en secret et préparent une surprise hilarante pour les enfants.', 'Teintes chaleureuses, textures douces, rebondissements comiques', ARRAY['fun'], true)
ON CONFLICT DO NOTHING;

-- 6. Mise à jour et insertion dans ericksonian_techniques
UPDATE public.ericksonian_techniques
SET linguistic_pattern = 'Accentue subtilement les ressources clés du récit (audace, rire, curiosité, confiance ou calme selon l''objectif choisi).',
    objective_affinity = ARRAY['sleep', 'relax', 'focus', 'fun']
WHERE name = 'Saupoudrage';

UPDATE public.ericksonian_techniques
SET linguistic_pattern = 'Offre deux choix amusants ou constructifs menant au même élan positif.',
    objective_affinity = ARRAY['fun', 'focus', 'sleep', 'relax']
WHERE name = 'Double lien';

INSERT INTO public.ericksonian_techniques (name, linguistic_pattern, objective_affinity, is_active)
VALUES
('Rupture de Pattern Ludique', 'Interrompt une routine ou une attente par une surprise comique qui recentre immédiatement l''attention.', ARRAY['fun', 'focus'], true),
('Recadrage par l''Absurde', 'Transforme une peur ou un énervement en une situation ridicule qui déclenche le sourire et dégonfle la tension.', ARRAY['fun'], true),
('Ancrage d''Empowerment', 'Associe un mot rigolo ou un geste héroïque à un sentiment de fierté, de force et d''envie d''agir.', ARRAY['fun', 'focus'], true),
('Métaphore de Propulsion', 'Utilise l''énergie accumulée pour la convertir en moteur d''action joyeux et motivant.', ARRAY['fun'] , true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. Insertion des VERSIONS 2 des Prompt Templates
-- ============================================================

-- Helper function pour insérer/mettre à jour une Version 2
CREATE OR REPLACE FUNCTION public.create_or_update_prompt_v2(
  p_key TEXT,
  p_title TEXT,
  p_description TEXT,
  p_content TEXT,
  p_changelog TEXT DEFAULT 'Version 2 : Calibrage vocabulaire selon âge, max 3 onomatopées, dissociation hypnose/objectif'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template_id UUID;
  v_version_id UUID;
BEGIN
  -- 1. Récupérer ou créer le template
  SELECT id INTO v_template_id FROM public.prompt_templates WHERE key = p_key;
  
  IF v_template_id IS NULL THEN
    INSERT INTO public.prompt_templates (key, title, description)
    VALUES (p_key, p_title, p_description)
    RETURNING id INTO v_template_id;
  ELSE
    UPDATE public.prompt_templates 
    SET title = p_title, description = p_description
    WHERE id = v_template_id;
  END IF;

  -- 2. Insérer la version 2 (ou remplacer si déjà présente)
  SELECT id INTO v_version_id 
  FROM public.prompt_template_versions 
  WHERE template_id = v_template_id AND version = 2;

  IF v_version_id IS NULL THEN
    INSERT INTO public.prompt_template_versions (template_id, version, content, changelog)
    VALUES (v_template_id, 2, p_content, p_changelog)
    RETURNING id INTO v_version_id;
  ELSE
    UPDATE public.prompt_template_versions
    SET content = p_content, changelog = p_changelog, updated_at = now()
    WHERE id = v_version_id;
  END IF;

  -- 3. Mettre à jour la version active du template vers cette version 2
  UPDATE public.prompt_templates
  SET active_version_id = v_version_id, updated_at = now()
  WHERE id = v_template_id;

  RETURN v_version_id;
END;
$$;

-- 7.1 System Prompts V2
SELECT public.create_or_update_prompt_v2(
  'story_system_prompt',
  'System Prompt - Génération d''histoires',
  'Instructions système pour la génération des histoires avec dissociation hypnose/objectif et règles de vocabulaire strictes.',
  $$Tu es un auteur jeunesse d'élite et expert en storytelling captivant pour enfants.

MODÈLE NARRATIF EN 2 TEMPS :
1. Temps 1 (Accroche sensorielle - 30-45s) : Capte immédiatement l'attention par un détail sensoriel vif, un bruit curieux ou une rupture d'attente pour connecter l'enfant à l'instant présent.
2. Temps 2 (Déploiement de l'objectif à 100%) : Respecte scrupuleusement la dynamique de l'objectif choisi :
   - "fun" : Énergie haute, gags, situations loufoques, dialogues vifs, rebondissements comiques. INTERDICTION formelle d'en faire un conte soporifique ou lénifiant.
   - "focus" : Énigmes stimulantes, indices à repérer, curiosité et esprit de déduction.
   - "relax" : Sérénité et contemplation sans obligation de dormir.
   - "sleep" : Seul objectif avec décélération progressive vers l'endormissement.
   - Émotions / Situations de jour : Dénouement sur un élan d'action, de courage ou de fierté.

CALIBRAGE DU VOCABULAIRE PAR ÂGE :
- INTERDICTION du vocabulaire trop élaboré, littéraire ou ampoulé (ex: proscrire "ondulations diaphanes", "béatitude", "phosphorescence").
- 0-3 ans : Phrases très courtes (S+V+C), mots familiers du quotidien direct (doudou, pomme, bain, chat).
- 4-6 ans : Vocabulaire simple, vivant, imagé et chaleureux. Verbes d'action concrets.
- 7-10 ans : Vocabulaire scolaire fluide. Au maximum 2 à 3 mots enrichissants immédiatement clairs en contexte.
- 11+ ans : Dialogues dynamiques, esprit vif, respect de leur maturité sans infantilisation.

RÈGLE DES ONOMATOPÉES :
- MAXIMUM 3 ONOMATOPÉES DANS TOUTE L'HISTOIRE (ex: Hop !, Plouf !, Chut...). L'excès d'onomatopées est strictement interdit pour préserver la consistance de lecture.

FORMAT :
- Pas de titre explicite au début du texte, pas de mot "Fin" à la fin.
- Sauts de lignes réguliers pour une lecture agréable.$$
);

SELECT public.create_or_update_prompt_v2(
  'regenerate_system_prompt',
  'System Prompt - Régénération d''histoires',
  'Instructions système pour la régénération d''histoires avec nouveaux paramètres.',
  $$Tu es un auteur jeunesse d'élite chargé de renouveler intégralement une histoire pour enfants selon de nouveaux paramètres.

RÈGLES IMPÉRATIVES :
- Respecte à 100% l'objectif demandé (si fun : rire et énergie ; si focus : énigmes ; si sleep : sommeil ; si émotions de jour : élan d'action/fierté).
- Vocabulaire calibré à l'âge (aucun mot pompeux ou littéraire).
- Maximum 3 onomatopées dans toute l'histoire.
- Décor et péripéties radicalement différents de la version précédente.$$
);

SELECT public.create_or_update_prompt_v2(
  'advanced_story_prompt_template',
  'Template Prompt Utilisateur - Histoire Avancée',
  'Modèle utilisé pour construire le prompt envoyé à l''IA avec analyse multi-personnages et adaptation d''âge.',
  $$OBJECTIF DE L'HISTOIRE : {{objective}} ({{objective_description}})

{{#if selected_title}}TITRE SÉLECTIONNÉ : "{{selected_title}}"
Assure-toi que l'histoire correspond parfaitement à ce titre et développe une intrigue surprenante et originale.{{/if}}

{{children_context}}

CALIBRAGE DU VOCABULAIRE & ÂGE :
{{vocabulary_level}}
- Âge des enfants : de {{youngest_age}} à {{oldest_age}} ans (moyenne : {{average_age}} ans).
- RÈGLE ABSOLUE : Proscrire tout vocabulaire précieux ou grandiloquent. Utiliser des mots vivants et concrets adaptés à l'âge.
- LIMITE STRICTE : Maximum 3 onomatopées dans l'ensemble de l'histoire.

CADRE NARRATIF & IMMERSION :
- Schéma narratif : {{narrative_schema}} ({{narrative_mechanism}})
- Univers symbolique : {{symbolic_universe}} — {{symbolic_description}} (Style : {{symbolic_visual_style}})
- Ancrage sensoriel VAKOG : {{vakog_focus}} (Mots sensoriels : {{vakog_keywords}})
- Ressort hypnotique / suggestion : {{ericksonian_technique}} ({{ericksonian_pattern}})

STRUCTURE ET RYTHME (environ {{target_word_count}} mots) :
1. Début (~25%) : Accroche sensorielle immédiate dans le moment présent, découverte du décor et du défi.
2. Développement (~50%) : Péripéties rythmées, dialogues vivants et progression de l'objectif (si fun: gags et quiproquos ; si focus: indices et défis ; si sommeil: apaisement progressif).
3. Dénouement (~25%) : Résolution satisfaisante (élan d'action/fierté pour les émotions de jour, rire communicatif pour fun, sommeil paisible uniquement pour sleep).

Génère maintenant l'histoire complète en français en respectant scrupuleusement la longueur d'environ {{target_word_count}} mots.$$
);

-- 7.2 Prompts des 4 Objectifs Principaux V2
SELECT public.create_or_update_prompt_v2(
  'story_prompt_fun',
  'Histoire Fun / S''amuser',
  'Prompt pour créer une histoire drôle, énergisante, pleine de quiproquos et de rires.',
  $$Créer une histoire très amusante, pleine de rebondissements comiques et de joie pour {{children_names}}.

DYNAMIQUE DE L'OBJECTIF "S'AMUSER" (ÉNERGIE HAUTE) :
- L'histoire doit faire rire, sourire et donner de l'énergie aux enfants !
- INTERDICTION FORMELLE d'en faire une histoire apaisante, soporifique ou lénifiante.
- Selon l'âge des enfants :
  * 0-3 ans : Comique visuel simple, animaux maladroits, petits jeux de cache-cache rigolos.
  * 4-6 ans : Quiproquos loufoques, bêtises innocentes, doudou gaffeur, inversion des rôles.
  * 7-10 ans : Aventures rythmées, défis déjantés, running gags et chutes inattendues.
  * 11+ ans : Dialogues piquants, autodérision bienveillante et situations absurdes.

{{#if selected_title}}Titre : "{{selected_title}}"{{/if}}
{{children_context}}

CONSIGNES LINGUISTIQUES :
{{vocabulary_level}}
- Vocabulaire accessible, clair et direct. Aucun mot inutilement compliqué ou grandiloquent.
- MAXIMUM 3 ONOMATOPÉES dans toute l'histoire.

Longueur attendue : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'story_prompt_focus',
  'Histoire Focus / Concentration',
  'Prompt pour créer une aventure stimulante, avec énigmes interactives et détails d''observation.',
  $$Créer une histoire captivante et stimulante qui entraîne la concentration et la curiosité de {{children_names}}.

DYNAMIQUE DE L'OBJECTIF "CONCENTRATION" :
- Propose une intrigue avec des mystères adaptés à l'âge, des indices visuels ou sonores à repérer.
- Encourage les héros à faire preuve d'observation, de mémoire et de réflexion ingénieuse.
- Ton alerte, clair et passionnant.

{{#if selected_title}}Titre : "{{selected_title}}"{{/if}}
{{children_context}}

CONSIGNES LINGUISTIQUES :
{{vocabulary_level}}
- Vocabulaire précis et stimulant, sans jargon inutile.
- MAXIMUM 3 ONOMATOPÉES dans toute l'histoire.

Longueur attendue : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'story_prompt_relax',
  'Histoire Détente / Relaxation',
  'Prompt pour créer un moment de sérénité, de contemplation douce et de bien-être sans forcer le sommeil.',
  $$Créer une histoire apaisante et bienveillante pour offrir un moment de détente et de sérénité à {{children_names}}.

DYNAMIQUE DE L'OBJECTIF "DÉTENTE" :
- Ambiance réconfortante, paysages doux, respiration agréable et contemplation naturelle.
- Permet de relâcher les tensions tout en restant éveillé et serein.

{{#if selected_title}}Titre : "{{selected_title}}"{{/if}}
{{children_context}}

CONSIGNES LINGUISTIQUES :
{{vocabulary_level}}
- Vocabulaire doux, simple et rassurant.
- MAXIMUM 3 ONOMATOPÉES dans toute l'histoire.

Longueur attendue : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'story_prompt_sleep',
  'Histoire du Soir / Sommeil',
  'Prompt pour accompagner doucement l''enfant vers un endormissement paisible et réparateur.',
  $$Créer une histoire douce, enveloppante et progressive pour accompagner paisiblement {{children_names}} vers le sommeil.

DYNAMIQUE DE L'OBJECTIF "SOMMEIL" :
- Utilise les techniques de descente hypnotique progressive : rythme qui ralentit en douceur, sensation de cocon moelleux, paupières agréablement lourdes.
- L'histoire s'achève sur une note de sécurité totale et un passage naturel vers de doux rêves.

{{#if selected_title}}Titre : "{{selected_title}}"{{/if}}
{{children_context}}

CONSIGNES LINGUISTIQUES :
{{vocabulary_level}}
- Vocabulaire simple, doux et réconfortant.
- MAXIMUM 3 ONOMATOPÉES dans toute l'histoire.

Longueur attendue : environ {{target_word_count}} mots.$$
);

-- 7.3 Histoires Rapides V2 (Émotions & Régulation)
SELECT public.create_or_update_prompt_v2(
  'fast_story_fear', '⚡ Rapide — Peur', 'Craintes, angoisses, sentiment d''insécurité',
  $$Créer une histoire captivante pour aider un enfant d'environ 6 ans à apprivoiser et surmonter sa peur.
DÉMARCHE : Démystifier la peur avec humour ou astuce (découvrir que la chose effrayante est inoffensive ou rigolote).
SORTIE : L'histoire doit se terminer sur un ÉLAN DE COURAGE, DE FIERTÉ ET D'ACTION (prêt à retourner jouer).
CONSIGNES : Vocabulaire simple, concret. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_anxiety', '⚡ Rapide — Anxiété', 'Inquiétudes et pensées en boucle',
  $$Créer une histoire vive pour libérer un enfant d'environ 6 ans de ses inquiétudes.
DÉMARCHE : Transformer le tourbillon de pensées en une force motrice ou une création rigolote.
SORTIE : Clarté mentale, sourire et envie d'agir avec enthousiasme.
CONSIGNES : Vocabulaire simple, concret. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_anger', '⚡ Rapide — Colère', 'Frustration, tempête intérieure',
  $$Créer une histoire pour aider un enfant d'environ 6 ans à libérer sa colère de manière constructive et ludique.
DÉMARCHE : Ne pas forcer le calme passif. Accueillir l'énergie du volcan pour en faire un moteur d'action spectaculaire ou un moment comique.
SORTIE : Rire libérateur, fierté d'avoir maîtrisé son super-pouvoir et énergie positive pour la journée.
CONSIGNES : Vocabulaire simple et vivant. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_sadness', '⚡ Rapide — Tristesse', 'Chagrin, peine, besoin de réconfort',
  $$Créer une histoire chaleureuse pour réconforter un enfant d'environ 6 ans et lui redonner le sourire.
DÉMARCHE : Accueillir l'émotion puis ouvrir sur une étincelle de jeu, une amitié complice et un nouvel horizon joyeux.
SORTIE : Cœur léger, sourire retrouvé et envie de partager un moment joyeux.
CONSIGNES : Vocabulaire tendre et accessible. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_stress', '⚡ Rapide — Stress', 'Tension nerveuse, surcharge mentale',
  $$Créer une histoire délassante et entraînante pour évacuer la pression accumulée par un enfant d'environ 6 ans.
DÉMARCHE : Une aventure loufoque qui fait dégonfler la pression comme un ballon de baudruche rigolo.
SORTIE : Énergie renouvelée, légèreté et confiance pour relever les défis de la journée.
CONSIGNES : Vocabulaire concret et frais. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_agitation', '⚡ Rapide — Agitation', 'Impulsivité, débordement d''énergie',
  $$Créer une histoire dynamique pour canaliser le trop-plein d'énergie d'un enfant d'environ 6 ans.
DÉMARCHE : Transformer l'agitation en une mission rythmée de précision et de jeu d'équipe amusant.
SORTIE : Sentiment de contrôle de son corps, fierté et motivation joyeuse.
CONSIGNES : Vocabulaire vif et accessible. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_guilt', '⚡ Rapide — Culpabilité', 'Se sentir maladroit, regret d''une bêtise',
  $$Créer une histoire bienveillante et déculpabilisante pour un enfant d'environ 6 ans.
DÉMARCHE : Montrer que les erreurs sont des étapes d'apprentissage et qu'une maladresse peut devenir une formidable invention.
SORTIE : Fierté de réparer avec ingéniosité, cœur léger et élan d'action.
CONSIGNES : Vocabulaire simple et rassurant. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_pain', '⚡ Rapide — Douleur', 'Douleur physique ou émotionnelle',
  $$Créer une histoire captivante pour défocaliser l'attention d'un enfant d'environ 6 ans d'une douleur ou d'un inconfort.
DÉMARCHE : Absorption de l'esprit dans une mission palpitante avec un personnage courageux et astucieux.
SORTIE : Soulagement, sentiment de force intérieure et fierté d'être un petit héros.
CONSIGNES : Vocabulaire simple et engageant. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

-- 7.4 Histoires Rapides V2 (Ressources & Renforcement)
SELECT public.create_or_update_prompt_v2(
  'fast_story_confidence', '⚡ Rapide — Confiance en soi', 'Estime de soi, croire en ses capacités',
  $$Créer une histoire stimulante et valorisante pour booster la confiance en soi d'un enfant d'environ 6 ans.
DÉMARCHE : Le héros découvre une compétence insoupçonnée en osant essayer face à un défi amusant.
SORTIE : Grand sentiment de fierté, posture victorieuse et envie de se lancer dans de nouvelles aventures.
CONSIGNES : Vocabulaire enthousiaste et accessible. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_serenity', '⚡ Rapide — Sérénité', 'Calme intérieur, paix profonde',
  $$Créer une histoire douce et lumineuse pour cultiver la paix intérieure d'un enfant d'environ 6 ans.
DÉMARCHE : Découverte d'un refuge secret dans la nature ou d'un sanctuaire imaginaire ressourçant.
SORTIE : Sérénité solide, clarté d'esprit et sourire bienveillant.
CONSIGNES : Vocabulaire fluide et simple. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_joy', '⚡ Rapide — Joie', 'Enthousiasme, bonne humeur, légèreté',
  $$Créer une histoire pétillante, joyeuse et rythmée pour un enfant d'environ 6 ans.
DÉMARCHE : Une fête inattendue, une découverte surprenante et un éclat de rire partagé.
SORTIE : Énergie communicative, enthousiasme débordant et envie de chanter ou sauter de joie.
CONSIGNES : Vocabulaire vivant et joyeux. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_courage', '⚡ Rapide — Courage', 'Force intérieure, dépasser ses limites',
  $$Créer une histoire héroïque et dynamique pour inspirer le courage d'un enfant d'environ 6 ans.
DÉMARCHE : Franchir un passage audacieux grâce à l'ingéniosité et à la détermination.
SORTIE : Élan de fierté, posture assurée et détermination à réussir sa journée.
CONSIGNES : Vocabulaire dynamique et concret. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_curiosity', '⚡ Rapide — Curiosité', 'Envie d''apprendre, explorer le monde',
  $$Créer une aventure palpitante d'exploration scientifique ou naturelle pour un enfant d'environ 6 ans.
DÉMARCHE : Observation d'un mystère fascinant et résolution par des questions astucieuses.
SORTIE : Esprit en éveil, émerveillement et soif de poser des questions et d'explorer.
CONSIGNES : Vocabulaire clair et imagé. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_empathy', '⚡ Rapide — Empathie', 'Bienveillance, comprendre les autres',
  $$Créer une histoire touchante et drôle sur l'amitié et la solidarité pour un enfant d'environ 6 ans.
DÉMARCHE : Comprendre les émotions d'un ami ou d'un animal et trouver une solution d'équipe.
SORTIE : Sentiment d'appartenance, chaleur dans le cœur et fierté d'être un bon camarade.
CONSIGNES : Vocabulaire chaleureux et accessible. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_pride', '⚡ Rapide — Fierté', 'Sentiment d''accomplissement, valorisation',
  $$Créer une histoire valorisante célébrant les progrès et la persévérance d'un enfant d'environ 6 ans.
DÉMARCHE : Mener à bien une tâche réputée difficile avec inventivité et ténacité.
SORTIE : Fierté rayonnante, estime de soi solide et envie de montrer ses talents.
CONSIGNES : Vocabulaire valorisant et simple. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_focus_skill', '⚡ Rapide — Concentration', 'Attention, ancrage et focalisation',
  $$Créer une aventure interactive d'adresse et de concentration pour un enfant d'environ 6 ans.
DÉMARCHE : Suivre une piste pleine d'indices cachés demandant calme et précision.
SORTIE : Esprit affûté, concentration stable et fierté du travail accompli.
CONSIGNES : Vocabulaire précis et accessible. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_creativity', '⚡ Rapide — Créativité', 'Imagination, expression libre',
  $$Créer une histoire haute en couleurs stimulant l'imagination débordante d'un enfant d'environ 6 ans.
DÉMARCHE : Inventer une solution loufoque avec des objets du quotidien transformés par la magie de l'esprit.
SORTIE : Élan créatif, enthousiasme et envie de dessiner, construire ou bricoler.
CONSIGNES : Vocabulaire créatif et vivant. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_autonomy', '⚡ Rapide — Autonomie', 'Faire tout seul, grandir avec assurance',
  $$Créer une histoire valorisante sur l'autonomie et le plaisir de faire les choses par soi-même pour un enfant d'environ 6 ans.
DÉMARCHE : Prendre une initiative réussie sans l'aide permanente des grands.
SORTIE : Sentiment d'être grand, fierté d'autonomie et confiance dans ses gestes.
CONSIGNES : Vocabulaire clair et concret. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

-- 7.5 Histoires Rapides V2 (Situations de Vie)
SELECT public.create_or_update_prompt_v2(
  'fast_story_situation_dark', '⚡ Rapide — Le Coucher', 'Pénombre, transition vers la nuit',
  $$Créer une histoire douce pour transformer l'appréhension de la nuit en un voyage féerique et protecteur.
DÉMARCHE : La pénombre devient un royaume amical où les étoiles et les doudous veillent avec tendresse.
SORTIE : Endormissement paisible, sécurité totale et glissement vers de beaux rêves.
CONSIGNES : Vocabulaire doux et apaisant. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_situation_school', '⚡ Rapide — L''École', 'Classe, devoirs, examens, relations',
  $$Créer une histoire enthousiasmante et dédramatisante autour de la vie à l'école pour un enfant d'environ 6 ans.
DÉMARCHE : Transposer un défi scolaire en une mission ludique avec des astuces d'apprentissage malicieuses.
SORTIE : Enthousiasme pour retrouver ses camarades, curiosité et fierté de progresser.
CONSIGNES : Vocabulaire scolaire simple. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_situation_separation', '⚡ Rapide — Séparation', 'Quitter ses parents, nounou, rentrée',
  $$Créer une histoire rassurante et valorisante sur la séparation temporaire pour un enfant d'environ 6 ans.
DÉMARCHE : Créer un fil d'amour invisible ou un secret partagé qui relie l'enfant à ses parents pendant la journée.
SORTIE : Élan de confiance, autonomie joyeuse et plaisir de raconter ses exploits lors des retrouvailles.
CONSIGNES : Vocabulaire tendre et concret. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_situation_grief', '⚡ Rapide — Perte et Deuil', 'Perte d''un proche ou d''un animal',
  $$Créer une histoire empreinte de douceur poétique pour accompagner un enfant d'environ 6 ans dans l'épreuve de la perte.
DÉMARCHE : Transmettre la notion de souvenir précieux qui continue de briller dans le cœur comme une étoile bienveillante.
SORTIE : Apaisement, chaleur dans le cœur et célébration des moments d'amour vécus.
CONSIGNES : Vocabulaire délicat, pudique et réconfortant. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_situation_conflict', '⚡ Rapide — Conflit et Dispute', 'Dispute entre amis, frères et sœurs',
  $$Créer une histoire drôle et constructive sur la résolution de conflit pour un enfant d'environ 6 ans.
DÉMARCHE : Découvrir que l'écoute et l'humour désamorcent les bouderies et permettent de faire des jeux encore plus rigolos ensemble.
SORTIE : Envie de réconciliation, complicité renouvelée et sourire partagé.
CONSIGNES : Vocabulaire simple et direct. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_situation_bedwetting', '⚡ Rapide — Énurésie', 'Accidents de la nuit, confiance du corps',
  $$Créer une histoire déculpabilisante et valorisante sur l'écoute du corps pendant la nuit pour un enfant d'environ 6 ans.
DÉMARCHE : Le corps possède un petit gardien magique qui apprend chaque nuit à réveiller l'enfant au bon moment.
SORTIE : Confiance dans les capacités naturelles de son corps, fierté et sérénité.
CONSIGNES : Vocabulaire bienveillant et positif. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_situation_medical', '⚡ Rapide — Soins Médicaux', 'Visite médecin, piqûre, dentiste',
  $$Créer une histoire héroïque et dédramatisante autour des soins de santé pour un enfant d'environ 6 ans.
DÉMARCHE : Le personnel soignant devient une équipe de mécaniciens d'élite qui donne des super-pouvoirs de guérison.
SORTIE : Fierté d'avoir été brave, sourire et sensation de force retrouvée.
CONSIGNES : Vocabulaire simple et courageux. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);

SELECT public.create_or_update_prompt_v2(
  'fast_story_situation_screens', '⚡ Rapide — Écrans', 'Quitter la tablette, retour au réel',
  $$Créer une aventure trépidante qui montre que le monde réel est mille fois plus passionnant que les écrans.
DÉMARCHE : Une énigme ou un trésor dans la chambre ou le jardin déclenche un jeu réel bien plus excitant qu'un jeu vidéo.
SORTIE : Élan d'action, créativité en éveil et plaisir de courir et d'inventer dans la vraie vie.
CONSIGNES : Vocabulaire dynamique et stimulant. MAXIMUM 3 ONOMATOPÉES. Longueur : environ {{target_word_count}} mots.$$
);
