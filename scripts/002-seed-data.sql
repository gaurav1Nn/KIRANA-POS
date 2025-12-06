-- Seed data for Kirana POS

-- Insert default users (password is hashed 'admin123' and 'staff123')
-- Note: In production, use proper password hashing
INSERT INTO users (username, full_name, role, status, password_hash) VALUES
('owner', 'Shop Owner', 'owner', 'active', 'admin123'),
('staff', 'Staff Member', 'staff', 'active', 'staff123')
ON CONFLICT (username) DO NOTHING;

-- Insert sample products
INSERT INTO products (barcode, name, category, unit, purchase_price, selling_price, current_stock, min_stock_level, gst_rate, brand, status) VALUES
('8901234567890', 'Tata Salt 1kg', 'Groceries', 'Packet', 18.00, 22.00, 50, 10, 5.00, 'Tata', 'active'),
('8901234567891', 'Parle-G Biscuit', 'Snacks', 'Packet', 8.00, 10.00, 100, 20, 18.00, 'Parle', 'active'),
('8901234567892', 'Amul Butter 100g', 'Dairy', 'Piece', 48.00, 56.00, 25, 10, 12.00, 'Amul', 'active'),
('8901234567893', 'Maggi Noodles', 'Snacks', 'Packet', 11.00, 14.00, 80, 15, 18.00, 'Nestle', 'active'),
('8901234567894', 'Coca Cola 750ml', 'Beverages', 'Piece', 35.00, 40.00, 40, 10, 28.00, 'Coca Cola', 'active'),
('8901234567895', 'Surf Excel 1kg', 'Household', 'Packet', 180.00, 210.00, 15, 5, 18.00, 'Surf', 'active'),
('8901234567896', 'Dettol Soap', 'Personal Care', 'Piece', 40.00, 48.00, 30, 10, 18.00, 'Dettol', 'active'),
('8901234567897', 'Aashirvaad Atta 5kg', 'Groceries', 'Packet', 240.00, 280.00, 8, 10, 5.00, 'Aashirvaad', 'active'),
('8901234567898', 'Fortune Oil 1L', 'Groceries', 'Piece', 140.00, 165.00, 20, 8, 5.00, 'Fortune', 'active'),
('8901234567899', 'Britannia Bread', 'Dairy', 'Piece', 35.00, 42.00, 5, 10, 5.00, 'Britannia', 'active')
ON CONFLICT DO NOTHING;

-- Update shop settings
UPDATE shop_settings SET
  shop_name = 'My Kirana Store',
  address_line1 = '123 Main Street',
  address_line2 = 'Near Bus Stand',
  city = 'Mumbai',
  state = 'Maharashtra',
  pincode = '400001',
  phone = '9876543210'
WHERE id = (SELECT id FROM shop_settings LIMIT 1);
