-- ============================================================
-- Fix: Infinite recursion in RLS admin policies
-- ============================================================
-- Root cause: every table's "admin_all" policy runs
--   EXISTS (SELECT 1 FROM public.profiles WHERE is_admin = true)
-- When the app queries ANY table, Postgres evaluates that policy,
-- which queries profiles, which re-evaluates the same policy → loop.
--
-- Fix: wrap the admin check in a SECURITY DEFINER function.
-- SECURITY DEFINER bypasses RLS when the function executes,
-- breaking the recursion while keeping all security intact.
-- ============================================================

-- Step 1: Create a stable, security-definer helper function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Step 2: Replace all recursive admin policies with the function

-- ── profiles ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
    ON public.profiles FOR ALL
    USING (public.is_current_user_admin());

-- ── tournaments ───────────────────────────────────────────────
DROP POLICY IF EXISTS "tournaments_admin_all" ON public.tournaments;
CREATE POLICY "tournaments_admin_all"
    ON public.tournaments FOR ALL
    USING (public.is_current_user_admin());

-- ── golfers ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "golfers_admin_all" ON public.golfers;
CREATE POLICY "golfers_admin_all"
    ON public.golfers FOR ALL
    USING (public.is_current_user_admin());

-- ── tournament_fields ─────────────────────────────────────────
DROP POLICY IF EXISTS "fields_admin_all" ON public.tournament_fields;
CREATE POLICY "fields_admin_all"
    ON public.tournament_fields FOR ALL
    USING (public.is_current_user_admin());

-- ── picks ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "picks_admin_all" ON public.picks;
CREATE POLICY "picks_admin_all"
    ON public.picks FOR ALL
    USING (public.is_current_user_admin());

-- ── Verification ──────────────────────────────────────────────
-- Run this after the above to confirm the fix worked:
SELECT
  (SELECT COUNT(*) FROM public.profiles)    AS profiles,
  (SELECT COUNT(*) FROM public.tournaments) AS tournaments,
  (SELECT COUNT(*) FROM public.golfers)     AS golfers,
  (SELECT COUNT(*) FROM public.picks)       AS picks;
