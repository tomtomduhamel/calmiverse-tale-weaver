-- Migration: Auto-assign family_id on INSERT for stories and children
-- Fixes: new stories/children created after the families architecture migration
-- had NULL family_id, breaking family sharing and making RLS fragile.

-- ============================================================
-- 1. Trigger function: auto-set family_id from the author's family
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_set_family_id()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id UUID;
BEGIN
  -- Only act when family_id is not already set
  IF NEW.family_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Look up the author's primary family (owner first, then any role)
  SELECT fm.family_id INTO v_family_id
  FROM public.family_members fm
  WHERE fm.user_id = NEW.authorid
  ORDER BY
    CASE fm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_family_id IS NOT NULL THEN
    NEW.family_id := v_family_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- ============================================================
-- 2. Trigger on stories table
-- ============================================================
DROP TRIGGER IF EXISTS trg_stories_auto_family_id ON public.stories;
CREATE TRIGGER trg_stories_auto_family_id
  BEFORE INSERT ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_family_id();

-- ============================================================
-- 3. Trigger on children table
-- ============================================================
DROP TRIGGER IF EXISTS trg_children_auto_family_id ON public.children;
CREATE TRIGGER trg_children_auto_family_id
  BEFORE INSERT ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_family_id();

-- ============================================================
-- 4. Backfill: assign family_id to existing rows that are missing it
-- ============================================================
UPDATE public.stories s
SET family_id = (
  SELECT fm.family_id
  FROM public.family_members fm
  WHERE fm.user_id = s.authorid
  ORDER BY CASE fm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
  LIMIT 1
)
WHERE s.family_id IS NULL
  AND s.authorid IS NOT NULL;

UPDATE public.children c
SET family_id = (
  SELECT fm.family_id
  FROM public.family_members fm
  WHERE fm.user_id = c.authorid
  ORDER BY CASE fm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
  LIMIT 1
)
WHERE c.family_id IS NULL
  AND c.authorid IS NOT NULL;
