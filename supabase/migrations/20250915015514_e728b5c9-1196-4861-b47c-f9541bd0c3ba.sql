-- Create machine-specific product pricing table
CREATE TABLE public.machine_product_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  product_id UUID NOT NULL,
  price_cents INTEGER NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(machine_id, product_id, effective_from)
);

-- Enable RLS
ALTER TABLE public.machine_product_pricing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "machine_product_pricing_all" 
ON public.machine_product_pricing 
FOR ALL 
USING (is_org_member(org_id))
WITH CHECK (org_id = current_org());

-- Add trigger for updated_at
CREATE TRIGGER update_machine_product_pricing_updated_at
BEFORE UPDATE ON public.machine_product_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

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