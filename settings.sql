-- DEFAULT SETTINGS
INSERT INTO settings (key, value, category) VALUES
('submission', '{"max_submissions": 1, "cooldown_hours": 24, "enabled": true}', 'submission'),
('duplicate_detection', '{"enabled": true, "sensitivity": "high"}', 'duplicate'),
('rewards', '{"reward_per_qualified_visitor": 2.00, "min_withdrawal": 100, "max_daily_earnings": 5000, "pending_period_hours": 24}', 'rewards'),
('referral', '{"qualification_rules": ["unique_visitor", "page_activity"], "attribution_hours": 24, "max_referrals": 100, "fraud_threshold": 70}', 'referral'),
('movies', '{"categories": ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller", "Romance", "Animation", "Documentary", "Adventure"], "languages": ["en", "hi", "ta", "te", "ml", "kn", "bn", "mr", "gu", "pa"], "qualities": ["HD", "Full HD", "4K", "CAM", "WEBRip"], "default_status": "pending", "featured_limit": 10}', 'movies'),
('website', '{"name": "ShareFlix", "description": "Movie Discovery & Share to Earn Platform", "contact_email": "", "social_links": {}}', 'website')
ON CONFLICT (key) DO NOTHING;
