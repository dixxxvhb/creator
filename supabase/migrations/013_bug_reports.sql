-- 013: Bug reports table for beta testing feedback

CREATE TABLE bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  user_email text NOT NULL,
  description text NOT NULL,
  expected text,
  severity text NOT NULL DEFAULT 'major' CHECK (severity IN ('minor', 'major', 'blocker')),
  page_url text,
  screen_width integer,
  screen_height integer,
  user_agent text,
  app_version text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own bug reports
CREATE POLICY "Users can insert own bug reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own bug reports
CREATE POLICY "Users can read own bug reports" ON bug_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Admin (Dixon) can read all bug reports
CREATE POLICY "Admin can read all bug reports" ON bug_reports
  FOR SELECT USING (
    auth.uid() = (SELECT id FROM auth.users WHERE email = 'dancewithdixon@gmail.com' LIMIT 1)
  );

-- Admin can update bug report status
CREATE POLICY "Admin can update bug reports" ON bug_reports
  FOR UPDATE USING (
    auth.uid() = (SELECT id FROM auth.users WHERE email = 'dancewithdixon@gmail.com' LIMIT 1)
  )
  WITH CHECK (
    auth.uid() = (SELECT id FROM auth.users WHERE email = 'dancewithdixon@gmail.com' LIMIT 1)
  );
