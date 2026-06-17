INSERT INTO users (id, email, name, password, role, company)
VALUES
  (gen_random_uuid(), 'admin@waybill.com', 'Admin User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', 'Waybill Corp'),
  (gen_random_uuid(), 'shipper@acme.com', 'John Shipper', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SHIPPER', 'ACME Inc'),
  (gen_random_uuid(), 'courier@fastdeliver.com', 'Jane Courier', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'COURIER', 'Fast Deliver Co'),
  (gen_random_uuid(), 'ops@waybill.com', 'Ops Manager', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'OPS', 'Waybill Corp');

DO $$
DECLARE
  shipper_id UUID;
  courier_id UUID;
  ops_id UUID;
  wb1_id UUID;
  wb2_id UUID;
  wb3_id UUID;
  wb4_id UUID;
  wb5_id UUID;
BEGIN
  SELECT id INTO shipper_id FROM users WHERE email = 'shipper@acme.com';
  SELECT id INTO courier_id FROM users WHERE email = 'courier@fastdeliver.com';
  SELECT id INTO ops_id FROM users WHERE email = 'ops@waybill.com';

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
     NOW() + INTERVAL '4 days', NOW() - INTERVAL '1 day', NOW()),

    (gen_random_uuid(), 'WBT-2024-00004', shipper_id, 'ACME Inc', 'David Reyes',
     '321 Pine Rd, BGC, Taguig', '+63 945 678 9012', 'Quezon City', 'Taguig City',
     1.2, 'EXPRESS', 'FAILED_DELIVERY',
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours'),

    (gen_random_uuid(), 'WBT-2024-00005', shipper_id, 'ACME Inc', 'Elena Cruz',
     '654 Acacia St, Iloilo City', '+63 956 789 0123', 'Manila', 'Iloilo City',
     8.0, 'STANDARD', 'OUT_FOR_DELIVERY',
     NOW() + INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 hours');

  SELECT id INTO wb1_id FROM waybills WHERE tracking_number = 'WBT-2024-00001';
  SELECT id INTO wb2_id FROM waybills WHERE tracking_number = 'WBT-2024-00002';
  SELECT id INTO wb3_id FROM waybills WHERE tracking_number = 'WBT-2024-00003';
  SELECT id INTO wb4_id FROM waybills WHERE tracking_number = 'WBT-2024-00004';
  SELECT id INTO wb5_id FROM waybills WHERE tracking_number = 'WBT-2024-00005';

  -- WB-00001: Delivered (5 events over 5 days)
  INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp, event_type, remark)
  VALUES
    (gen_random_uuid(), wb1_id, 'CREATED', 'Quezon City', NULL, NULL, NOW() - INTERVAL '5 days', 'MILESTONE', NULL),
    (gen_random_uuid(), wb1_id, 'PICKED_UP', 'Quezon City', courier_id, 'Jane Courier', NOW() - INTERVAL '4 days', 'MILESTONE', 'Package collected from shipper'),
    (gen_random_uuid(), wb1_id, 'AT_SORTING_CENTER', 'Manila Hub', NULL, NULL, NOW() - INTERVAL '3 days', 'SCAN', 'Arrived at Manila sorting facility'),
    (gen_random_uuid(), wb1_id, 'OUT_FOR_DELIVERY', 'Makati City', courier_id, 'Jane Courier', NOW() - INTERVAL '2 days', 'MILESTONE', 'With delivery courier'),
    (gen_random_uuid(), wb1_id, 'DELIVERED', 'Makati City', courier_id, 'Jane Courier', NOW() - INTERVAL '2 days', 'MILESTONE', 'Left at reception desk');

  -- WB-00002: In Transit (3 events)
  INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp, event_type, remark)
  VALUES
    (gen_random_uuid(), wb2_id, 'CREATED', 'Quezon City', NULL, NULL, NOW() - INTERVAL '3 days', 'MILESTONE', NULL),
    (gen_random_uuid(), wb2_id, 'PICKED_UP', 'Quezon City', courier_id, 'Jane Courier', NOW() - INTERVAL '2 days', 'MILESTONE', 'Pickup completed'),
    (gen_random_uuid(), wb2_id, 'IN_TRANSIT', 'En Route to Cebu', NULL, NULL, NOW() - INTERVAL '1 day', 'MILESTONE', 'Departed Manila hub');

  -- WB-00003: Picked Up (2 events)
  INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp, event_type, remark)
  VALUES
    (gen_random_uuid(), wb3_id, 'CREATED', 'Makati City', NULL, NULL, NOW() - INTERVAL '1 day', 'MILESTONE', NULL),
    (gen_random_uuid(), wb3_id, 'PICKED_UP', 'Makati City', courier_id, 'Jane Courier', NOW(), 'MILESTONE', 'Package picked up');

  -- WB-00004: Failed Delivery with exception (3 events)
  INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp, event_type, exception_code, exception_detail, remark)
  VALUES
    (gen_random_uuid(), wb4_id, 'CREATED', 'Quezon City', NULL, NULL, NOW() - INTERVAL '2 days', 'MILESTONE', NULL, NULL, NULL),
    (gen_random_uuid(), wb4_id, 'PICKED_UP', 'Quezon City', courier_id, 'Jane Courier', NOW() - INTERVAL '1 day', 'MILESTONE', NULL, NULL, 'Express pickup'),
    (gen_random_uuid(), wb4_id, 'FAILED_DELIVERY', 'Taguig City', courier_id, 'Jane Courier', NOW() - INTERVAL '6 hours', 'EXCEPTION', 'CUSTOMER_NOT_AVAILABLE', 'Recipient not home, no answer at door', 'Will attempt redelivery tomorrow');

  -- WB-00005: Out for Delivery (4 events)
  INSERT INTO scan_events (id, waybill_id, status, location, courier_id, courier_name, timestamp, event_type, remark)
  VALUES
    (gen_random_uuid(), wb5_id, 'CREATED', 'Manila', NULL, NULL, NOW() - INTERVAL '2 days', 'MILESTONE', NULL),
    (gen_random_uuid(), wb5_id, 'PICKED_UP', 'Manila', courier_id, 'Jane Courier', NOW() - INTERVAL '1 day', 'MILESTONE', 'Pickup from ACME warehouse'),
    (gen_random_uuid(), wb5_id, 'AT_SORTING_CENTER', 'Manila Hub', NULL, NULL, NOW() - INTERVAL '12 hours', 'SCAN', 'Processed at Manila sorting center'),
    (gen_random_uuid(), wb5_id, 'OUT_FOR_DELIVERY', 'Iloilo City', courier_id, 'Jane Courier', NOW() - INTERVAL '2 hours', 'MILESTONE', 'Out for final delivery');
END $$;
