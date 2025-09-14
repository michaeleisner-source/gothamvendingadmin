-- Create functions for inventory automation and business process integration

-- Function to automatically update inventory levels when sales are recorded
CREATE OR REPLACE FUNCTION public.update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Find the slot assignment for this machine/product combination
  WITH slot_info AS (
    SELECT sa.slot_id, ms.machine_id
    FROM slot_assignments sa
    JOIN machine_slots ms ON ms.id = sa.slot_id
    WHERE sa.product_id = NEW.product_id 
      AND ms.machine_id = NEW.machine_id
    LIMIT 1
  )
  -- Update or insert inventory level
  INSERT INTO inventory_levels (
    org_id, machine_id, slot_id, product_id, current_qty, updated_at
  )
  SELECT 
    NEW.org_id, si.machine_id, si.slot_id, NEW.product_id, 
    GREATEST(0, COALESCE((SELECT current_qty FROM inventory_levels WHERE slot_id = si.slot_id), 0) - NEW.qty),
    now()
  FROM slot_info si
  ON CONFLICT (slot_id) 
  DO UPDATE SET 
    current_qty = GREATEST(0, inventory_levels.current_qty - NEW.qty),
    updated_at = now();

  -- Calculate sales velocity (last 30 days)
  UPDATE inventory_levels SET
    sales_velocity = (
      SELECT COALESCE(SUM(s.qty), 0) / 30.0
      FROM sales s
      JOIN machine_slots ms ON ms.machine_id = s.machine_id
      WHERE s.product_id = NEW.product_id 
        AND s.machine_id = NEW.machine_id
        AND s.occurred_at >= now() - INTERVAL '30 days'
    ),
    days_of_supply = CASE 
      WHEN sales_velocity > 0 THEN current_qty / NULLIF(sales_velocity, 0)
      ELSE 999 
    END
  WHERE slot_id IN (
    SELECT sa.slot_id 
    FROM slot_assignments sa
    JOIN machine_slots ms ON ms.id = sa.slot_id
    WHERE sa.product_id = NEW.product_id 
      AND ms.machine_id = NEW.machine_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update inventory on restock
CREATE OR REPLACE FUNCTION public.update_inventory_on_restock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update inventory level
  INSERT INTO inventory_levels (
    org_id, machine_id, slot_id, product_id, current_qty, last_restocked_at, updated_at
  )
  VALUES (
    NEW.org_id, 
    (SELECT machine_id FROM machine_slots WHERE id = NEW.slot_id),
    NEW.slot_id, 
    NEW.product_id, 
    NEW.new_qty,
    now(),
    now()
  )
  ON CONFLICT (slot_id) 
  DO UPDATE SET 
    current_qty = NEW.new_qty,
    last_restocked_at = now(),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate payment processor fees
CREATE OR REPLACE FUNCTION public.calculate_processor_fees(
  p_machine_id UUID,
  p_amount_cents INTEGER,
  p_transaction_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
  processor_name TEXT,
  percent_fee NUMERIC,
  fixed_fee_cents INTEGER,
  total_fee_cents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.name as processor_name,
    COALESCE(mpm.percent_fee, pp.default_percent_fee) as percent_fee,
    COALESCE(mpm.fixed_fee * 100, pp.default_fixed_fee * 100)::INTEGER as fixed_fee_cents,
    (
      p_amount_cents * COALESCE(mpm.percent_fee, pp.default_percent_fee) / 100.0 +
      COALESCE(mpm.fixed_fee * 100, pp.default_fixed_fee * 100)
    )::INTEGER as total_fee_cents
  FROM payment_processors pp
  LEFT JOIN machine_processor_mappings mpm ON mpm.processor_id = pp.id AND mpm.machine_id = p_machine_id
  WHERE pp.org_id = current_org();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to auto-create maintenance tickets based on machine health
CREATE OR REPLACE FUNCTION public.check_machine_health_and_create_tickets()
RETURNS VOID AS $$
DECLARE
  machine_record RECORD;
  ticket_id UUID;
BEGIN
  -- Check for machines that haven't had sales in 48+ hours
  FOR machine_record IN
    SELECT DISTINCT m.id as machine_id, m.name as machine_name
    FROM machines m
    LEFT JOIN sales s ON s.machine_id = m.id AND s.occurred_at >= now() - INTERVAL '48 hours'
    WHERE m.org_id = current_org()
      AND s.id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM tickets t 
        WHERE t.machine_id = m.id 
          AND t.status IN ('open', 'in_progress')
          AND t.category = 'silent_machine'
      )
  LOOP
    INSERT INTO tickets (
      org_id, machine_id, title, description, priority, category, status
    ) VALUES (
      current_org(),
      machine_record.machine_id,
      'Silent Machine Alert: ' || machine_record.machine_name,
      'Machine has not recorded any sales in the last 48 hours. Check power, network, and mechanical issues.',
      'high',
      'silent_machine',
      'open'
    );
  END LOOP;

  -- Check for low inventory and create restock tickets
  FOR machine_record IN
    SELECT DISTINCT m.id as machine_id, m.name as machine_name, COUNT(*) as low_slots
    FROM machines m
    JOIN inventory_levels il ON il.machine_id = m.id
    WHERE m.org_id = current_org()
      AND il.current_qty <= il.reorder_point
      AND NOT EXISTS (
        SELECT 1 FROM tickets t 
        WHERE t.machine_id = m.id 
          AND t.status IN ('open', 'in_progress')
          AND t.category = 'restock_needed'
      )
    GROUP BY m.id, m.name
    HAVING COUNT(*) >= 3
  LOOP
    INSERT INTO tickets (
      org_id, machine_id, title, description, priority, category, status
    ) VALUES (
      current_org(),
      machine_record.machine_id,
      'Restock Required: ' || machine_record.machine_name,
      format('%s slots are below reorder point and need restocking.', machine_record.low_slots),
      'medium',
      'restock_needed',
      'open'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for inventory automation
DROP TRIGGER IF EXISTS sales_update_inventory ON sales;
CREATE TRIGGER sales_update_inventory
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale();

DROP TRIGGER IF EXISTS restock_update_inventory ON restock_lines;  
CREATE TRIGGER restock_update_inventory
  AFTER INSERT OR UPDATE ON restock_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_restock();