-- ================================================================
-- MASTER SETUP SCRIPT: TABLES + PERMISSIONS + SEED DATA
-- Matches the application's NoSQL-style architecture (JSONB 'data' columns)
-- ================================================================

-- 1. USERS TABLE (Stores user profiles as JSONB)
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  data jsonb NOT NULL
);

-- 2. SHEETS TABLE (Stores operational sheets as JSONB)
CREATE TABLE IF NOT EXISTS public.sheets (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. LOGS TABLE
CREATE TABLE IF NOT EXISTS public.logs (
  id text PRIMARY KEY,
  data jsonb NOT NULL
);

-- 4. ENABLE RLS & PUBLIC ACCESS (Since Login is Removed)
-- Users Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.users;
CREATE POLICY "Public Access" ON public.users FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- Sheets Table
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.sheets;
CREATE POLICY "Public Access" ON public.sheets FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.sheets TO anon, authenticated, service_role;

-- Logs Table
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.logs;
CREATE POLICY "Public Access" ON public.logs FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.logs TO anon, authenticated, service_role;

-- 5. SEED DATA (Default Admin User)
-- Even though login is removed, the app might display this user in lists.
INSERT INTO public.users (id, data)
VALUES (
  '1',
  '{
    "id": "1",
    "username": "admin",
    "password": "123",
    "role": "ADMIN",
    "fullName": "System Administrator",
    "empCode": "ADM001",
    "isApproved": true,
    "email": "admin@unicharm.com"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
