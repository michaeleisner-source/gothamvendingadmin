-- Self-audit SQL for launch readiness check
-- Check RLS status on critical tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'SECURED'
    ELSE 'EXPOSED - CRITICAL SECURITY RISK'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('leads','locations','machines','machine_finance','sales','inventory','insurance_policies','cash_collections')
ORDER BY tablename;

-- Check policy coverage
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has WHERE clause'
    ELSE 'No restrictions'
  END as access_control,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
    ELSE 'No insert/update validation'
  END as modification_control
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('leads','locations','machines','machine_finance','sales','inventory','insurance_policies','cash_collections')
ORDER BY tablename, cmd;