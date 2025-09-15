-- Ensure the two foreign-key relationships exist so Supabase's schema cache is happy.

-- 1) machine_processor_mappings.processor_id -> payment_processors.id
do $$
begin
  alter table public.machine_processor_mappings
    add constraint machine_processor_mappings_processor_id_fkey
    foreign key (processor_id) references public.payment_processors(id) on delete cascade;
exception
  when duplicate_object then null;
end$$;

-- 2) machine_processor_mappings.machine_id -> machines.id
do $$
begin
  alter table public.machine_processor_mappings
    add constraint machine_processor_mappings_machine_id_fkey
    foreign key (machine_id) references public.machines(id) on delete cascade;
exception
  when duplicate_object then null;
end$$;