-- ============================================================
-- The Field of Greens — Season Update: Weeks 7–17
-- ============================================================
-- Covers: Cognizant Classic through ONEflight Myrtle Beach
-- (PGA Championship, week 18, handled in a separate script)
--
-- Run this in the Supabase SQL Editor.
-- Safe to re-run — all inserts use ON CONFLICT upserts.
-- ============================================================


-- ─── PART 1: NEW GOLFERS ───────────────────────────────────────────────────
-- 22 golfers who appear in weeks 7–17 picks but weren't in the original seed.

INSERT INTO public.golfers (name, primary_tour)
SELECT name, primary_tour FROM (VALUES
  ('Rasmus Hojgaard',       'DP World Tour'),
  ('Nicolai Hojgaard',      'DP World Tour'),
  ('Sami Valimaki',         'DP World Tour'),
  ('Alex Smalley',          'PGA Tour'),
  ('Ryo Hisatsune',         'DP World Tour'),
  ('Jacob Bridgeman',       'PGA Tour'),
  ('Haotong Li',            'DP World Tour'),
  ('Jordan Smith',          'DP World Tour'),
  ('David Ford',            'PGA Tour'),
  ('Sudarshan Yellamaraju', 'PGA Tour'),
  ('Michael Brennan',       'PGA Tour'),
  ('Chris Gotterup',        'PGA Tour'),
  ('Matt McCarty',          'PGA Tour'),
  ('Mac Meissner',          'PGA Tour'),
  ('Matt Wallace',          'DP World Tour'),
  ('Karl Vilips',           'PGA Tour'),
  ('Johnny Keefer',         'PGA Tour'),
  ('Adam Hadwin',           'PGA Tour'),
  ('Max Greyserman',        'PGA Tour'),
  ('Davis Thompson',        'PGA Tour'),
  ('Austin Smotherman',     'PGA Tour'),
  ('Andrew Putnam',         'PGA Tour')
) AS v(name, primary_tour)
WHERE NOT EXISTS (
  SELECT 1 FROM public.golfers g WHERE g.name = v.name
);


-- ─── PART 2: PURSE RANK UPDATES ────────────────────────────────────────────
-- Masters ($21M, rank 2) and PGA Championship ($20.5M, rank 3) are now confirmed.
-- This pushes all $20M events from rank 2 → 4, and shifts every other rank up by 2.

-- Masters Tournament: set actual purse + rank
UPDATE public.tournaments SET purse = 21000000, purse_rank = 2
WHERE name = 'Masters Tournament';

-- PGA Championship: set actual purse + rank + correct venue
UPDATE public.tournaments
SET purse = 20500000, purse_rank = 3,
    course   = 'Aronimink Golf Club',
    location = 'Newtown Square, PA'
WHERE name = 'PGA Championship';

-- $20M events: rank 2 → 4
UPDATE public.tournaments SET purse_rank = 4
WHERE purse = 20000000 AND purse_rank = 2;

-- $10.3M — THE CJ CUP Byron Nelson: 12 → 14
UPDATE public.tournaments SET purse_rank = 14 WHERE name = 'THE CJ CUP Byron Nelson';

-- $10M — Rocket Classic: 13 → 15
UPDATE public.tournaments SET purse_rank = 15 WHERE name = 'Rocket Classic';

-- $9.9M — Houston Open & Charles Schwab: 14 → 16
UPDATE public.tournaments SET purse_rank = 16
WHERE purse = 9900000 AND purse_rank = 14;

-- $9.8M — Valero Texas & Canadian Open: 16 → 18
UPDATE public.tournaments SET purse_rank = 18
WHERE purse = 9800000 AND purse_rank = 16;

-- $9.6M — Farmers, WM Phoenix, Cognizant: 18 → 20
UPDATE public.tournaments SET purse_rank = 20
WHERE purse = 9600000 AND purse_rank = 18;

-- $9.5M — Zurich Classic: 21 → 23
UPDATE public.tournaments SET purse_rank = 23 WHERE name = 'Zurich Classic of New Orleans';

-- $9.2M — The American Express: 22 → 24
UPDATE public.tournaments SET purse_rank = 24 WHERE name = 'The American Express';

-- $9.1M — Sony Open & Valspar: 23 → 25
UPDATE public.tournaments SET purse_rank = 25
WHERE purse = 9100000 AND purse_rank = 23;

-- $9M — Genesis Scottish Open: 25 → 27
UPDATE public.tournaments SET purse_rank = 27 WHERE name = 'Genesis Scottish Open';

-- $8.8M — John Deere & 3M Open: 26 → 28
UPDATE public.tournaments SET purse_rank = 28
WHERE purse = 8800000 AND purse_rank = 26;

-- $8.5M — Wyndham Championship: 28 → 30
UPDATE public.tournaments SET purse_rank = 30 WHERE name = 'Wyndham Championship';

-- $4M alternate events — Puerto Rico, ONEflight, ISCO, Corales: 29 → 31
UPDATE public.tournaments SET purse_rank = 31
WHERE purse = 4000000 AND purse_rank = 29;


-- ─── PART 3: TOURNAMENT STATUS UPDATES (WEEKS 7–17) ───────────────────────
-- Mark all completed tournaments, clear the active flag from Cognizant Classic.

-- Week 7: Cognizant Classic (was active, now done)
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name = 'Cognizant Classic';

-- Week 8: Arnold Palmer Invitational + Puerto Rico Open
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name IN ('Arnold Palmer Invitational', 'Puerto Rico Open');

-- Week 9: THE PLAYERS Championship
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name = 'THE PLAYERS Championship';

-- Week 10: Valspar Championship
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name = 'Valspar Championship';

-- Week 11: Texas Children's Houston Open
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name = 'Texas Children''s Houston Open';

-- Week 12: Valero Texas Open
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name = 'Valero Texas Open';

-- Week 13: Masters Tournament
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name = 'Masters Tournament';

-- Week 14: RBC Heritage
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name = 'RBC Heritage';

-- Week 15: Zurich Classic of New Orleans
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name = 'Zurich Classic of New Orleans';

-- Week 16: Cadillac Championship
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name = 'Cadillac Championship';

-- Week 17: Truist Championship + ONEflight Myrtle Beach
UPDATE public.tournaments
SET is_active = false, is_completed = true
WHERE name IN ('Truist Championship', 'ONEflight Myrtle Beach');


-- ─── PART 4: TOURNAMENT FIELDS (WEEKS 7–17) ────────────────────────────────
-- Inserts earnings for every golfer picked in weeks 7–17.
-- Uses ON CONFLICT upsert — safe to re-run.

-- ── Week 7: Cognizant Classic ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-02-26 08:00:00-05'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Ryan Gerard',    77600),
       ('Sami Valimaki',      0),
       ('Alex Smalley',   22992),
       ('Nicolai Hojgaard', 324000),
       ('Keith Mitchell', 324000),
       ('Shane Lowry',    726400),
       ('Brooks Koepka',  252000),
       ('Haotong Li',     54816)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Cognizant Classic'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 8a: Arnold Palmer Invitational ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-03-05 08:00:00-05'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Collin Morikawa',  840000),
       ('Scottie Scheffler', 157000),
       ('Matt Fitzpatrick',   78000),
       ('Rory McIlroy',           0),
       ('Tommy Fleetwood',    56000),
       ('Russell Henley',    702000),
       ('Pierceson Coody',        0),
       ('Viktor Hovland',    373200)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Arnold Palmer Invitational'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 8b: Puerto Rico Open ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-03-05 08:00:00-04'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Rasmus Hojgaard',        0),
       ('David Ford',         63000),
       ('Christiaan Bezuidenhout', 97500),
       ('Sudarshan Yellamaraju',  19450),
       ('Eric Cole',              0),
       ('Michael Brennan',    27636)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Puerto Rico Open'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 9: THE PLAYERS Championship ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-03-12 08:00:00-04'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Ludvig Aberg',    925000),
       ('Russell Henley',  409027),
       ('Collin Morikawa',      0),
       ('Scottie Scheffler', 271250),
       ('Tommy Fleetwood', 731250),
       ('Min Woo Lee',     128250),
       ('Jake Knapp',           0),
       ('Si Woo Kim',       61083)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'THE PLAYERS Championship'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 10: Valspar Championship ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-03-19 08:00:00-04'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Jacob Bridgeman',  161525),
       ('Ryo Hisatsune',     51142),
       ('J.J. Spaun',            0),
       ('Viktor Hovland',        0),
       ('Justin Thomas',     51142),
       ('Brooks Koepka',    108290),
       ('Sahith Theegala',       0),
       ('Wyndham Clark',         0),
       ('Matt Fitzpatrick', 1638000)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Valspar Championship'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 11: Texas Children's Houston Open ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-03-26 08:00:00-05'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Chris Gotterup',   322987),
       ('Jake Knapp',       322987),
       ('Marco Penge',           0),
       ('Sam Burns',         96525),
       ('Shane Lowry',       59625),
       ('Wyndham Clark',         0),
       ('Nicolai Hojgaard', 1079100),
       ('Brooks Koepka',        0),
       ('Min Woo Lee',      584100)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Texas Children''s Houston Open'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 12: Valero Texas Open ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-04-02 08:00:00-05'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Sepp Straka',           0),
       ('Nick Taylor',       71540),
       ('Jordan Spieth',     21364),
       ('Tommy Fleetwood',  237650),
       ('Robert MacIntyre', 741533),
       ('Brian Harman',      35809),
       ('Russell Henley',        0)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Valero Texas Open'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 13: Masters Tournament ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-04-09 08:00:00-04'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Jon Rahm',           101250),
       ('Patrick Reed',       427500),
       ('Ludvig Aberg',       252000),
       ('Cameron Young',     1080000),
       ('Bryson DeChambeau',       0),
       ('Xander Schauffele',  630000),
       ('Scottie Scheffler', 2430000)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Masters Tournament'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 14: RBC Heritage ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-04-16 08:00:00-04'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Matt Fitzpatrick', 3600000),
       ('Sepp Straka',        55300),
       ('Scottie Scheffler', 2160000),
       ('Ludvig Aberg',      823333),
       ('Chris Gotterup',    142750),
       ('Russell Henley',    142750),
       ('Xander Schauffele', 399250),
       ('Jordan Spieth',      92444)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'RBC Heritage'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 15: Zurich Classic of New Orleans (team event) ──
-- pick_number=1 golfer carries the team earnings; pick_number=2 earns $0.
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-04-23 08:00:00-05'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       -- Ben's team (pk1/pk2)
       ('Brooks Koepka',           0),
       ('Shane Lowry',             0),
       -- Matt's team
       ('Austin Smotherman',       0),
       ('Andrew Putnam',           0),
       -- Todd's + Paul's team
       ('Haotong Li',              0),
       ('Jordan Smith',            0),
       -- Luke's team
       ('Matt McCarty',       112496),
       ('Mac Meissner',            0),
       -- Ryan's team
       ('Marco Penge',         20805),
       ('Matt Wallace',            0),
       -- Horse's team
       ('Ryan Gerard',         19475),
       ('Sudarshan Yellamaraju',   0),
       -- Rich's team
       ('Andrew Novak',       112496),
       ('Ben Griffin',             0),
       -- Mitch's team
       ('Michael Thorbjornsen',  69493),
       ('Karl Vilips',             0)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Zurich Classic of New Orleans'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 16: Cadillac Championship ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-04-30 08:00:00-04'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Scottie Scheffler', 2160000),
       ('Sam Burns',           72181),
       ('Chris Gotterup',      72181),
       ('J.J. Spaun',         350000),
       ('Collin Morikawa',     41500),
       ('Cameron Young',     3600000),
       ('Akshay Bhatia',      167142)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Cadillac Championship'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 17a: Truist Championship ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-05-07 08:00:00-04'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Xander Schauffele',  42500),
       ('Justin Thomas',     420000),
       ('Cameron Young',     500000),
       ('Sepp Straka',        41250),
       ('Justin Rose',        60000),
       ('Rory McIlroy',      242100),
       ('Tommy Fleetwood',   730000),
       ('Ludvig Aberg',      600000)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'Truist Championship'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;

-- ── Week 17b: ONEflight Myrtle Beach ──
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings)
SELECT t.id, g.id, '2026-05-07 08:00:00-04'::timestamptz, v.earnings
FROM public.tournaments t,
     public.golfers g,
     (VALUES
       ('Stephan Jaeger',       0),
       ('Emiliano Grillo',      0),
       ('Davis Thompson',   76000),
       ('Kevin Yu',          9480),
       ('Max Greyserman',   22885),
       ('Johnny Keefer',    22885),
       ('Aaron Rai',       164000),
       ('Adam Hadwin',       9480),
       ('Marco Penge',          0)
     ) AS v(golfer_name, earnings)
WHERE t.name = 'ONEflight Myrtle Beach'
  AND g.name = v.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings;


-- ─── PART 5: PICKS (WEEKS 7–17) ────────────────────────────────────────────
-- Inserts all contestant picks for weeks 7–17.
-- Paul has no pick for RBC Heritage (he missed the deadline — no row inserted).
-- Zurich Classic: each contestant has pick_number 1 AND 2 (team event).
-- All rows are locked (is_locked = true) as historical data.

INSERT INTO public.picks
  (user_id, tournament_id, golfer_id, pick_number, earnings, is_locked, submitted_at)
SELECT
  p.id,
  t.id,
  g.id,
  v.pick_number,
  v.earnings,
  true,
  NOW()
FROM (VALUES
  -- ── Week 7: Cognizant Classic ──────────────────────────────────────────
  ('Ben',   'Cognizant Classic',              'Ryan Gerard',          1,  77600),
  ('Matt',  'Cognizant Classic',              'Sami Valimaki',        1,      0),
  ('Todd',  'Cognizant Classic',              'Alex Smalley',         1,  22992),
  ('Luke',  'Cognizant Classic',              'Nicolai Hojgaard',     1, 324000),
  ('Ryan',  'Cognizant Classic',              'Keith Mitchell',       1, 324000),
  ('Horse', 'Cognizant Classic',              'Shane Lowry',          1, 726400),
  ('Rich',  'Cognizant Classic',              'Brooks Koepka',        1, 252000),
  ('Paul',  'Cognizant Classic',              'Haotong Li',           1,  54816),
  ('Mitch', 'Cognizant Classic',              'Brooks Koepka',        1, 252000),

  -- ── Week 8a: Arnold Palmer Invitational ───────────────────────────────
  ('Ben',   'Arnold Palmer Invitational',     'Collin Morikawa',      1, 840000),
  ('Matt',  'Arnold Palmer Invitational',     'Scottie Scheffler',    1, 157000),
  ('Todd',  'Arnold Palmer Invitational',     'Matt Fitzpatrick',     1,  78000),
  ('Luke',  'Arnold Palmer Invitational',     'Rory McIlroy',         1,      0),
  ('Ryan',  'Arnold Palmer Invitational',     'Tommy Fleetwood',      1,  56000),
  ('Horse', 'Arnold Palmer Invitational',     'Matt Fitzpatrick',     1,  78000),
  ('Rich',  'Arnold Palmer Invitational',     'Russell Henley',       1, 702000),
  ('Paul',  'Arnold Palmer Invitational',     'Pierceson Coody',      1,      0),
  ('Mitch', 'Arnold Palmer Invitational',     'Viktor Hovland',       1, 373200),

  -- ── Week 8b: Puerto Rico Open ─────────────────────────────────────────
  ('Ben',   'Puerto Rico Open',               'Rasmus Hojgaard',      1,      0),
  ('Matt',  'Puerto Rico Open',               'David Ford',           1,  63000),
  ('Todd',  'Puerto Rico Open',               'Christiaan Bezuidenhout', 1, 97500),
  ('Luke',  'Puerto Rico Open',               'Sudarshan Yellamaraju',1,  19450),
  ('Ryan',  'Puerto Rico Open',               'Eric Cole',            1,      0),
  ('Horse', 'Puerto Rico Open',               'Michael Brennan',      1,  27636),
  ('Rich',  'Puerto Rico Open',               'Rasmus Hojgaard',      1,      0),
  ('Paul',  'Puerto Rico Open',               'Rasmus Hojgaard',      1,      0),
  ('Mitch', 'Puerto Rico Open',               'Eric Cole',            1,      0),

  -- ── Week 9: THE PLAYERS Championship ─────────────────────────────────
  ('Ben',   'THE PLAYERS Championship',       'Ludvig Aberg',         1, 925000),
  ('Matt',  'THE PLAYERS Championship',       'Russell Henley',       1, 409027),
  ('Todd',  'THE PLAYERS Championship',       'Collin Morikawa',      1,      0),
  ('Luke',  'THE PLAYERS Championship',       'Collin Morikawa',      1,      0),
  ('Ryan',  'THE PLAYERS Championship',       'Scottie Scheffler',    1, 271250),
  ('Horse', 'THE PLAYERS Championship',       'Tommy Fleetwood',      1, 731250),
  ('Rich',  'THE PLAYERS Championship',       'Min Woo Lee',          1, 128250),
  ('Paul',  'THE PLAYERS Championship',       'Jake Knapp',           1,      0),
  ('Mitch', 'THE PLAYERS Championship',       'Si Woo Kim',           1,  61083),

  -- ── Week 10: Valspar Championship ────────────────────────────────────
  ('Ben',   'Valspar Championship',           'Jacob Bridgeman',      1, 161525),
  ('Matt',  'Valspar Championship',           'Ryo Hisatsune',        1,  51142),
  ('Todd',  'Valspar Championship',           'J.J. Spaun',           1,      0),
  ('Luke',  'Valspar Championship',           'Viktor Hovland',       1,      0),
  ('Ryan',  'Valspar Championship',           'Justin Thomas',        1,  51142),
  ('Horse', 'Valspar Championship',           'Brooks Koepka',        1, 108290),
  ('Rich',  'Valspar Championship',           'Sahith Theegala',      1,      0),
  ('Paul',  'Valspar Championship',           'Wyndham Clark',        1,      0),
  ('Mitch', 'Valspar Championship',           'Matt Fitzpatrick',     1,1638000),

  -- ── Week 11: Texas Children's Houston Open ────────────────────────────
  ('Ben',   'Texas Children''s Houston Open', 'Chris Gotterup',       1, 322987),
  ('Matt',  'Texas Children''s Houston Open', 'Jake Knapp',           1, 322987),
  ('Todd',  'Texas Children''s Houston Open', 'Marco Penge',          1,      0),
  ('Luke',  'Texas Children''s Houston Open', 'Sam Burns',            1,  96525),
  ('Ryan',  'Texas Children''s Houston Open', 'Shane Lowry',          1,  59625),
  ('Horse', 'Texas Children''s Houston Open', 'Wyndham Clark',        1,      0),
  ('Rich',  'Texas Children''s Houston Open', 'Nicolai Hojgaard',     1,1079100),
  ('Paul',  'Texas Children''s Houston Open', 'Brooks Koepka',        1,      0),
  ('Mitch', 'Texas Children''s Houston Open', 'Min Woo Lee',          1, 584100),

  -- ── Week 12: Valero Texas Open ───────────────────────────────────────
  ('Ben',   'Valero Texas Open',              'Sepp Straka',          1,      0),
  ('Matt',  'Valero Texas Open',              'Nick Taylor',          1,  71540),
  ('Todd',  'Valero Texas Open',              'Jordan Spieth',        1,  21364),
  ('Luke',  'Valero Texas Open',              'Tommy Fleetwood',      1, 237650),
  ('Ryan',  'Valero Texas Open',              'Robert MacIntyre',     1, 741533),
  ('Horse', 'Valero Texas Open',              'Sepp Straka',          1,      0),
  ('Rich',  'Valero Texas Open',              'Brian Harman',         1,  35809),
  ('Paul',  'Valero Texas Open',              'Brian Harman',         1,  35809),
  ('Mitch', 'Valero Texas Open',              'Russell Henley',       1,      0),

  -- ── Week 13: Masters Tournament ──────────────────────────────────────
  ('Ben',   'Masters Tournament',             'Jon Rahm',             1, 101250),
  ('Matt',  'Masters Tournament',             'Patrick Reed',         1, 427500),
  ('Todd',  'Masters Tournament',             'Ludvig Aberg',         1, 252000),
  ('Luke',  'Masters Tournament',             'Cameron Young',        1,1080000),
  ('Ryan',  'Masters Tournament',             'Bryson DeChambeau',    1,      0),
  ('Horse', 'Masters Tournament',             'Xander Schauffele',    1, 630000),
  ('Rich',  'Masters Tournament',             'Scottie Scheffler',    1,2430000),
  ('Paul',  'Masters Tournament',             'Jon Rahm',             1, 101250),
  ('Mitch', 'Masters Tournament',             'Bryson DeChambeau',    1,      0),

  -- ── Week 14: RBC Heritage (Paul missed — no row for Paul) ────────────
  ('Ben',   'RBC Heritage',                   'Matt Fitzpatrick',     1,3600000),
  ('Matt',  'RBC Heritage',                   'Sepp Straka',          1,  55300),
  ('Todd',  'RBC Heritage',                   'Scottie Scheffler',    1,2160000),
  ('Luke',  'RBC Heritage',                   'Ludvig Aberg',         1, 823333),
  ('Ryan',  'RBC Heritage',                   'Chris Gotterup',       1, 142750),
  ('Horse', 'RBC Heritage',                   'Russell Henley',       1, 142750),
  ('Rich',  'RBC Heritage',                   'Xander Schauffele',    1, 399250),
  ('Mitch', 'RBC Heritage',                   'Jordan Spieth',        1,  92444),

  -- ── Week 15: Zurich Classic (team event — pick_number 1 AND 2) ───────
  -- Ben: Brooks Koepka / Shane Lowry
  ('Ben',   'Zurich Classic of New Orleans',  'Brooks Koepka',        1,      0),
  ('Ben',   'Zurich Classic of New Orleans',  'Shane Lowry',          2,      0),
  -- Matt: Austin Smotherman / Andrew Putnam
  ('Matt',  'Zurich Classic of New Orleans',  'Austin Smotherman',    1,      0),
  ('Matt',  'Zurich Classic of New Orleans',  'Andrew Putnam',        2,      0),
  -- Todd: Haotong Li / Jordan Smith
  ('Todd',  'Zurich Classic of New Orleans',  'Haotong Li',           1,      0),
  ('Todd',  'Zurich Classic of New Orleans',  'Jordan Smith',         2,      0),
  -- Luke: Matt McCarty / Mac Meissner
  ('Luke',  'Zurich Classic of New Orleans',  'Matt McCarty',         1, 112496),
  ('Luke',  'Zurich Classic of New Orleans',  'Mac Meissner',         2,      0),
  -- Ryan: Marco Penge / Matt Wallace
  ('Ryan',  'Zurich Classic of New Orleans',  'Marco Penge',          1,  20805),
  ('Ryan',  'Zurich Classic of New Orleans',  'Matt Wallace',         2,      0),
  -- Horse: Ryan Gerard / Sudarshan Yellamaraju
  ('Horse', 'Zurich Classic of New Orleans',  'Ryan Gerard',          1,  19475),
  ('Horse', 'Zurich Classic of New Orleans',  'Sudarshan Yellamaraju',2,      0),
  -- Rich: Andrew Novak / Ben Griffin
  ('Rich',  'Zurich Classic of New Orleans',  'Andrew Novak',         1, 112496),
  ('Rich',  'Zurich Classic of New Orleans',  'Ben Griffin',          2,      0),
  -- Paul: Haotong Li / Jordan Smith
  ('Paul',  'Zurich Classic of New Orleans',  'Haotong Li',           1,      0),
  ('Paul',  'Zurich Classic of New Orleans',  'Jordan Smith',         2,      0),
  -- Mitch: Michael Thorbjornsen / Karl Vilips
  ('Mitch', 'Zurich Classic of New Orleans',  'Michael Thorbjornsen', 1,  69493),
  ('Mitch', 'Zurich Classic of New Orleans',  'Karl Vilips',          2,      0),

  -- ── Week 16: Cadillac Championship ───────────────────────────────────
  ('Ben',   'Cadillac Championship',          'Scottie Scheffler',    1,2160000),
  ('Matt',  'Cadillac Championship',          'Sam Burns',            1,  72181),
  ('Todd',  'Cadillac Championship',          'Chris Gotterup',       1,  72181),
  ('Luke',  'Cadillac Championship',          'J.J. Spaun',           1, 350000),
  ('Ryan',  'Cadillac Championship',          'Collin Morikawa',      1,  41500),
  ('Horse', 'Cadillac Championship',          'Scottie Scheffler',    1,2160000),
  ('Rich',  'Cadillac Championship',          'Cameron Young',        1,3600000),
  ('Paul',  'Cadillac Championship',          'Cameron Young',        1,3600000),
  ('Mitch', 'Cadillac Championship',          'Akshay Bhatia',        1, 167142),

  -- ── Week 17a: Truist Championship ────────────────────────────────────
  ('Ben',   'Truist Championship',            'Xander Schauffele',    1,  42500),
  ('Matt',  'Truist Championship',            'Justin Thomas',        1, 420000),
  ('Todd',  'Truist Championship',            'Cameron Young',        1, 500000),
  ('Luke',  'Truist Championship',            'Sepp Straka',          1,  41250),
  ('Ryan',  'Truist Championship',            'Justin Rose',          1,  60000),
  ('Horse', 'Truist Championship',            'Rory McIlroy',         1, 242100),
  ('Rich',  'Truist Championship',            'Tommy Fleetwood',      1, 730000),
  ('Paul',  'Truist Championship',            'Ludvig Aberg',         1, 600000),
  ('Mitch', 'Truist Championship',            'Xander Schauffele',    1,  42500),

  -- ── Week 17b: ONEflight Myrtle Beach ─────────────────────────────────
  ('Ben',   'ONEflight Myrtle Beach',         'Stephan Jaeger',       1,      0),
  ('Matt',  'ONEflight Myrtle Beach',         'Emiliano Grillo',      1,      0),
  ('Todd',  'ONEflight Myrtle Beach',         'Davis Thompson',       1,  76000),
  ('Luke',  'ONEflight Myrtle Beach',         'Kevin Yu',             1,   9480),
  ('Ryan',  'ONEflight Myrtle Beach',         'Max Greyserman',       1,  22885),
  ('Horse', 'ONEflight Myrtle Beach',         'Johnny Keefer',        1,  22885),
  ('Rich',  'ONEflight Myrtle Beach',         'Aaron Rai',            1, 164000),
  ('Paul',  'ONEflight Myrtle Beach',         'Adam Hadwin',          1,   9480),
  ('Mitch', 'ONEflight Myrtle Beach',         'Marco Penge',          1,      0)

) AS v(contestant, tournament_name, golfer_name, pick_number, earnings)
JOIN public.profiles  p ON p.display_name    = v.contestant
JOIN public.tournaments t ON t.name          = v.tournament_name
JOIN public.golfers    g ON g.name           = v.golfer_name
ON CONFLICT (user_id, tournament_id, pick_number) DO UPDATE
  SET golfer_id  = EXCLUDED.golfer_id,
      earnings   = EXCLUDED.earnings,
      is_locked  = true;


-- ─── VERIFICATION ──────────────────────────────────────────────────────────
-- Run this to confirm everything loaded correctly.

SELECT
  p.display_name,
  COUNT(pk.id)                        AS total_picks,
  SUM(pk.earnings)                    AS total_earnings,
  SUM(CASE WHEN pk.earnings > 0 THEN pk.earnings ELSE 0 END) AS paid_earnings
FROM public.profiles p
LEFT JOIN public.picks pk ON pk.user_id = p.id
WHERE p.is_admin = false
GROUP BY p.display_name
ORDER BY total_earnings DESC;
