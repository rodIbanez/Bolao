
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Public user data linked to Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  photo_url TEXT,
  preferred_team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teams Table (Optional but recommended for consistency)
CREATE TABLE teams (
  id TEXT PRIMARY KEY, -- 'BRA', 'USA', etc.
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  flag TEXT NOT NULL,
  color TEXT NOT NULL
);

-- 3. Matches Table
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  home_team_id TEXT REFERENCES teams(id) NOT NULL,
  away_team_id TEXT REFERENCES teams(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  match_group TEXT NOT NULL,
  actual_home_score INT,
  actual_away_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Groups Table
CREATE TABLE groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  initials TEXT NOT NULL,
  language_default TEXT DEFAULT 'pt' NOT NULL,
  owner_user_id UUID REFERENCES profiles(id) NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. UserGroups (Memberships)
CREATE TABLE user_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, group_id)
);

-- 6. Predictions Table
CREATE TABLE predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  home_score INT NOT NULL,
  away_score INT NOT NULL,
  is_joker BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- 7. Scoring Rules Table
CREATE TABLE scoring_rules (
  id TEXT PRIMARY KEY, -- usually 'current'
  exact INT NOT NULL DEFAULT 25,
  diff INT NOT NULL DEFAULT 18,
  outcome INT NOT NULL DEFAULT 10,
  one_score INT NOT NULL DEFAULT 4,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial seed for scoring rules
INSERT INTO scoring_rules (id, exact, diff, outcome, one_score)
VALUES ('current', 25, 18, 10, 4);
