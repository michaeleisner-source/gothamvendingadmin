-- Add manufacturer column to products table
ALTER TABLE public.products 
ADD COLUMN manufacturer text;