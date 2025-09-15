-- Enable RLS on processor_fee_rules table only
alter table public.processor_fee_rules enable row level security;

-- Fix search path for key functions
do $$
declare
  func_name text;
begin
  for func_name in 
    select distinct routine_name 
    from information_schema.routines 
    where routine_schema = 'public' 
    and routine_type = 'FUNCTION'
    and routine_name not like 'trg_%'
  loop
    begin
      execute format('alter function public.%I set search_path = public, pg_temp', func_name);
    exception when others then
      -- Skip functions that can't be altered or don't exist
      null;
    end;
  end loop;
end$$;