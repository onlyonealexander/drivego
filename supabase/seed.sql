-- Optional demo data for DriveGO.
-- Run AFTER schema.sql, and after you have at least one 'owner' user signed up
-- (grab their id from `select id, email, role from public.profiles;`).
-- Replace :owner_id below with that uuid before running.

insert into public.cars (owner_id, name, brand, type, year, price, city, description, available)
values
  (:'owner_id', 'Toyota Camry',   'Toyota',   'Sedan',  2022, 18000, 'Lagos', 'Clean, reliable sedan. Great for city driving.', true),
  (:'owner_id', 'Honda CR-V',     'Honda',    'SUV',    2021, 24000, 'Abuja', 'Spacious SUV, perfect for family trips.',        true),
  (:'owner_id', 'Mercedes C300',  'Mercedes', 'Luxury', 2023, 55000, 'Lagos', 'Premium comfort and style.',                     true),
  (:'owner_id', 'Toyota Hiace',   'Toyota',   'Van',    2020, 35000, 'Lagos', 'Ideal for group travel and logistics.',          true),
  (:'owner_id', 'Kia Sportage',   'Kia',      'SUV',    2022, 22000, 'PH',    'Fuel-efficient and comfortable.',                true),
  (:'owner_id', 'BMW 5 Series',   'BMW',      'Luxury', 2023, 65000, 'Abuja', 'Executive sedan with premium features.',         true),
  (:'owner_id', 'Honda Accord',   'Honda',    'Sedan',  2021, 20000, 'Lagos', 'Smooth ride, low mileage.',                      true),
  (:'owner_id', 'Toyota RAV4',    'Toyota',   'SUV',    2022, 28000, 'Lagos', 'Reliable and roomy.',                            true),
  (:'owner_id', 'Lexus ES350',    'Lexus',    'Luxury', 2023, 50000, 'Abuja', 'Quiet, refined, and comfortable.',               true),
  (:'owner_id', 'Ford Transit',   'Ford',     'Van',    2020, 30000, 'PH',    'Great for moving and group trips.',              true),
  (:'owner_id', 'Hyundai Elantra','Hyundai',  'Sedan',  2022, 16000, 'Abuja', 'Affordable and efficient.',                      true),
  (:'owner_id', 'Lexus RX350',    'Lexus',    'SUV',    2022, 45000, 'Lagos', 'Luxury SUV with plenty of room.',                true),
  (:'owner_id', 'Mercedes GLE',   'Mercedes', 'SUV',    2023, 80000, 'Lagos', 'Top-tier luxury SUV.',                           true),
  (:'owner_id', 'Kia Cerato',     'Kia',      'Sedan',  2021, 15000, 'PH',    'Budget-friendly daily driver.',                  true),
  (:'owner_id', 'Ford Explorer',  'Ford',     'SUV',    2021, 38000, 'Lagos', 'Powerful and spacious.',                         true);
