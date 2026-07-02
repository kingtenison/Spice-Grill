-- Delivery Tracking System Schema
-- This schema enables real-time order tracking for customers, admins, and physical dispatchers

-- Delivery Status Enum
DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM (
    'pending',           -- Order placed, awaiting assignment
    'preparing',         -- Kitchen preparing
    'ready_for_pickup',  -- Ready for dispatcher
    'assigned',          -- Assigned to dispatcher
    'picked_up',         -- Dispatcher picked up order
    'on_the_way',        -- Dispatcher en route to customer
    'arrived',           -- Dispatcher at customer location
    'delivered',         -- Order delivered successfully
    'cancelled',         -- Order cancelled
    'delayed'            -- Delivery delayed
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Dispatcher Status Enum
DO $$ BEGIN
  CREATE TYPE dispatcher_status AS ENUM (
    'available',    -- Ready for assignments
    'busy',         -- Currently on delivery
    'offline',      -- Not working
    'on_break'      -- On break
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Dispatcher Application Status Enum
DO $$ BEGIN
  CREATE TYPE dispatcher_application_status AS ENUM (
    'pending',      -- Application submitted, awaiting review
    'approved',     -- Application approved by admin
    'rejected'      -- Application rejected by admin
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Dispatchers Table (Physical delivery personnel)
DO $$ BEGIN
  CREATE TABLE public.dispatchers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE, -- Link to user account
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    email text,
    avatar_url text,
    is_active boolean DEFAULT true,
    current_location jsonb, -- {lat, lng, address}
    status dispatcher_status DEFAULT 'available',
    application_status dispatcher_application_status DEFAULT 'pending', -- Approval status
    application_notes text, -- Admin notes on approval/rejection
    vehicle_info jsonb, -- {type, make, model, year, license_plate}
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  );
EXCEPTION
  WHEN duplicate_table THEN
    -- Table exists, add missing columns if needed
    BEGIN
      ALTER TABLE public.dispatchers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;
      ALTER TABLE public.dispatchers ADD COLUMN IF NOT EXISTS application_status dispatcher_application_status DEFAULT 'pending';
      ALTER TABLE public.dispatchers ADD COLUMN IF NOT EXISTS application_notes text;
      ALTER TABLE public.dispatchers ADD COLUMN IF NOT EXISTS vehicle_info jsonb;
    END;
END $$;

-- Create unique constraint to ensure each order has only one delivery assignment (not null)
ALTER TABLE public.delivery_assignments 
ADD CONSTRAINT uc_order_single_assignment UNIQUE (order_id);

-- Enable Realtime for live tracking
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatchers;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
