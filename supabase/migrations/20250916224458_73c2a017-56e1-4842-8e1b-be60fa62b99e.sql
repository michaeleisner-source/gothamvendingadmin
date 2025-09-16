-- Check and fix any remaining RLS recursion on purchase order related tables

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('purchase_orders', 'suppliers', 'purchase_order_items')
ORDER BY tablename, policyname;