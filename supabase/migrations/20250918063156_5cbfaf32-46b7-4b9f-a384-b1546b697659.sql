-- Create report_low_stock function to get all slots that are at or below restock threshold
CREATE OR REPLACE FUNCTION report_low_stock()
RETURNS TABLE(
  machine_id uuid,
  machine_name text,
  slot_label text,
  product_id uuid,
  product_name text,
  current_qty integer,
  restock_threshold integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_org uuid := current_org();
BEGIN
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'No org in session';
  END IF;

  RETURN QUERY
  SELECT
    ms.machine_id,
    m.name as machine_name,
    ms.label as slot_label,
    sa.product_id,
    p.name as product_name,
    ms.current_qty,
    ms.restock_threshold
  FROM machine_slots ms
  LEFT JOIN machines m ON m.id = ms.machine_id
  LEFT JOIN slot_assignments sa ON sa.slot_id = ms.id
  LEFT JOIN products p ON p.id = sa.product_id
  WHERE ms.org_id = v_org
    AND ms.current_qty <= ms.restock_threshold
    AND sa.product_id IS NOT NULL
  ORDER BY m.name, ms.label;
END
$$;

REVOKE ALL ON FUNCTION report_low_stock() FROM public;
GRANT EXECUTE ON FUNCTION report_low_stock() TO authenticated;