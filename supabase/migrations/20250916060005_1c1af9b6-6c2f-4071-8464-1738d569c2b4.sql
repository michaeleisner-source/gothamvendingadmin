-- Create demo user for QA testing
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'demo@example.com',
  crypt('supersecret', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('supersecret', gen_salt('bf')),
  updated_at = now();

-- Create demo profile if profiles table exists
INSERT INTO public.profiles (
  id,
  user_id,
  display_name,
  avatar_url
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Demo User',
  null
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = 'Demo User',
  updated_at = now();

-- Ensure QA test organization exists if organizations table exists  
INSERT INTO public.organizations (
  id,
  name,
  type,
  created_at,
  updated_at
) VALUES (
  'qa-test-org-uuid-12345',
  'QA Test Organization',
  'testing',
  now(),
  now()
) ON CONFLICT (name) DO UPDATE SET
  updated_at = now();

-- Link demo user to QA org if both tables exist
UPDATE public.profiles 
SET org_id = 'qa-test-org-uuid-12345'
WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';