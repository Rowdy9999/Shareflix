-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, referral_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_earnings_updated_at BEFORE UPDATE ON earnings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- NORMALIZE TITLE FUNCTION
CREATE OR REPLACE FUNCTION normalize_title(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(title), '[^a-zA-Z0-9\s]', '', 'g'), '\s+', ' ', 'g'), '^\s+|\s+$', '', 'g'));
END;
$$ LANGUAGE plpgsql;

-- CHECK 24H SUBMISSION COOLDOWN
CREATE OR REPLACE FUNCTION check_submission_cooldown(user_id_param UUID)
RETURNS TABLE(can_submit BOOLEAN, hours_left INTEGER, minutes_left INTEGER) AS $$
DECLARE
  last_submission TIMESTAMPTZ;
  time_diff INTERVAL;
  total_minutes BIGINT;
BEGIN
  SELECT submitted_at INTO last_submission
  FROM submissions
  WHERE user_id = user_id_param
  ORDER BY submitted_at DESC
  LIMIT 1;

  IF last_submission IS NULL THEN
    RETURN QUERY SELECT TRUE, 0, 0;
    RETURN;
  END IF;

  time_diff := NOW() - last_submission;

  IF time_diff >= INTERVAL '24 hours' THEN
    RETURN QUERY SELECT TRUE, 0, 0;
  ELSE
    total_minutes := EXTRACT(EPOCH FROM (INTERVAL '24 hours' - time_diff)) / 60;
    RETURN QUERY SELECT FALSE, (total_minutes / 60)::INTEGER, (total_minutes % 60)::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RECORD REFERRAL FUNCTION
CREATE OR REPLACE FUNCTION record_referral(
  p_movie_id UUID,
  p_referring_user_id UUID,
  p_visitor_ip TEXT DEFAULT '',
  p_visitor_fingerprint TEXT DEFAULT '',
  p_source TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
  v_movie_owner_id UUID;
  v_referral_id UUID;
  v_reward_amount DECIMAL;
  v_fraud_score INTEGER DEFAULT 0;
BEGIN
  SELECT owner_id INTO v_movie_owner_id FROM movies WHERE id = p_movie_id AND status = 'approved';
  IF v_movie_owner_id IS NULL THEN RETURN NULL; END IF;

  IF p_referring_user_id = v_movie_owner_id THEN v_fraud_score := 100; END IF;

  SELECT (value->>'reward_per_qualified_visitor')::DECIMAL INTO v_reward_amount
  FROM settings WHERE key = 'rewards' LIMIT 1;
  IF v_reward_amount IS NULL THEN v_reward_amount := 2.00; END IF;

  INSERT INTO referrals (movie_id, movie_owner_id, referring_user_id, visitor_ip, visitor_fingerprint, source, fraud_score, reward_amount)
  VALUES (p_movie_id, v_movie_owner_id, p_referring_user_id, p_visitor_ip, p_visitor_fingerprint, p_source, v_fraud_score, v_reward_amount)
  RETURNING id INTO v_referral_id;

  RETURN v_referral_id;
END;
$$ LANGUAGE plpgsql;

-- QUALIFY REFERRAL FUNCTION
CREATE OR REPLACE FUNCTION qualify_referral(p_referral_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referral RECORD;
BEGIN
  SELECT * INTO v_referral FROM referrals WHERE id = p_referral_id AND qualification_status = 'pending';
  IF v_referral IS NULL THEN RETURN FALSE; END IF;

  UPDATE referrals SET qualification_status = 'qualified', qualified_at = NOW() WHERE id = p_referral_id;

  INSERT INTO earnings (user_id, movie_id, referral_id, amount, status)
  VALUES (v_referral.movie_owner_id, v_referral.movie_id, p_referral_id, v_referral.reward_amount, 'pending');

  UPDATE profiles SET pending_earnings = pending_earnings + v_referral.reward_amount WHERE id = v_referral.movie_owner_id;
  UPDATE movies SET total_earnings = total_earnings + v_referral.reward_amount, qualified_visitors = qualified_visitors + 1 WHERE id = v_referral.movie_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
