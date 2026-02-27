-- ============================================================
-- The Field of Greens — Initial Schema
-- Run this in your Supabase SQL editor (or via supabase db push)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ──────────────────────────────────────────────────────────────
-- Extends auth.users. Created automatically via trigger on signup.

CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    email       TEXT,
    is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "profiles_admin_all"
    ON public.profiles FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
    );

-- Auto-create profile when a user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            split_part(NEW.email, '@', 1),
            'Player'
        )
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─── TOURNAMENTS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tournaments (
    id                  SERIAL PRIMARY KEY,
    name                TEXT NOT NULL,
    course              TEXT NOT NULL DEFAULT '',
    location            TEXT NOT NULL DEFAULT '',
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    purse               NUMERIC(15,2),          -- null = TBD (Majors)
    purse_rank          INTEGER,                -- 1 = largest purse; null = TBD
    is_active           BOOLEAN NOT NULL DEFAULT FALSE,
    is_completed        BOOLEAN NOT NULL DEFAULT FALSE,
    is_included_in_ond  BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE for FedEx Finale
    max_picks_per_user  INTEGER NOT NULL DEFAULT 1,     -- 2 for Zurich Classic team event
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments_select_all"
    ON public.tournaments FOR SELECT USING (true);

CREATE POLICY "tournaments_admin_all"
    ON public.tournaments FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );


-- ─── GOLFERS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.golfers (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    world_rank   INTEGER,
    primary_tour TEXT NOT NULL DEFAULT 'PGA Tour',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.golfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "golfers_select_all"
    ON public.golfers FOR SELECT USING (true);

CREATE POLICY "golfers_admin_all"
    ON public.golfers FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );


-- ─── TOURNAMENT FIELDS ─────────────────────────────────────────────────────
-- Each row = one golfer in one tournament's field.
-- tee_time_r1: the golfer's Round 1 tee time (enforces pick deadline).
-- earnings / finish_position: filled in by admin after the tournament ends.

CREATE TABLE IF NOT EXISTS public.tournament_fields (
    id              SERIAL PRIMARY KEY,
    tournament_id   INTEGER NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    golfer_id       INTEGER NOT NULL REFERENCES public.golfers(id) ON DELETE CASCADE,
    tee_time_r1     TIMESTAMPTZ,
    earnings        NUMERIC(15,2),      -- null until results posted
    finish_position TEXT,               -- e.g. "T3", "CUT", "WD"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournament_id, golfer_id)
);

ALTER TABLE public.tournament_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fields_select_all"
    ON public.tournament_fields FOR SELECT USING (true);

CREATE POLICY "fields_admin_all"
    ON public.tournament_fields FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );


-- ─── PICKS ─────────────────────────────────────────────────────────────────
-- Each row = one contestant's pick for one tournament.
-- pick_number: 1 for normal events; 1 or 2 for team events (Zurich Classic).
-- is_locked: set to true once the golfer's R1 tee time has passed.
-- earnings: copied from tournament_fields.earnings when admin posts results.

CREATE TABLE IF NOT EXISTS public.picks (
    id            SERIAL PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tournament_id INTEGER NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    golfer_id     INTEGER NOT NULL REFERENCES public.golfers(id) ON DELETE CASCADE,
    pick_number   INTEGER NOT NULL DEFAULT 1,   -- 1 or 2 (Zurich team event)
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    earnings      NUMERIC(15,2) NOT NULL DEFAULT 0,
    is_locked     BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (user_id, tournament_id, pick_number)
);

ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

-- Anyone can read picks (leaderboard / results page is public)
CREATE POLICY "picks_select_all"
    ON public.picks FOR SELECT USING (true);

-- Users can only insert their own picks
CREATE POLICY "picks_insert_own"
    ON public.picks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own picks ONLY if not locked
CREATE POLICY "picks_update_own_unlocked"
    ON public.picks FOR UPDATE
    USING (auth.uid() = user_id AND is_locked = false);

-- Admins bypass all restrictions
CREATE POLICY "picks_admin_all"
    ON public.picks FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );


-- ─── HELPER VIEWS ──────────────────────────────────────────────────────────

-- Leaderboard view: aggregate earnings per contestant
CREATE OR REPLACE VIEW public.v_leaderboard AS
SELECT
    p.id AS user_id,
    p.display_name,
    COALESCE(SUM(pk.earnings), 0) AS total_earnings,
    RANK() OVER (ORDER BY COALESCE(SUM(pk.earnings), 0) DESC) AS rank
FROM public.profiles p
LEFT JOIN public.picks pk ON pk.user_id = p.id
GROUP BY p.id, p.display_name
ORDER BY total_earnings DESC;


-- Burned golfers view: which golfers each user has already used
CREATE OR REPLACE VIEW public.v_burned_golfers AS
SELECT
    pk.user_id,
    pk.golfer_id,
    g.name AS golfer_name
FROM public.picks pk
JOIN public.golfers g ON g.id = pk.golfer_id;


-- ─── INDEXES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_picks_user_id    ON public.picks (user_id);
CREATE INDEX IF NOT EXISTS idx_picks_tournament  ON public.picks (tournament_id);
CREATE INDEX IF NOT EXISTS idx_fields_tournament ON public.tournament_fields (tournament_id);
CREATE INDEX IF NOT EXISTS idx_fields_golfer     ON public.tournament_fields (golfer_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON public.tournaments (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_active ON public.tournaments (is_active, is_completed);
