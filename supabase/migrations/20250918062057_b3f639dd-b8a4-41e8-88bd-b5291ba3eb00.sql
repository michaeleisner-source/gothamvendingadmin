-- Fix search path security issue for the create_draft_po_for_low_stock function
CREATE OR REPLACE FUNCTION create_draft_po_for_low_stock(
  p_supplier_id uuid,
  p_note text DEFAULT 'Auto restock from low-stock report'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_org uuid := current_org();
  v_po_id uuid;
BEGIN
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'No org in session';
  END IF;

  IF p_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Supplier is required';
  END IF;

  -- Create the PO shell
  INSERT INTO purchase_orders (org_id, supplier_id, status, created_at, notes)
  VALUES (v_org, p_supplier_id, 'DRAFT', now(), p_note)
  RETURNING id INTO v_po_id;

  -- Insert aggregated items: sum needed per product across all low slots
  WITH low AS (
    SELECT
      sa.product_id,
      sum(greatest(0, ms.restock_threshold - ms.current_qty))::int AS needed
    FROM machine_slots ms
    LEFT JOIN slot_assignments sa
      ON sa.slot_id = ms.id
    WHERE ms.org_id = v_org
      AND ms.current_qty <= ms.restock_threshold
      AND sa.product_id IS NOT NULL
    GROUP BY sa.product_id
    HAVING sum(greatest(0, ms.restock_threshold - ms.current_qty)) > 0
  )
  INSERT INTO purchase_order_items (org_id, po_id, product_id, qty_ordered, unit_cost)
  SELECT
    v_org,
    v_po_id,
    l.product_id,
    l.needed,
    coalesce(p.cost_cents, 0) / 100.0  -- convert cents -> numeric dollars
  FROM low l
  JOIN products p ON p.id = l.product_id AND p.org_id = v_org;

  RETURN v_po_id;
END
$$;