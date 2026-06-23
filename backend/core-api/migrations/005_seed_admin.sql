INSERT INTO users (email, name, password, role)
SELECT 'admin@waybilltrack.com', 'Admin', crypt('admin', gen_salt('bf')), 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@waybilltrack.com');
