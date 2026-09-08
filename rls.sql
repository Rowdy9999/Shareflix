-- ENABLE RLS ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- MOVIES POLICIES
CREATE POLICY "Approved movies are viewable by everyone" ON movies FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view own pending movies" ON movies FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own movies" ON movies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own pending movies" ON movies FOR UPDATE USING (auth.uid() = owner_id AND status = 'pending');

-- SUBMISSIONS POLICIES
CREATE POLICY "Users can view own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- REFERRALS POLICIES
CREATE POLICY "Users can view referrals for own movies" ON referrals FOR SELECT USING (auth.uid() = movie_owner_id OR auth.uid() = referring_user_id);
CREATE POLICY "System can insert referrals" ON referrals FOR INSERT WITH CHECK (true);

-- EARNINGS POLICIES
CREATE POLICY "Users can view own earnings" ON earnings FOR SELECT USING (auth.uid() = user_id);

-- WITHDRAWALS POLICIES
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AUDIT LOGS - admin only via service role
CREATE POLICY "Only service role can access audit logs" ON audit_logs FOR ALL USING (false);

-- SETTINGS - public readable
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);
