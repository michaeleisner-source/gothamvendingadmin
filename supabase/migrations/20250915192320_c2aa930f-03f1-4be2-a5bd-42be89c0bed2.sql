-- Create performance indexes for common query patterns

-- Index for sales queries by machine and time range (used in ROI calculations and reports)
CREATE INDEX IF NOT EXISTS sales_machine_time ON public.sales(machine_id, occurred_at);

-- Index for finding machines by location 
CREATE INDEX IF NOT EXISTS machines_location ON public.machines(location_id);