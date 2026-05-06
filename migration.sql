-- Add new columns for detailed menu item information
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS cooking_method TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutritional_info JSONB;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS dietary_tags TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories INTEGER;