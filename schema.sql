-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  referral_id TEXT UNIQUE NOT NULL,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  is_admin BOOLEAN DEFAULT FALSE,
  balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_withdrawn DECIMAL(10,2) DEFAULT 0,
  pending_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MOVIES TABLE
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  poster_url TEXT DEFAULT '',
  backdrop_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  release_date TEXT DEFAULT '',
  year INTEGER DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0,
  genres TEXT[] DEFAULT '{}',
  runtime INTEGER DEFAULT 0,
  cast_members TEXT[] DEFAULT '{}',
  director TEXT DEFAULT '',
  language TEXT DEFAULT 'en',
  quality TEXT DEFAULT 'HD',
  subtitles TEXT DEFAULT '',
  download_url TEXT NOT NULL,
  watch_url TEXT DEFAULT '',
  metadata_source TEXT DEFAULT 'tmdb' CHECK (metadata_source IN ('tmdb', 'manual')),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT DEFAULT '',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,
  total_visitors INTEGER DEFAULT 0,
  qualified_visitors INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBMISSIONS (to track 24h cooldown)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  movie_id UUID REFERENCES movies(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- REFERRALS TABLE
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id UUID NOT NULL REFERENCES movies(id),
  movie_owner_id UUID NOT NULL REFERENCES profiles(id),
  referring_user_id UUID REFERENCES profiles(id),
  visitor_ip TEXT DEFAULT '',
  visitor_fingerprint TEXT DEFAULT '',
  source TEXT DEFAULT '',
  qualification_status TEXT DEFAULT 'pending' CHECK (qualification_status IN ('pending', 'qualified', 'rejected')),
  fraud_score INTEGER DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
  reward_amount DECIMAL(10,2) DEFAULT 0,
  qualified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EARNINGS TABLE
CREATE TABLE IF NOT EXISTS earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  movie_id UUID NOT NULL REFERENCES movies(id),
  referral_id UUID REFERENCES referrals(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'rejected')),
  rejection_reason TEXT DEFAULT '',
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  previous_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_owner ON movies(owner_id);
CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);
CREATE INDEX IF NOT EXISTS idx_movies_tmdb ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_created ON movies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_movie ON referrals(movie_id);
CREATE INDEX IF NOT EXISTS idx_referrals_owner ON referrals(movie_owner_id);
CREATE INDEX IF NOT EXISTS idx_earnings_user ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_movie ON earnings(movie_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral ON profiles(referral_id);
