-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN image_url TEXT,
ADD COLUMN description TEXT,
ADD COLUMN size_oz NUMERIC,
ADD COLUMN size_ml NUMERIC;