-- Kirana POS Database Schema
-- Run this script to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for staff management, not auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  expiry_date DATE,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  brand TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on barcode for fast lookup (allow duplicates but warn)
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  cgst_amount DECIMAL(10,2) DEFAULT 0,
  sgst_amount DECIMAL(10,2) DEFAULT 0,
  total_tax DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'card')),
  amount_received DECIMAL(10,2),
  change_returned DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'returned', 'cancelled')),
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  notes TEXT
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  gst_rate DECIMAL(5,2) NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  purchase_price DECIMAL(10,2),
  supplier_name TEXT,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);

-- Held bills table
CREATE TABLE IF NOT EXISTS held_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_name TEXT,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  held_at TIMESTAMPTZ DEFAULT NOW(),
  held_by UUID REFERENCES users(id)
);

-- Shop settings table
CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_name TEXT NOT NULL DEFAULT 'My Kirana Store',
  address_line1 TEXT DEFAULT '',
  address_line2 TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  pincode TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  receipt_header TEXT DEFAULT 'Welcome!',
  receipt_footer TEXT DEFAULT 'Thank you! Visit again!',
  invoice_prefix TEXT DEFAULT 'INV',
  starting_invoice_number INTEGER DEFAULT 1,
  tax_inclusive BOOLEAN DEFAULT TRUE,
  enable_discount BOOLEAN DEFAULT TRUE,
  max_discount_percent INTEGER DEFAULT 50,
  show_gst_breakdown BOOLEAN DEFAULT TRUE,
  low_stock_threshold INTEGER DEFAULT 10,
  expiry_alert_days INTEGER DEFAULT 7,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice counter table
CREATE TABLE IF NOT EXISTS invoice_counter (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_value INTEGER NOT NULL DEFAULT 0
);

-- Insert default invoice counter
INSERT INTO invoice_counter (id, current_value) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- Insert default shop settings
INSERT INTO shop_settings (id, shop_name) 
VALUES (uuid_generate_v4(), 'My Kirana Store') 
ON CONFLICT DO NOTHING;

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for shop_settings table
DROP TRIGGER IF EXISTS update_shop_settings_updated_at ON shop_settings;
CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS INTEGER AS $$
DECLARE
  next_val INTEGER;
BEGIN
  UPDATE invoice_counter 
  SET current_value = current_value + 1 
  WHERE id = 1
  RETURNING current_value INTO next_val;
  RETURN next_val;
END;
$$ LANGUAGE plpgsql;
