-- Create demo user with proper auth handling
DO $$
BEGIN
  -- First check if user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'demo@example.com'
  ) THEN
    -- Insert demo user directly into auth.users table
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      'authenticated',
      'authenticated',
      'demo@example.com',
      crypt('supersecret', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    -- Update existing user's password
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('supersecret', gen_salt('bf')),
      updated_at = now()
    WHERE email = 'demo@example.com';
  END IF;
END
$$;

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text DEFAULT 'standard',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy for organizations
CREATE POLICY IF NOT EXISTS "organizations_public_read" ON public.organizations
    FOR SELECT USING (true);

-- Create profiles table if it doesn't exist  
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    org_id uuid REFERENCES public.organizations(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for profiles
CREATE POLICY IF NOT EXISTS "profiles_public_read" ON public.profiles
    FOR SELECT USING (true);
    
CREATE POLICY IF NOT EXISTS "profiles_users_update_own" ON public.profiles
    FOR ALL USING (auth.uid() = user_id);

-- Insert QA organization
INSERT INTO public.organizations (id, name, type) 
VALUES ('qa-test-org-uuid-12345', 'QA Test Organization', 'testing')
ON CONFLICT (name) DO UPDATE SET updated_at = now();

-- Insert demo profile
INSERT INTO public.profiles (id, user_id, display_name, org_id)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
    'Demo User',
    'qa-test-org-uuid-12345'
)
ON CONFLICT (user_id) DO UPDATE SET 
    display_name = 'Demo User',
    org_id = 'qa-test-org-uuid-12345',
    updated_at = now();