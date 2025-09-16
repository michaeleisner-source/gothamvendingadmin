do $$
declare v_id uuid;
begin
  insert into public.products  (sku, name, cost_cents) values ('QA-PING2','Ping Product',1) returning id into v_id;
  delete from public.products where id=v_id;
  insert into public.locations (name) values ('QA Ping Location 2') returning id into v_id;
  delete from public.locations where id=v_id;
  insert into public.machines  (name) values ('QA Ping Machine 2') returning id into v_id;
  delete from public.machines where id=v_id;
end $$;