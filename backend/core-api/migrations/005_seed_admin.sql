INSERT INTO users (email, name, password, role)
VALUES ('admin@waybilltrack.com', 'Admin', '$2b$12$SjP0ktEZY/AwBlhHvHha0.8dt2isjH0PEhpssUOX2GOTNDrOypwcC', 'ADMIN')
ON CONFLICT (email) DO UPDATE SET password = '$2b$12$SjP0ktEZY/AwBlhHvHha0.8dt2isjH0PEhpssUOX2GOTNDrOypwcC';
