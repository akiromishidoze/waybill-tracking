INSERT INTO users (email, name, password, role)
VALUES ('admin@waybilltrack.com', 'Admin', crypt('admin', gen_salt('bf')), 'ADMIN')
ON CONFLICT (email) DO UPDATE SET password = crypt('admin', gen_salt('bf'));
