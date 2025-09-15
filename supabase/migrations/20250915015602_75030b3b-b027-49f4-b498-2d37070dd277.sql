-- Create function to get effective price for a machine/product combination
CREATE OR REPLACE FUNCTION public.get_machine_product_price(p_machine_id UUID, p_product_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_price INTEGER;
  v_org UUID := current_org();
BEGIN
  -- First try to get machine-specific pricing
  SELECT price_cents INTO v_price
  FROM machine_product_pricing mpp
  WHERE mpp.org_id = v_org
    AND mpp.machine_id = p_machine_id
    AND mpp.product_id = p_product_id
    AND mpp.effective_from <= p_date
    AND (mpp.effective_to IS NULL OR mpp.effective_to >= p_date)
  ORDER BY mpp.effective_from DESC
  LIMIT 1;

  -- If no machine-specific price, fall back to product default price
  IF v_price IS NULL THEN
    SELECT (price * 100)::INTEGER INTO v_price
    FROM products p
    WHERE p.id = p_product_id AND p.org_id = v_org;
  END IF;

  RETURN COALESCE(v_price, 0);
END;
$function$;