-- Add foreign key constraint: machine_finance.machine_id -> machines.id
DO $$
BEGIN
  ALTER TABLE public.machine_finance
    ADD CONSTRAINT machine_finance_machine_id_fkey
    FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;