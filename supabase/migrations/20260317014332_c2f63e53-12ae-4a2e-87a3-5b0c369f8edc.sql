
-- ============================================================
-- Table 1: age_cognition
-- ============================================================
CREATE TABLE public.age_cognition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  range text NOT NULL,
  characteristics text NOT NULL,
  preferred_supports text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.age_cognition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read age_cognition"
  ON public.age_cognition FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage age_cognition"
  ON public.age_cognition FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Table 2: narrative_schemas
-- ============================================================
CREATE TABLE public.narrative_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  description text NOT NULL,
  mechanism text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.narrative_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read narrative_schemas"
  ON public.narrative_schemas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage narrative_schemas"
  ON public.narrative_schemas FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Table 3: vakog_focus
-- ============================================================
CREATE TABLE public.vakog_focus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensory_type text NOT NULL,
  sensory_keywords text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vakog_focus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vakog_focus"
  ON public.vakog_focus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage vakog_focus"
  ON public.vakog_focus FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Table 4: symbolic_universes
-- ============================================================
CREATE TABLE public.symbolic_universes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  visual_style text,
  objective_affinity text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.symbolic_universes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read symbolic_universes"
  ON public.symbolic_universes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage symbolic_universes"
  ON public.symbolic_universes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Table 5: ericksonian_techniques
-- ============================================================
CREATE TABLE public.ericksonian_techniques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  linguistic_pattern text NOT NULL,
  objective_affinity text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ericksonian_techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ericksonian_techniques"
  ON public.ericksonian_techniques FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage ericksonian_techniques"
  ON public.ericksonian_techniques FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
