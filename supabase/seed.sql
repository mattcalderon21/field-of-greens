-- ============================================================
-- The Field of Greens — Seed Data
-- Run AFTER 001_initial_schema.sql
-- Populates: tournaments, golfers, tournament_fields
-- Picks and user accounts → see scripts/seed-picks.ts
-- ============================================================

-- ─── TOURNAMENTS ───────────────────────────────────────────────────────────
-- Purse ranks computed from largest to smallest non-TBD purse across the season.
-- TBD purses (Majors) have purse_rank = NULL.
-- Weeks 1–6 are marked is_completed = true.
-- Week 7 (Cognizant Classic, Feb 26) is marked is_active = true.

INSERT INTO public.tournaments
    (name, course, location, start_date, end_date, purse, purse_rank, is_active, is_completed, is_included_in_ond, max_picks_per_user)
VALUES
-- Week 1
('Sony Open in Hawaii',           'Waialae Country Club',                          'Honolulu, HI',              '2026-01-15', '2026-01-18',  9100000, 23, false, true,  true, 1),
-- Week 2
('The American Express',          'Pete Dye Stadium Course',                       'La Quinta, CA',             '2026-01-22', '2026-01-25',  9200000, 22, false, true,  true, 1),
-- Week 3
('Farmers Insurance Open',        'Torrey Pines (South Course)',                   'San Diego, CA',             '2026-01-29', '2026-02-01',  9600000, 18, false, true,  true, 1),
-- Week 4
('WM Phoenix Open',               'TPC Scottsdale (Stadium Course)',                'Scottsdale, AZ',            '2026-02-05', '2026-02-08',  9600000, 18, false, true,  true, 1),
-- Week 5
('AT&T Pebble Beach Pro-Am',      'Pebble Beach Golf Links',                       'Pebble Beach, CA',          '2026-02-12', '2026-02-16', 20000000,  2, false, true,  true, 1),
-- Week 6
('The Genesis Invitational',      'The Riviera Country Club',                      'Pacific Palisades, CA',     '2026-02-19', '2026-02-22', 20000000,  2, false, true,  true, 1),
-- Week 7 — ACTIVE
('Cognizant Classic',             'PGA National (The Champion Course)',             'Palm Beach Gardens, FL',    '2026-02-26', '2026-03-01',  9600000, 18, true,  false, true, 1),
-- Week 8 (same week — two events)
('Arnold Palmer Invitational',    'Bay Hill Club & Lodge',                         'Orlando, FL',               '2026-03-05', '2026-03-08', 20000000,  2, false, false, true, 1),
('Puerto Rico Open',              'Grand Reserve Golf Club',                       'Rio Grande, PUR',           '2026-03-05', '2026-03-08',  4000000, 29, false, false, true, 1),
-- Week 9
('THE PLAYERS Championship',      'TPC Sawgrass (Stadium Course)',                  'Ponte Vedra Beach, FL',     '2026-03-12', '2026-03-15', 25000000,  1, false, false, true, 1),
-- Week 10
('Valspar Championship',          'Innisbrook Resort (Copperhead Course)',          'Palm Harbor, FL',           '2026-03-19', '2026-03-22',  9100000, 23, false, false, true, 1),
-- Week 11
('Texas Children''s Houston Open','Memorial Park Golf Course',                     'Houston, TX',               '2026-03-26', '2026-03-29',  9900000, 14, false, false, true, 1),
-- Week 12
('Valero Texas Open',             'TPC San Antonio (Oaks Course)',                  'San Antonio, TX',           '2026-04-02', '2026-04-05',  9800000, 16, false, false, true, 1),
-- Week 13 — Masters (TBD purse)
('Masters Tournament',            'Augusta National Golf Club',                    'Augusta, GA',               '2026-04-09', '2026-04-12',   NULL,   NULL, false, false, true, 1),
-- Week 14
('RBC Heritage',                  'Harbour Town Golf Links',                       'Hilton Head Island, SC',    '2026-04-16', '2026-04-19', 20000000,  2, false, false, true, 1),
-- Week 15 — Zurich Classic (team event, 2 picks per user)
('Zurich Classic of New Orleans', 'TPC Louisiana',                                 'Avondale, LA',              '2026-04-23', '2026-04-26',  9500000, 21, false, false, true, 2),
-- Week 16
('Cadillac Championship',         'Trump National Doral (Blue Monster)',            'Miami, FL',                 '2026-04-30', '2026-05-03', 20000000,  2, false, false, true, 1),
-- Week 17 (two events same week)
('Truist Championship',           'The Philadelphia Cricket Club (Wissahickon Course)', 'Philadelphia, PA',     '2026-05-07', '2026-05-10', 20000000,  2, false, false, true, 1),
('ONEflight Myrtle Beach',        'Dunes Golf and Beach Club',                     'Myrtle Beach, SC',          '2026-05-07', '2026-05-10',  4000000, 29, false, false, true, 1),
-- Week 18 — PGA Championship (TBD purse)
('PGA Championship',              'Quail Hollow Club',                             'Charlotte, NC',             '2026-05-14', '2026-05-17',   NULL,   NULL, false, false, true, 1),
-- Week 19
('THE CJ CUP Byron Nelson',       'TPC Craig Ranch',                               'McKinney, TX',              '2026-05-21', '2026-05-24', 10300000, 12, false, false, true, 1),
-- Week 20
('Charles Schwab Challenge',      'Colonial Country Club',                         'Fort Worth, TX',            '2026-05-28', '2026-05-31',  9900000, 14, false, false, true, 1),
-- Week 21
('The Memorial Tournament',       'Muirfield Village Golf Club',                   'Dublin, OH',                '2026-06-04', '2026-06-07', 20000000,  2, false, false, true, 1),
-- Week 22
('RBC Canadian Open',             'TPC Toronto at Osprey Valley (North Course)',   'Caledon, Ontario CAN',      '2026-06-11', '2026-06-14',  9800000, 16, false, false, true, 1),
-- Week 23 — U.S. Open (TBD purse)
('U.S. Open',                     'Oakmont Country Club',                          'Oakmont, PA',               '2026-06-18', '2026-06-21',   NULL,   NULL, false, false, true, 1),
-- Week 24
('Travelers Championship',        'TPC River Highlights',                          'Cromwell, CT',              '2026-06-25', '2026-06-28', 20000000,  2, false, false, true, 1),
-- Week 25
('John Deere Classic',            'TPC Deere Run',                                 'Silvis, IL',                '2026-07-02', '2026-07-05',  8800000, 26, false, false, true, 1),
-- Week 26 (two events same week)
('Genesis Scottish Open',         'The Renaissance Club',                          'North Berwick, SCO',        '2026-07-09', '2026-07-12',  9000000, 25, false, false, true, 1),
('ISCO Championship',             'Hurstbourne Country Club (Championship Course)','Louisville, KY',            '2026-07-09', '2026-07-12',  4000000, 29, false, false, true, 1),
-- Week 27 (two events same week) — The Open (TBD purse)
('The Open Championship',         'Royal Portrush Golf Club',                      'Portrush, NIR',             '2026-07-16', '2026-07-19',   NULL,   NULL, false, false, true, 1),
('Corales Puntacana Championship','Corales Golf Course',                           'Punta Cana, Dominican Republic', '2026-07-16', '2026-07-19', 4000000, 29, false, false, true, 1),
-- Week 28
('3M Open',                       'TPC Twin Cities',                               'Blaine, MN',                '2026-07-23', '2026-07-26',  8800000, 26, false, false, true, 1),
-- Week 29
('Rocket Classic',                'Detroit Golf Club',                             'Detroit, MI',               '2026-07-30', '2026-08-02', 10000000, 13, false, false, true, 1),
-- Week 30
('Wyndham Championship',          'Sedgefield Country Club',                       'Greensboro, NC',            '2026-08-09', '2026-08-12',  8500000, 28, false, false, true, 1),
-- FedEx Playoffs (Week 31–32) — included in OND
('FedEx St. Jude Championship',   'TPC Southwind',                                 'Memphis, TN',               '2026-08-13', '2026-08-16', 20000000,  2, false, false, true, 1),
('BMW Championship',              'Bellerive Country Club',                        'St. Louis, MO',             '2026-08-20', '2026-08-23', 20000000,  2, false, false, true, 1);
-- FedEx Cup Finale (TOUR Championship) is EXCLUDED from OND per contest rules.


-- ─── GOLFERS ───────────────────────────────────────────────────────────────
-- Includes all golfers from weeks 1–6 historical picks + a deep PGA Tour pool.
-- World ranks are approximate as of early 2026.

INSERT INTO public.golfers (name, world_rank, primary_tour) VALUES
-- ── Top-ranked / Major winners ──
('Scottie Scheffler',      1, 'PGA Tour'),
('Rory McIlroy',           2, 'PGA Tour'),
('Collin Morikawa',        3, 'PGA Tour'),
('Xander Schauffele',      4, 'PGA Tour'),
('Ludvig Aberg',           5, 'PGA Tour'),
('Viktor Hovland',         6, 'PGA Tour'),
('Tommy Fleetwood',        7, 'PGA Tour'),
('Jon Rahm',               8, 'LIV Golf'),
('Brian Harman',           9, 'PGA Tour'),
('Patrick Cantlay',       10, 'PGA Tour'),
('Wyndham Clark',         11, 'PGA Tour'),
('Russell Henley',        12, 'PGA Tour'),
('Hideki Matsuyama',      13, 'PGA Tour'),
('Sahith Theegala',       14, 'PGA Tour'),
('Justin Thomas',         15, 'PGA Tour'),
('Matt Fitzpatrick',      16, 'PGA Tour'),
('Max Homa',              17, 'PGA Tour'),
('Jason Day',             18, 'PGA Tour'),
('Tony Finau',            19, 'PGA Tour'),
('Sepp Straka',           20, 'PGA Tour'),
('Jordan Spieth',         21, 'PGA Tour'),
('Shane Lowry',           22, 'PGA Tour'),
('Brooks Koepka',         23, 'LIV Golf'),
('Rickie Fowler',         24, 'PGA Tour'),
('Sam Burns',             25, 'PGA Tour'),
('Keegan Bradley',        26, 'PGA Tour'),
('Nick Taylor',           27, 'PGA Tour'),
('Chris Kirk',            28, 'PGA Tour'),
('Sungjae Im',            29, 'PGA Tour'),
('Billy Horschel',        30, 'PGA Tour'),
('Justin Rose',           31, 'PGA Tour'),
('Corey Conners',         32, 'PGA Tour'),
('Adam Scott',            33, 'PGA Tour'),
('Harris English',        34, 'PGA Tour'),
('Maverick McNealy',      35, 'PGA Tour'),
('Cameron Young',         36, 'PGA Tour'),
('Akshay Bhatia',         37, 'PGA Tour'),
('Tom Kim',               38, 'PGA Tour'),
('Si Woo Kim',            39, 'PGA Tour'),
('Robert MacIntyre',      40, 'PGA Tour'),
('Stephan Jaeger',        41, 'PGA Tour'),
('Eric Cole',             42, 'PGA Tour'),
('Taylor Pendrith',       43, 'PGA Tour'),
('Luke List',             44, 'PGA Tour'),
('Ben Griffin',           45, 'PGA Tour'),
('Davis Riley',           46, 'PGA Tour'),
('J.J. Spaun',            47, 'PGA Tour'),
('Brendon Todd',          48, 'PGA Tour'),
('Beau Hossler',          49, 'PGA Tour'),
('Pierceson Coody',       50, 'PGA Tour'),
('Aaron Rai',             51, 'PGA Tour'),
('Kevin Yu',              52, 'PGA Tour'),
('Taylor Montgomery',     53, 'PGA Tour'),
('Denny McCarthy',        54, 'PGA Tour'),
('Joel Dahmen',           55, 'PGA Tour'),
('Ryan Gerard',           56, 'PGA Tour'),
('Nick Dunlap',           57, 'PGA Tour'),
('Keith Mitchell',        58, 'PGA Tour'),
('K.H. Lee',              59, 'PGA Tour'),
('Byeong Hun An',         60, 'PGA Tour'),
('Nate Lashley',          61, 'PGA Tour'),
('Andrew Novak',          62, 'PGA Tour'),
('Adam Schenk',           63, 'PGA Tour'),
('Tyler Duncan',          64, 'PGA Tour'),
('Emiliano Grillo',       65, 'PGA Tour'),
('Kevin Streelman',       66, 'PGA Tour'),
('Webb Simpson',          67, 'PGA Tour'),
('Gary Woodland',         68, 'PGA Tour'),
('Harry Hall',            69, 'PGA Tour'),
('Peter Malnati',         70, 'PGA Tour'),
('Ryan Moore',            71, 'PGA Tour'),
('Chad Ramey',            72, 'PGA Tour'),
('Henrik Norlander',      73, 'PGA Tour'),
('Jake Knapp',            74, 'PGA Tour'),
('Sam Stevens',           75, 'PGA Tour'),
('Marco Penge',           76, 'DP World Tour'),
('Nico Echavarria',       77, 'PGA Tour'),
('Daniel Berger',         78, 'PGA Tour'),
('Will Zalatoris',        79, 'PGA Tour'),
('Russell Knox',          80, 'PGA Tour'),
('Callum Tarren',         81, 'PGA Tour'),
('Joseph Bramlett',       82, 'PGA Tour'),
('Doc Redman',            83, 'PGA Tour'),
('Jim Knous',             84, 'PGA Tour'),
('Zac Blair',             85, 'PGA Tour'),
('Patrick Rogers',        86, 'PGA Tour'),
('Alex Noren',            87, 'DP World Tour'),
('Thriston Lawrence',     88, 'DP World Tour'),
('Min Woo Lee',           89, 'PGA Tour'),
('Cam Davis',             90, 'PGA Tour'),
('Mackenzie Hughes',      91, 'PGA Tour'),
('Luke Donald',           92, 'DP World Tour'),
('Padraig Harrington',    93, 'DP World Tour'),
('Austin Eckroat',        94, 'PGA Tour'),
('Christiaan Bezuidenhout', 95, 'PGA Tour'),
('Seamus Power',          96, 'PGA Tour'),
('Scott Stallings',       97, 'PGA Tour'),
('Robby Shelton',         98, 'PGA Tour'),
('Jhonattan Vegas',       99, 'PGA Tour'),
('Michael Thorbjornsen', 100, 'PGA Tour'),
-- LIV Golf notables
('Phil Mickelson',        NULL, 'LIV Golf'),
('Dustin Johnson',        NULL, 'LIV Golf'),
('Bryson DeChambeau',     NULL, 'LIV Golf'),
('Patrick Reed',          NULL, 'LIV Golf'),
('Abraham Ancer',         NULL, 'LIV Golf'),
('Louis Oosthuizen',      NULL, 'LIV Golf'),
('Sergio Garcia',         NULL, 'LIV Golf'),
('Ian Poulter',           NULL, 'LIV Golf'),
('Lee Westwood',          NULL, 'LIV Golf'),
('Jason Kokrak',          NULL, 'LIV Golf'),
-- Additional PGA Tour members
('Matt Kuchar',          101, 'PGA Tour'),
('Brian Gay',            102, 'PGA Tour'),
('Scott Brown',          103, 'PGA Tour'),
('Brendan Steele',       104, 'PGA Tour'),
('Patton Kizzire',       105, 'PGA Tour'),
('Danny Willett',        106, 'DP World Tour'),
('Francesco Molinari',   107, 'DP World Tour'),
('Tyrrell Hatton',       108, 'LIV Golf'),
('Bubba Watson',         109, 'PGA Tour'),
('Graeme McDowell',      110, 'PGA Tour');


-- ─── TOURNAMENT FIELDS (Historical Weeks 1–6) ──────────────────────────────
-- We insert the golfers who were actually picked in each week.
-- A full field (144-156 golfers) would be populated by the admin or API.
-- Tee times for completed events are set to past dates so they're flagged as locked.

-- HELPER: reference tournaments and golfers by name for readability.
-- Week 1 — Sony Open in Hawaii
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings, finish_position)
SELECT t.id, g.id, '2026-01-15 07:00:00-10'::timestamptz, gdata.earnings, gdata.pos
FROM public.tournaments t,
     public.golfers g,
     (VALUES
        ('Si Woo Kim',      220675, '1'),
        ('Collin Morikawa',      0, 'CUT'),
        ('Harry Hall',      287105, NULL),
        ('Ben Griffin',     111839, NULL),
        ('Keegan Bradley',       0, 'CUT'),
        ('Nico Echavarria',      0, 'CUT'),
        ('Nick Taylor',     163041, NULL),
        ('Ryan Gerard',     991900, '1'),
        ('Maverick McNealy',  72475, NULL),
        ('Scottie Scheffler',     0, 'WD'),
        ('Rory McIlroy',          0, 'CUT'),
        ('Xander Schauffele',     0, 'WD')
     ) AS gdata(golfer_name, earnings, pos)
WHERE t.name = 'Sony Open in Hawaii'
  AND g.name = gdata.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings, finish_position = EXCLUDED.finish_position;

-- Week 2 — The American Express
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings, finish_position)
SELECT t.id, g.id, '2026-01-22 07:00:00-08'::timestamptz, gdata.earnings, gdata.pos
FROM public.tournaments t,
     public.golfers g,
     (VALUES
        ('Sam Burns',        57918, NULL),
        ('Si Woo Kim',      322000, '1'),
        ('Harry Hall',       81420, NULL),
        ('Matt Fitzpatrick',  19688, NULL),
        ('Daniel Berger',    20884, NULL),
        ('Sepp Straka',          0, 'CUT'),
        ('Robert MacIntyre',  39100, NULL),
        ('Nick Taylor',          0, 'CUT'),
        ('Maverick McNealy',     0, 'WD'),
        ('Collin Morikawa',      0, 'WD')
     ) AS gdata(golfer_name, earnings, pos)
WHERE t.name = 'The American Express'
  AND g.name = gdata.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings, finish_position = EXCLUDED.finish_position;

-- Week 3 — Farmers Insurance Open
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings, finish_position)
SELECT t.id, g.id, '2026-01-29 07:00:00-08'::timestamptz, gdata.earnings, gdata.pos
FROM public.tournaments t,
     public.golfers g,
     (VALUES
        ('Keegan Bradley',   31264, NULL),
        ('Will Zalatoris',       0, 'CUT'),
        ('Taylor Pendrith',      0, 'CUT'),
        ('Ryan Gerard',     193028, NULL),
        ('Wyndham Clark',    20352, NULL),
        ('Hideki Matsuyama', 193028, NULL),
        ('Jason Day',        41760, NULL),
        ('Marco Penge',          0, 'CUT'),
        ('Sam Stevens',      56280, NULL),
        ('Scottie Scheffler', 9600000, '1'),
        ('Rory McIlroy',         0, 'CUT')
     ) AS gdata(golfer_name, earnings, pos)
WHERE t.name = 'Farmers Insurance Open'
  AND g.name = gdata.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings, finish_position = EXCLUDED.finish_position;

-- Week 4 — WM Phoenix Open
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings, finish_position)
SELECT t.id, g.id, '2026-02-05 07:00:00-07'::timestamptz, gdata.earnings, gdata.pos
FROM public.tournaments t,
     public.golfers g,
     (VALUES
        ('Maverick McNealy',  188000, NULL),
        ('Sahith Theegala',   122720, NULL),
        ('Jake Knapp',        300000, NULL),
        ('Stephan Jaeger',     62948, NULL),
        ('Ben Griffin',        62948, NULL),
        ('Si Woo Kim',        439680, NULL),
        ('Sam Burns',              0, 'CUT'),
        ('Keith Mitchell',     34080, NULL),
        ('Pierceson Coody',   242400, NULL),
        ('Scottie Scheffler', 1720000, '1'),
        ('Rory McIlroy',       86240, NULL)
     ) AS gdata(golfer_name, earnings, pos)
WHERE t.name = 'WM Phoenix Open'
  AND g.name = gdata.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings, finish_position = EXCLUDED.finish_position;

-- Week 5 — AT&T Pebble Beach Pro-Am
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings, finish_position)
SELECT t.id, g.id, '2026-02-12 07:00:00-08'::timestamptz, gdata.earnings, gdata.pos
FROM public.tournaments t,
     public.golfers g,
     (VALUES
        ('Justin Rose',       78375, NULL),
        ('Hideki Matsuyama', 515000, NULL),
        ('Si Woo Kim',        57000, NULL),
        ('Matt Fitzpatrick',  342750, NULL),
        ('Russell Henley',    235000, NULL),
        ('Jason Day',         162000, NULL),
        ('Sepp Straka',      1760000, '1'),
        ('Scottie Scheffler', 877500, NULL),
        ('Collin Morikawa',    57000, NULL),
        ('Rory McIlroy',      117750, NULL)
     ) AS gdata(golfer_name, earnings, pos)
WHERE t.name = 'AT&T Pebble Beach Pro-Am'
  AND g.name = gdata.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings, finish_position = EXCLUDED.finish_position;

-- Week 6 — The Genesis Invitational
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1, earnings, finish_position)
SELECT t.id, g.id, '2026-02-19 07:00:00-08'::timestamptz, gdata.earnings, gdata.pos
FROM public.tournaments t,
     public.golfers g,
     (VALUES
        ('Patrick Cantlay',    92250, NULL),
        ('Matt Fitzpatrick',  178250, NULL),
        ('Rory McIlroy',     1800000, '1'),
        ('Scottie Scheffler', 603200, NULL),
        ('Hideki Matsuyama',  136500, NULL),
        ('Collin Morikawa',   603200, NULL),
        ('Ludvig Aberg',      259500, NULL),
        ('Harris English',    224500, NULL),
        ('Justin Rose',        34500, NULL),
        ('Sam Burns',          92250, NULL)
     ) AS gdata(golfer_name, earnings, pos)
WHERE t.name = 'The Genesis Invitational'
  AND g.name = gdata.golfer_name
ON CONFLICT (tournament_id, golfer_id) DO UPDATE
  SET earnings = EXCLUDED.earnings, finish_position = EXCLUDED.finish_position;

-- Week 7 — Cognizant Classic (active — no results yet, just field stubs)
-- Admin will populate the full field via the admin panel or API integration.
-- Adding a few top players as a starting point:
INSERT INTO public.tournament_fields (tournament_id, golfer_id, tee_time_r1)
SELECT t.id, g.id, '2026-02-26 08:00:00-05'::timestamptz
FROM public.tournaments t, public.golfers g
WHERE t.name = 'Cognizant Classic'
  AND g.name IN (
    'Scottie Scheffler', 'Rory McIlroy', 'Collin Morikawa', 'Xander Schauffele',
    'Ludvig Aberg', 'Viktor Hovland', 'Tommy Fleetwood', 'Brian Harman',
    'Patrick Cantlay', 'Wyndham Clark', 'Russell Henley', 'Hideki Matsuyama',
    'Sahith Theegala', 'Justin Thomas', 'Matt Fitzpatrick', 'Max Homa',
    'Jason Day', 'Tony Finau', 'Sepp Straka', 'Jordan Spieth',
    'Shane Lowry', 'Rickie Fowler', 'Sam Burns', 'Keegan Bradley',
    'Nick Taylor', 'Chris Kirk', 'Sungjae Im', 'Billy Horschel',
    'Justin Rose', 'Corey Conners', 'Adam Scott', 'Harris English',
    'Maverick McNealy', 'Cameron Young', 'Akshay Bhatia', 'Tom Kim',
    'Si Woo Kim', 'Robert MacIntyre', 'Stephan Jaeger', 'Eric Cole',
    'Taylor Pendrith', 'Ben Griffin', 'Davis Riley', 'J.J. Spaun',
    'Brendon Todd', 'Beau Hossler', 'Pierceson Coody', 'Aaron Rai',
    'Kevin Yu', 'Taylor Montgomery', 'Denny McCarthy', 'Joel Dahmen',
    'Ryan Gerard', 'Nick Dunlap', 'Keith Mitchell', 'K.H. Lee',
    'Byeong Hun An', 'Nate Lashley', 'Andrew Novak', 'Adam Schenk',
    'Tyler Duncan', 'Emiliano Grillo', 'Kevin Streelman', 'Gary Woodland',
    'Harry Hall', 'Peter Malnati', 'Ryan Moore', 'Chad Ramey',
    'Henrik Norlander', 'Jake Knapp', 'Sam Stevens', 'Nico Echavarria',
    'Daniel Berger', 'Will Zalatoris', 'Callum Tarren', 'Joseph Bramlett'
  )
ON CONFLICT (tournament_id, golfer_id) DO NOTHING;


-- ─── NOTES FOR ADMIN ───────────────────────────────────────────────────────
-- 1. User accounts + historical picks must be seeded separately.
--    Run: npm run seed:picks (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
--
-- 2. Update Cognizant Classic field with all 144 golfers via Admin > Fields.
--
-- 3. For each upcoming tournament, add the full field + tee times via Admin.
--
-- 4. Major purses (Masters, PGA, U.S. Open, The Open) can be updated via Admin
--    once announced. Set purse_rank after updating all four.
--
-- 5. The Zurich Classic is already set with max_picks_per_user = 2.
