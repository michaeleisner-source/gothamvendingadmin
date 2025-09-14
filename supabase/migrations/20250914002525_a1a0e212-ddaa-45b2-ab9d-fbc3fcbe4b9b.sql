-- Create deletion logs table to track all deletions
CREATE TABLE deletion_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  deleted_by_name TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  entity_type TEXT NOT NULL, -- 'purchase_order', 'purchase_order_item', 'product', etc.
  entity_id UUID NOT NULL,
  entity_data JSONB, -- Store the data that was deleted for reference
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "deletion_logs_all" 
ON deletion_logs 
FOR ALL 
USING (is_org_member(org_id)) 
WITH CHECK (org_id = current_org());

-- Add trigger for org_id
CREATE TRIGGER set_deletion_logs_org_id
  BEFORE INSERT ON deletion_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_org_id();

-- Create function to safely delete purchase orders
CREATE OR REPLACE FUNCTION delete_purchase_order_with_log(
  p_po_id UUID,
  p_deleted_by_name TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po_data JSONB;
  v_org UUID := current_org();
BEGIN
  -- Get PO data before deletion
  SELECT to_jsonb(po) INTO v_po_data
  FROM (
    SELECT 
      po.*,
      s.name as supplier_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', poi.id,
            'product_id', poi.product_id,
            'qty_ordered', poi.qty_ordered,
            'unit_cost', poi.unit_cost,
            'product_name', p.name,
            'product_sku', p.sku
          )
        ) FILTER (WHERE poi.id IS NOT NULL),
        '[]'::json
      ) as line_items
    FROM purchase_orders po
    LEFT JOIN suppliers s ON s.id = po.supplier_id
    LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
    LEFT JOIN products p ON p.id = poi.product_id
    WHERE po.id = p_po_id AND po.org_id = v_org
    GROUP BY po.id, s.name
  ) po;

  IF v_po_data IS NULL THEN
    RAISE EXCEPTION 'Purchase order not found or not authorized';
  END IF;

  -- Log the deletion
  INSERT INTO deletion_logs (
    org_id, deleted_by_name, entity_type, entity_id, entity_data, reason
  ) VALUES (
    v_org, p_deleted_by_name, 'purchase_order', p_po_id, v_po_data, p_reason
  );

  -- Delete line items first (cascade)
  DELETE FROM purchase_order_items WHERE po_id = p_po_id;
  
  -- Delete the purchase order
  DELETE FROM purchase_orders WHERE id = p_po_id AND org_id = v_org;
END;
$$;

-- Create function to safely delete purchase order items
CREATE OR REPLACE FUNCTION delete_purchase_order_item_with_log(
  p_item_id UUID,
  p_deleted_by_name TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_data JSONB;
  v_org UUID := current_org();
BEGIN
  -- Get item data before deletion
  SELECT to_jsonb(item_data) INTO v_item_data
  FROM (
    SELECT 
      poi.*,
      p.name as product_name,
      p.sku as product_sku,
      po.id as po_id
    FROM purchase_order_items poi
    JOIN products p ON p.id = poi.product_id
    JOIN purchase_orders po ON po.id = poi.po_id
    WHERE poi.id = p_item_id AND poi.org_id = v_org
  ) item_data;

  IF v_item_data IS NULL THEN
    RAISE EXCEPTION 'Purchase order item not found or not authorized';
  END IF;

  -- Log the deletion
  INSERT INTO deletion_logs (
    org_id, deleted_by_name, entity_type, entity_id, entity_data, reason
  ) VALUES (
    v_org, p_deleted_by_name, 'purchase_order_item', p_item_id, v_item_data, p_reason
  );

  -- Delete the item
  DELETE FROM purchase_order_items WHERE id = p_item_id AND org_id = v_org;
END;
$$;