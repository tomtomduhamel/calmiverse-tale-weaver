-- =============================================
-- PHASE 1: Tables pour le partage d'histoires entre utilisateurs Calmi
-- =============================================

-- Table story_shares : Gère les demandes de partage d'histoires
CREATE TABLE public.story_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  character_mapping JSONB DEFAULT '{}'::jsonb, -- {"original_child_id": "new_child_id", ...}
  copied_story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  message TEXT, -- Message optionnel de l'émetteur
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table user_notifications : Notifications in-app
CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'story_share_request',
    'story_share_accepted', 
    'story_share_rejected',
    'story_share_expired',
    'system'
  )),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb, -- {share_id, story_id, sender_name, story_title, ...}
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_story_shares_sender ON public.story_shares(sender_id);
CREATE INDEX idx_story_shares_recipient ON public.story_shares(recipient_id);
CREATE INDEX idx_story_shares_status ON public.story_shares(status);
CREATE INDEX idx_story_shares_story ON public.story_shares(story_id);
CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_user_notifications_type ON public.user_notifications(type);

-- Trigger pour updated_at sur story_shares
CREATE TRIGGER update_story_shares_updated_at
  BEFORE UPDATE ON public.story_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- RLS Policies pour story_shares
-- =============================================
ALTER TABLE public.story_shares ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les partages où ils sont émetteur OU destinataire
CREATE POLICY "Users can view their own shares"
  ON public.story_shares FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Les utilisateurs peuvent créer des partages pour leurs propres histoires
CREATE POLICY "Users can create shares for their stories"
  ON public.story_shares FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 FROM public.stories 
      WHERE id = story_id AND authorid = auth.uid()
    )
  );

-- Les utilisateurs peuvent mettre à jour les partages où ils sont destinataires (accepter/refuser)
CREATE POLICY "Recipients can update share status"
  ON public.story_shares FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Les émetteurs peuvent annuler leurs partages en attente
CREATE POLICY "Senders can delete pending shares"
  ON public.story_shares FOR DELETE
  USING (auth.uid() = sender_id AND status = 'pending');

-- Admins ont accès complet
CREATE POLICY "Admins can manage all shares"
  ON public.story_shares FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- RLS Policies pour user_notifications
-- =============================================
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne voient que leurs propres notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Le système peut créer des notifications (via functions)
CREATE POLICY "System can insert notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (true);

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.user_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Fonctions PostgreSQL pour le partage
-- =============================================

-- Fonction: Partager une histoire avec un utilisateur
CREATE OR REPLACE FUNCTION public.share_story_with_user(
  p_story_id UUID,
  p_recipient_email TEXT,
  p_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_recipient_id UUID;
  v_recipient_name TEXT;
  v_sender_name TEXT;
  v_story_title TEXT;
  v_story_children_names TEXT[];
  v_share_id UUID;
  v_is_calmi_user BOOLEAN := false;
BEGIN
  -- Récupérer l'ID de l'émetteur
  v_sender_id := auth.uid();
  
  IF v_sender_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Vous devez être connecté');
  END IF;
  
  -- Vérifier que l'histoire appartient à l'émetteur
  SELECT title, childrennames INTO v_story_title, v_story_children_names
  FROM public.stories
  WHERE id = p_story_id AND authorid = v_sender_id;
  
  IF v_story_title IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Histoire non trouvée ou accès refusé');
  END IF;
  
  -- Récupérer le nom de l'émetteur
  SELECT COALESCE(firstname, email) INTO v_sender_name
  FROM public.users
  WHERE id = v_sender_id;
  
  -- Vérifier si le destinataire est un utilisateur Calmi
  SELECT id, COALESCE(firstname, email) INTO v_recipient_id, v_recipient_name
  FROM public.users
  WHERE LOWER(email) = LOWER(p_recipient_email);
  
  IF v_recipient_id IS NOT NULL THEN
    v_is_calmi_user := true;
    
    -- Vérifier qu'on ne partage pas avec soi-même
    IF v_recipient_id = v_sender_id THEN
      RETURN json_build_object('success', false, 'error', 'Vous ne pouvez pas partager une histoire avec vous-même');
    END IF;
    
    -- Vérifier qu'un partage en attente n'existe pas déjà
    IF EXISTS (
      SELECT 1 FROM public.story_shares
      WHERE story_id = p_story_id 
        AND recipient_id = v_recipient_id 
        AND status = 'pending'
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Un partage est déjà en attente pour cet utilisateur');
    END IF;
    
    -- Créer le partage
    INSERT INTO public.story_shares (
      story_id, sender_id, recipient_id, recipient_email, message
    ) VALUES (
      p_story_id, v_sender_id, v_recipient_id, p_recipient_email, p_message
    )
    RETURNING id INTO v_share_id;
    
    -- Créer la notification pour le destinataire
    INSERT INTO public.user_notifications (
      user_id, type, title, message, data
    ) VALUES (
      v_recipient_id,
      'story_share_request',
      v_sender_name || ' vous partage une histoire',
      COALESCE(p_message, 'Vous avez reçu une histoire à découvrir !'),
      jsonb_build_object(
        'share_id', v_share_id,
        'story_id', p_story_id,
        'story_title', v_story_title,
        'story_children_names', v_story_children_names,
        'sender_id', v_sender_id,
        'sender_name', v_sender_name
      )
    );
    
    RETURN json_build_object(
      'success', true,
      'is_calmi_user', true,
      'share_id', v_share_id,
      'recipient_name', v_recipient_name
    );
  ELSE
    -- L'utilisateur n'est pas dans Calmi, retourner pour déclencher l'email
    RETURN json_build_object(
      'success', true,
      'is_calmi_user', false,
      'recipient_email', p_recipient_email
    );
  END IF;
END;
$$;

-- Fonction: Accepter un partage d'histoire
CREATE OR REPLACE FUNCTION public.accept_story_share(
  p_share_id UUID,
  p_character_mapping JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_share RECORD;
  v_original_story RECORD;
  v_new_story_id UUID;
  v_new_content TEXT;
  v_new_title TEXT;
  v_new_children_names TEXT[];
  v_new_children_ids TEXT[];
  v_sender_name TEXT;
  v_recipient_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Vous devez être connecté');
  END IF;
  
  -- Récupérer le partage
  SELECT * INTO v_share
  FROM public.story_shares
  WHERE id = p_share_id AND recipient_id = v_user_id AND status = 'pending';
  
  IF v_share IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Partage non trouvé ou déjà traité');
  END IF;
  
  -- Récupérer l'histoire originale
  SELECT * INTO v_original_story
  FROM public.stories
  WHERE id = v_share.story_id;
  
  IF v_original_story IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Histoire originale non trouvée');
  END IF;
  
  -- Préparer le contenu avec le mapping des personnages
  v_new_content := v_original_story.content;
  v_new_title := v_original_story.title;
  v_new_children_names := v_original_story.childrennames;
  v_new_children_ids := ARRAY[]::TEXT[];
  
  -- Appliquer le mapping des personnages si fourni
  IF p_character_mapping IS NOT NULL AND p_character_mapping != '{}'::jsonb THEN
    -- Pour chaque mapping, remplacer les noms dans le contenu
    FOR i IN 0..jsonb_array_length(
      COALESCE(
        (SELECT jsonb_agg(value) FROM jsonb_each(p_character_mapping)),
        '[]'::jsonb
      )
    ) - 1 LOOP
      DECLARE
        v_original_name TEXT;
        v_new_child_id TEXT;
        v_new_child RECORD;
      BEGIN
        -- Parcourir chaque clé-valeur du mapping
        FOR v_original_name, v_new_child_id IN 
          SELECT key, value::text FROM jsonb_each_text(p_character_mapping)
        LOOP
          IF v_new_child_id IS NOT NULL AND v_new_child_id != '' AND v_new_child_id != 'null' THEN
            -- Récupérer le nom du nouvel enfant
            SELECT name, id::text INTO v_new_child
            FROM public.children
            WHERE id::text = v_new_child_id AND authorid = v_user_id;
            
            IF v_new_child.name IS NOT NULL THEN
              -- Remplacer dans le contenu
              v_new_content := REPLACE(v_new_content, v_original_name, v_new_child.name);
              v_new_title := REPLACE(v_new_title, v_original_name, v_new_child.name);
              
              -- Mettre à jour les tableaux
              v_new_children_names := array_replace(v_new_children_names, v_original_name, v_new_child.name);
              v_new_children_ids := array_append(v_new_children_ids, v_new_child.id);
            END IF;
          END IF;
        END LOOP;
      END;
    END LOOP;
  END IF;
  
  -- Créer la copie de l'histoire pour le destinataire
  INSERT INTO public.stories (
    title,
    content,
    summary,
    preview,
    status,
    authorid,
    childrenids,
    childrennames,
    objective,
    image_path,
    story_analysis
  ) VALUES (
    v_new_title,
    v_new_content,
    v_original_story.summary,
    v_original_story.preview,
    'completed',
    v_user_id,
    v_new_children_ids,
    v_new_children_names,
    v_original_story.objective,
    v_original_story.image_path,
    v_original_story.story_analysis
  )
  RETURNING id INTO v_new_story_id;
  
  -- Mettre à jour le statut du partage
  UPDATE public.story_shares
  SET status = 'accepted',
      responded_at = now(),
      copied_story_id = v_new_story_id,
      character_mapping = p_character_mapping
  WHERE id = p_share_id;
  
  -- Récupérer les noms pour la notification
  SELECT COALESCE(firstname, email) INTO v_sender_name
  FROM public.users WHERE id = v_share.sender_id;
  
  SELECT COALESCE(firstname, email) INTO v_recipient_name
  FROM public.users WHERE id = v_user_id;
  
  -- Notifier l'émetteur
  INSERT INTO public.user_notifications (
    user_id, type, title, message, data
  ) VALUES (
    v_share.sender_id,
    'story_share_accepted',
    v_recipient_name || ' a accepté votre histoire',
    'L''histoire "' || v_original_story.title || '" a été ajoutée à sa bibliothèque.',
    jsonb_build_object(
      'share_id', p_share_id,
      'story_id', v_share.story_id,
      'story_title', v_original_story.title,
      'recipient_id', v_user_id,
      'recipient_name', v_recipient_name
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'copied_story_id', v_new_story_id,
    'story_title', v_new_title
  );
END;
$$;

-- Fonction: Refuser un partage d'histoire
CREATE OR REPLACE FUNCTION public.reject_story_share(p_share_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_share RECORD;
  v_story_title TEXT;
  v_recipient_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Vous devez être connecté');
  END IF;
  
  -- Récupérer le partage
  SELECT ss.*, s.title as story_title INTO v_share
  FROM public.story_shares ss
  JOIN public.stories s ON s.id = ss.story_id
  WHERE ss.id = p_share_id AND ss.recipient_id = v_user_id AND ss.status = 'pending';
  
  IF v_share IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Partage non trouvé ou déjà traité');
  END IF;
  
  -- Mettre à jour le statut
  UPDATE public.story_shares
  SET status = 'rejected',
      responded_at = now()
  WHERE id = p_share_id;
  
  -- Récupérer le nom du destinataire
  SELECT COALESCE(firstname, email) INTO v_recipient_name
  FROM public.users WHERE id = v_user_id;
  
  -- Notifier l'émetteur
  INSERT INTO public.user_notifications (
    user_id, type, title, message, data
  ) VALUES (
    v_share.sender_id,
    'story_share_rejected',
    v_recipient_name || ' a décliné votre histoire',
    'L''histoire "' || v_share.story_title || '" n''a pas été acceptée.',
    jsonb_build_object(
      'share_id', p_share_id,
      'story_id', v_share.story_id,
      'story_title', v_share.story_title,
      'recipient_id', v_user_id,
      'recipient_name', v_recipient_name
    )
  );
  
  RETURN json_build_object('success', true);
END;
$$;

-- Fonction: Récupérer les partages en attente pour l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_pending_story_shares()
RETURNS TABLE (
  share_id UUID,
  story_id UUID,
  story_title TEXT,
  story_preview TEXT,
  story_children_names TEXT[],
  sender_id UUID,
  sender_name TEXT,
  sender_email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id as share_id,
    ss.story_id,
    s.title as story_title,
    s.preview as story_preview,
    s.childrennames as story_children_names,
    ss.sender_id,
    COALESCE(u.firstname, u.email) as sender_name,
    u.email as sender_email,
    ss.message,
    ss.created_at,
    ss.expires_at
  FROM public.story_shares ss
  JOIN public.stories s ON s.id = ss.story_id
  JOIN public.users u ON u.id = ss.sender_id
  WHERE ss.recipient_id = auth.uid()
    AND ss.status = 'pending'
    AND (ss.expires_at IS NULL OR ss.expires_at > now())
  ORDER BY ss.created_at DESC;
END;
$$;

-- Fonction: Compter les notifications non lues
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_notifications
  WHERE user_id = auth.uid() AND is_read = false;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.share_story_with_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_story_share TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_story_share TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_story_shares TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notifications_count TO authenticated;

-- Activer Realtime pour les notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;