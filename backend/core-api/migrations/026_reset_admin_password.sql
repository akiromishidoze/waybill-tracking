UPDATE users
SET password = crypt('teccadmin00', gen_salt('bf'))
WHERE email = 'admin@waybilltrack.com';
