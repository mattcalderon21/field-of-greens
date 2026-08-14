-- Enforce the burned-golfer rule at the database level.
-- Raises an exception if a user attempts to pick a golfer they've already
-- used in any other tournament of the same season.
CREATE OR REPLACE FUNCTION public.check_golfer_not_burned()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_season_id INTEGER;
  v_count     INTEGER;
BEGIN
  SELECT season_id INTO v_season_id FROM public.tournaments WHERE id = NEW.tournament_id;

  SELECT COUNT(*) INTO v_count
  FROM public.picks p
  JOIN public.tournaments t ON t.id = p.tournament_id
  WHERE p.user_id   = NEW.user_id
    AND p.golfer_id = NEW.golfer_id
    AND t.season_id = v_season_id
    AND p.id       != COALESCE(NEW.id, -1);

  IF v_count > 0 THEN
    RAISE EXCEPTION 'golfer_already_picked_this_season';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_burned_golfer
BEFORE INSERT OR UPDATE ON public.picks
FOR EACH ROW EXECUTE FUNCTION public.check_golfer_not_burned();
