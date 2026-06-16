-- Seed users (bcrypt hash for "password123")
INSERT INTO users (id, email, name, password, role, company)
VALUES
  (gen_random_uuid(), 'admin@waybill.com', 'Admin User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', 'Waybill Corp'),
  (gen_random_uuid(), 'shipper@acme.com', 'John Shipper', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SHIPPER', 'ACME Inc'),
  (gen_random_uuid(), 'courier@fastdeliver.com', 'Jane Courier', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'COURIER', 'Fast Deliver Co');

-- Seed waybills (IDs stored in variables via DO block)
DO $$
DECLARE
  shipper_id UUID;
  courier_id UUID;
  wb1_id UUID;
  wb2_id UUID;
  wb3_id UUID;
BEGIN
  SELECT id INTO shipper_id FROM users WHERE email = 'shipper@acme.com';
  SELECT id INTO courier_id FROM users WHERE email = 'courier@fastdeliver.com';

  INSERT INTO waybills (id, tracking_number, shipper_id, shipper_name, recipient_name,
    recipient_address, recipient_phone, origin, destination, weight, service_type, status,
    estimated_delivery, created_at, updated_at)
  VALUES
    (gen_random_uuid(), 'WBT-2024-00001', shipper_id, 'ACME Inc', 'Alice Johnson',
     '123 Main St, Manila', '+63 912 345 6789', 'Quezon City', 'Makati City',
     2.5, 'EXPRESS', 'DELIVERED',
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),

    (gen_random_uuid(), 'WBT-2024-00002', shipper_id, 'ACME Inc', 'Bob Smith',
     '456 Elm St, Cebu City', '+63 923 456 7890', 'Quezon City', 'Cebu City',
     5.0, 'STANDARD', 'IN_TRANSIT',
     NOW() + INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

    (gen_random_uuid(), 'WBT-2024-00003', shipper_id, 'ACME Inc', 'Carol Santos',
     '789 Oak Ave, Davao City', '+63 934 567 8901', 'Makati City', 'Davao City',
     10.0, 'STANDARD', 'PICKED_UP',
     NOW() + INTERVAL '4 days', NOW() - INTERVAL '1 day', NOW());

  -- Get waybill IDs for events
  SELECT id INTO wb1_id FROM waybills WHERE tracking_number = 'WBT-2024-00001';
  SELECT id INTO wb2_id FROM waybills WHERE tracking_number = 'WBT-2024-00002';
  SELECT id INTO wb3_id FROM waybills WHERE tracking_number = 'WBT-2024-00003';

  -- Events for WB-00001 (Delivered)
  INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp)
  VALUES
    (gen_random_uuid(), wb1_id, 'CREATED', 'Quezon City', NULL, NULL, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), wb1_id, 'PICKED_UP', 'Quezon City', courier_id, 'Jane Courier', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), wb1_id, 'AT_SORTING_CENTER', 'Manila Hub', NULL, NULL, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), wb1_id, 'OUT_FOR_DELIVERY', 'Makati City', courier_id, 'Jane Courier', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), wb1_id, 'DELIVERED', 'Makati City', courier_id, 'Jane Courier', NOW() - INTERVAL '2 days');

  -- Events for WB-00002 (In Transit)
  INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp)
  VALUES
    (gen_random_uuid(), wb2_id, 'CREATED', 'Quezon City', NULL, NULL, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), wb2_id, 'PICKED_UP', 'Quezon City', courier_id, 'Jane Courier', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), wb2_id, 'IN_TRANSIT', 'En Route to Cebu', NULL, NULL, NOW() - INTERVAL '1 day');

  -- Events for WB-00003 (Picked Up)
  INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp)
  VALUES
    (gen_random_uuid(), wb3_id, 'CREATED', 'Makati City', NULL, NULL, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), wb3_id, 'PICKED_UP', 'Makati City', courier_id, 'Jane Courier', NOW());
END $$;