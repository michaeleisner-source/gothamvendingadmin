insert into location_types (name) values
('Apartment Building'),
('Office'),
('School'),
('Gym'),
('Studio'),
('Hospital'),
('Hotel')
on conflict (name) do nothing;