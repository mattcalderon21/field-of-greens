-- 1-A: Create seasons table
CREATE TABLE public.seasons (
  id                SERIAL PRIMARY KEY,
  year              INTEGER NOT NULL,
  name              TEXT NOT NULL,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  total_tournaments INTEGER NOT NULL DEFAULT 36,
  is_current        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seasons_year_unique UNIQUE (year)
);
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons_select_all" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "seasons_admin_all"  ON public.seasons FOR ALL USING (public.is_current_user_admin());
-- Enforce only one current season at DB level
CREATE UNIQUE INDEX idx_seasons_one_current ON public.seasons (is_current) WHERE is_current = TRUE;
CREATE INDEX idx_seasons_year ON public.seasons (year);

-- 1-B: Insert 2026 season
INSERT INTO public.seasons (year, name, start_date, end_date, total_tournaments, is_current)
VALUES (2026, '2026 One-and-Done Season', '2026-01-15', '2026-08-20', 36, TRUE);

-- 1-C: Add nullable season_id to tournaments (nullable first for safe backfill)
ALTER TABLE public.tournaments ADD COLUMN season_id INTEGER REFERENCES public.seasons(id);

-- 1-D: Backfill all existing tournaments to the 2026 season (run in transaction)
BEGIN;
UPDATE public.tournaments
  SET season_id = (SELECT id FROM public.seasons WHERE year = 2026)
  WHERE season_id IS NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.tournaments WHERE season_id IS NULL) THEN
    RAISE EXCEPTION 'Backfill incomplete — some tournaments still have NULL season_id';
  END IF;
END $$;
COMMIT;

-- 1-E: Apply NOT NULL constraint and index
ALTER TABLE public.tournaments ALTER COLUMN season_id SET NOT NULL;
CREATE INDEX idx_tournaments_season ON public.tournaments (season_id);

-- 1-F: RPC to atomically swap the current season
CREATE OR REPLACE FUNCTION public.set_current_season(p_season_id INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.seasons SET is_current = FALSE WHERE is_current = TRUE;
  UPDATE public.seasons SET is_current = TRUE  WHERE id = p_season_id;
END;
$$;

-- 1-G: Update v_leaderboard to scope to current season
CREATE OR REPLACE VIEW public.v_leaderboard AS
SELECT
  p.user_id,
  pr.display_name,
  SUM(p.earnings) AS total_earnings
FROM public.picks p
JOIN public.profiles pr ON pr.id = p.user_id
JOIN public.tournaments t ON t.id = p.tournament_id
JOIN public.seasons s ON s.id = t.season_id AND s.is_current = TRUE
GROUP BY p.user_id, pr.display_name
ORDER BY total_earnings DESC;

-- 1-G: Update v_burned_golfers to scope to current season
CREATE OR REPLACE VIEW public.v_burned_golfers AS
SELECT DISTINCT
  p.user_id,
  p.golfer_id
FROM public.picks p
JOIN public.tournaments t ON t.id = p.tournament_id
JOIN public.seasons s ON s.id = t.season_id AND s.is_current = TRUE;
