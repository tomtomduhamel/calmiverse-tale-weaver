
-- Seed data for age_cognition
INSERT INTO public.age_cognition (range, characteristics, preferred_supports) VALUES
('0-2 ans', 'Sensibilité sensorielle et rythmique. Réceptivité aux sons ronronnants, bercements verbaux, répétitions douces. Pensée pré-symbolique.', ARRAY['sons doux', 'bercements', 'répétitions', 'onomatopées']),
('2-4 ans', 'Pensée animiste, début de symbolisation. L''enfant prête vie aux objets. Importance du doudou et des figures rassurantes.', ARRAY['doudous', 'animaux parlants', 'objets magiques', 'comptines']),
('4-6 ans', 'Imagination débordante, identification aux héros. Capacité à se projeter dans des aventures. Lieux refuges et pouvoirs magiques.', ARRAY['héros', 'lieux refuges', 'pouvoirs magiques', 'aventures']),
('8-12 ans', 'Métaphorisation complexe, intérêt pour le contrôle. Réceptivité aux métaphores de boutons, curseurs, tableaux de bord intérieurs. Début d''auto-hypnose.', ARRAY['boutons/curseurs', 'tableaux de bord', 'métaphores complexes', 'auto-hypnose']),
('13+ ans', 'Besoin d''autonomie, approche permissive et indirecte. Sensibilité à la suggestion subtile. Rejet de l''infantilisation.', ARRAY['approche indirecte', 'métaphores adultes', 'suggestions permissives', 'autonomie']);

-- Seed data for narrative_schemas
INSERT INTO public.narrative_schemas (type, description, mechanism) VALUES
('Linéaire', 'Déroulement fluide et progressif', 'Début-Milieu-Fin. L''histoire avance naturellement vers une résolution apaisante. Chaque étape approfondit la détente.'),
('Répétitif', 'Une situation ou un dialogue revient avec des variations', 'Un élément narratif (phrase, rencontre, rituel) se répète à intervalles réguliers avec de légères variations, créant anticipation et sécurité.'),
('En Boucle', 'L''histoire se termine comme elle a commencé, mais avec une force nouvelle', 'Le personnage revient à son point de départ, mais transformé intérieurement. La boucle crée un sentiment de complétude et de sécurité.'),
('Tiroir', 'Des histoires imbriquées les unes dans les autres', 'Une histoire principale contient de petites histoires secondaires. Chaque niveau approfondit la transe.');

-- Seed data for vakog_focus
INSERT INTO public.vakog_focus (sensory_type, sensory_keywords) VALUES
('Visuel', ARRAY['couleurs', 'lumières', 'formes', 'reflets', 'ombres douces', 'arc-en-ciel', 'étoiles', 'brume dorée']),
('Auditif', ARRAY['murmures', 'mélodie', 'ronronnement', 'bruissement', 'chuchotements', 'silence apaisant', 'tintement', 'berceuse']),
('Kinesthésique', ARRAY['chaleur', 'douceur', 'légèreté', 'flottement', 'enveloppement', 'caresse du vent', 'pesanteur agréable', 'picotements']),
('Olfactif', ARRAY['parfum de lavande', 'odeur de forêt', 'senteur de gâteau', 'brise marine', 'herbe fraîche', 'vanille', 'terre après la pluie']),
('Gustatif', ARRAY['miel doré', 'eau fraîche', 'fruit sucré', 'chocolat fondant', 'tisane tiède', 'saveur de bonbon magique']);

-- Seed data for symbolic_universes
INSERT INTO public.symbolic_universes (name, description, visual_style, objective_affinity) VALUES
('Volcan et Dragons', 'Transformer la colère en énergie créatrice. Le volcan gronde mais peut être apprivoisé, les dragons crachent du feu mais deviennent des alliés.', 'Teintes chaudes, rouges et orangés, avec des éclats dorés', ARRAY['focus', 'fun']),
('Bulle de protection', 'Créer un espace de sécurité intérieure. Une bulle transparente ou une cape d''invisibilité qui protège des peurs.', 'Teintes irisées, transparences, reflets nacrés', ARRAY['sleep', 'relax']),
('Animaux ressources', 'S''appuyer sur la force et la sagesse animale. L''ours solide pour la confiance, le lémurien agile, le dauphin joueur.', 'Palette naturelle, verts et bruns, touches de bleu', ARRAY['sleep', 'relax', 'focus', 'fun']),
('Espace et étoiles', 'Explorer l''immensité cosmique. Flotter parmi les étoiles, découvrir des planètes apaisantes.', 'Bleu profond, violet, étoiles argentées et dorées', ARRAY['sleep', 'relax']),
('Nature enchantée', 'Se ressourcer dans une forêt magique, un jardin secret ou au bord d''une rivière cristalline.', 'Verts luxuriants, eaux turquoise, lumière filtrée', ARRAY['sleep', 'relax', 'focus']),
('Micro-monde', 'Rétrécir pour explorer le monde des insectes, des gouttes de rosée ou des grains de sable.', 'Couleurs vives et saturées, textures détaillées, macro', ARRAY['focus', 'fun']);

-- Seed data for ericksonian_techniques
INSERT INTO public.ericksonian_techniques (name, linguistic_pattern, objective_affinity) VALUES
('Double lien', 'Propose deux choix qui mènent au même résultat. Ex: "Veux-tu ranger tes soucis dans le coffre bleu ou le coffre vert ?"', ARRAY['sleep', 'relax', 'focus', 'fun']),
('Présupposition', 'Formule des phrases qui présupposent le changement déjà en cours. Ex: "Quand tu auras trouvé ta force intérieure, tu pourras sourire"', ARRAY['sleep', 'relax', 'focus']),
('Confusion', 'Utilise des formulations paradoxales pour court-circuiter la résistance. Ex: "Tu peux savoir sans savoir que tu sais déjà comment faire"', ARRAY['sleep', 'relax']),
('Saupoudrage', 'Accentue subtilement certains mots-clés thérapeutiques dans le récit (calme, détente, confiance, force, douceur) tissés naturellement dans l''histoire.', ARRAY['sleep', 'relax', 'focus', 'fun']);
