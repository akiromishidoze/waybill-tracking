INSERT INTO users (email, name, password, role)
VALUES ('admin@waybilltrack.com', 'Admin', crypt('teccadmin00', gen_salt('bf')), 'ADMIN')
ON CONFLICT (email) DO UPDATE SET password = crypt('teccadmin00', gen_salt('bf'));
