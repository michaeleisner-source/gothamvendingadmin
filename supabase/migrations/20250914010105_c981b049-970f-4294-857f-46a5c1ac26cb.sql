-- Update upsert_product function to handle manufacturer field
CREATE OR REPLACE FUNCTION public.upsert_product(p jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_org uuid := current_org();
begin
  if v_org is null then raise exception 'No org in session'; end if;

  if (p->>'id') is null then
    insert into products (org_id, name, sku, category, manufacturer, cost, price)
    values (
      v_org,
      p->>'name',
      nullif(p->>'sku',''),
      nullif(p->>'category',''),
      nullif(p->>'manufacturer',''),
      nullif(p->>'cost','')::numeric,
      nullif(p->>'price','')::numeric
    )
    returning id into v_id;
  else
    if not exists (select 1 from products where id=(p->>'id')::uuid and org_id=v_org) then
      raise exception 'Product not found or not in your org';
    end if;

    update products set
      name        = coalesce(p->>'name', name),
      sku         = coalesce(nullif(p->>'sku',''), sku),
      category    = coalesce(nullif(p->>'category',''), category),
      manufacturer = coalesce(nullif(p->>'manufacturer',''), manufacturer),
      cost        = coalesce(nullif(p->>'cost','')::numeric, cost),
      price       = coalesce(nullif(p->>'price','')::numeric, price)
    where id=(p->>'id')::uuid
    returning id into v_id;
  end if;

  return v_id;
end$function$;