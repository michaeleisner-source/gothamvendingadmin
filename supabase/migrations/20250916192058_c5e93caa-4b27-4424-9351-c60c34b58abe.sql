-- Create demo user and organization data correctly
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
  updated_at
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
  now()
);

-- Insert QA organization with correct columns
INSERT INTO public.organizations (id, name)
VALUES ('qa-test-org-uuid-12345', 'QA Test Organization');

-- Insert demo user profile
INSERT INTO public.profiles (id, user_id, display_name, org_id)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Demo User',
  'qa-test-org-uuid-12345'
);