-- Migration to add missing fields to orders table
-- This adds the fields that the checkout process expects

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subtotal numeric,
ADD COLUMN IF NOT EXISTS tax_amount numeric,
ADD COLUMN IF NOT EXISTS shipping_cost numeric,
ADD COLUMN IF NOT EXISTS discount_amount numeric,
ADD COLUMN IF NOT EXISTS shipping_address jsonb,
ADD COLUMN IF NOT EXISTS billing_address jsonb,
ADD COLUMN IF NOT EXISTS special_instructions text,
ADD COLUMN IF NOT EXISTS coupon_code text,
ADD COLUMN IF NOT EXISTS shipping_method text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS guest_checkout boolean DEFAULT false;

-- Update existing orders to set guest_checkout based on whether user_id is null
UPDATE public.orders
SET guest_checkout = (user_id IS NULL)
WHERE guest_checkout IS NULL;