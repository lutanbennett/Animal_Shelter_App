-- consumer: none
--
-- Production data: enclosure capacities set to who actually lives there,
-- and Thai names for every zone and enclosure.
--
-- Capacities came across from AppSheet's "Maximum Residents", which were
-- guesses. The shelter's position is that every occupied enclosure, and
-- the facility as a whole, is at capacity, so an occupied enclosure's
-- capacity becomes its current resident count (active placements, as
-- resident_current_state reads them). Empty enclosures keep the capacity
-- they have: a count of 0 says nothing about how many they would hold.
-- The Lifecycle pseudo-enclosures have no capacity and are left alone.
-- Only rows that differ are touched; a later edit on Admin → Enclosures
-- is the way to change one, and this file never re-runs once recorded.
--
-- Thai names follow 0058: display only, `name` stays the key, and a
-- name_th that is already set is never overwritten. Names translate the
-- meaning ("Left Zone 3" → "โซนซ้าย 3"), using the app's own words
-- (โซน for zone, กรง for enclosure) and the existing
-- "Main Yard (Free Roaming)" → "ลานหลัก (พื้นที่เปิดโล่ง)" for Free Roaming.
-- A name not listed here (an enclosure added since) is simply skipped.

update enclosures e
   set capacity = c.residents
  from (
    select s.current_enclosure_id as enclosure_id, count(*)::int as residents
      from resident_current_state s
     where s.current_enclosure_id is not null
     group by s.current_enclosure_id
  ) c,
  zones z
 where c.enclosure_id = e.id
   and z.id = e.zone_id
   and z.name <> 'Lifecycle'
   and e.capacity is distinct from c.residents;

update zones z
   set name_th = v.name_th
  from (values
    ('Cat Zone', 'โซนแมว'),
    ('Front Zone - White', 'โซนหน้า - สีขาว'),
    ('House Zone - Brown', 'โซนบ้าน - สีน้ำตาล'),
    ('Left Zone', 'โซนซ้าย'),
    ('Main Zone - Blue', 'โซนหลัก - สีฟ้า'),
    ('Middle Zone', 'โซนกลาง'),
    ('Offsite', 'นอกสถานที่'),
    ('Orchard', 'สวนผลไม้'),
    ('Right Zone', 'โซนขวา'),
    ('Village', 'หมู่บ้าน')
  ) as v(name, name_th)
 where z.name = v.name and z.name_th is null;

update enclosures e
   set name_th = v.name_th
  from (values
    ('Cat Zone', 'Cat Enclosure', 'กรงแมว'),
    ('Front Zone - White', 'Front Zone 1', 'โซนหน้า 1'),
    ('Front Zone - White', 'Front Zone 2', 'โซนหน้า 2'),
    ('Front Zone - White', 'Front Zone 3', 'โซนหน้า 3'),
    ('Front Zone - White', 'Front Zone 4', 'โซนหน้า 4'),
    ('Front Zone - White', 'Front Zone 5', 'โซนหน้า 5'),
    ('Front Zone - White', 'Front Zone 6', 'โซนหน้า 6'),
    ('Front Zone - White', 'Front Zone 7', 'โซนหน้า 7'),
    ('Front Zone - White', 'Front Zone 8', 'โซนหน้า 8'),
    ('Front Zone - White', 'Front Zone 9', 'โซนหน้า 9'),
    ('Front Zone - White', 'Front Zone 10', 'โซนหน้า 10'),
    ('Front Zone - White', 'Front Zone 11', 'โซนหน้า 11'),
    ('Front Zone - White', 'Front Zone 12', 'โซนหน้า 12'),
    ('House Zone - Brown', 'Brown Section 1 - Free Roaming', 'ส่วนสีน้ำตาล 1 - พื้นที่เปิดโล่ง'),
    ('House Zone - Brown', 'Brown Enclosure 2', 'กรงสีน้ำตาล 2'),
    ('House Zone - Brown', 'Brown Enclosure 3', 'กรงสีน้ำตาล 3'),
    ('House Zone - Brown', 'Brown Enclosure 4', 'กรงสีน้ำตาล 4'),
    ('House Zone - Brown', 'Brown Enclosure 5', 'กรงสีน้ำตาล 5'),
    ('Left Zone', 'Left Zone 1', 'โซนซ้าย 1'),
    ('Left Zone', 'Left Zone 2', 'โซนซ้าย 2'),
    ('Left Zone', 'Left Zone 3', 'โซนซ้าย 3'),
    ('Left Zone', 'Left Zone 4', 'โซนซ้าย 4'),
    ('Left Zone', 'Left Zone 5', 'โซนซ้าย 5'),
    ('Left Zone', 'Left Zone 6', 'โซนซ้าย 6'),
    ('Left Zone', 'Left Zone 7', 'โซนซ้าย 7'),
    ('Left Zone', 'Left Zone 8', 'โซนซ้าย 8'),
    ('Left Zone', 'Left Zone 9', 'โซนซ้าย 9'),
    ('Left Zone', 'Left Zone 10', 'โซนซ้าย 10'),
    ('Left Zone', 'Left Zone 11', 'โซนซ้าย 11'),
    ('Left Zone', 'Left Zone 12', 'โซนซ้าย 12'),
    ('Left Zone', 'Left Zone 13', 'โซนซ้าย 13'),
    ('Main Zone - Blue', 'Blue Enclosure 1 (Main Room)', 'กรงสีฟ้า 1 (ห้องหลัก)'),
    ('Main Zone - Blue', 'Blue Enclosure 2 (Main Room Garden)', 'กรงสีฟ้า 2 (สวนห้องหลัก)'),
    ('Main Zone - Blue', 'Blue Enclosure 3 (Hallway Small Dogs Only)', 'กรงสีฟ้า 3 (ทางเดิน เฉพาะสุนัขเล็ก)'),
    ('Main Zone - Blue', 'Blue Enclosure 4 (Hallway)', 'กรงสีฟ้า 4 (ทางเดิน)'),
    ('Main Zone - Blue', 'Blue Enclosure 5 (Hallway)', 'กรงสีฟ้า 5 (ทางเดิน)'),
    ('Main Zone - Blue', 'Blue Enclosure 6 (Hallway)', 'กรงสีฟ้า 6 (ทางเดิน)'),
    ('Main Zone - Blue', 'Blue Enclosure 7 (Hallway)', 'กรงสีฟ้า 7 (ทางเดิน)'),
    ('Main Zone - Blue', 'Blue Enclosure 8', 'กรงสีฟ้า 8'),
    ('Main Zone - Blue', 'Blue Enclosure 9', 'กรงสีฟ้า 9'),
    ('Main Zone - Blue', 'Blue Enclosure 10', 'กรงสีฟ้า 10'),
    ('Main Zone - Blue', 'Blue Enclosure 11', 'กรงสีฟ้า 11'),
    ('Main Zone - Blue', 'Blue Enclosure 12', 'กรงสีฟ้า 12'),
    ('Main Zone - Blue', 'Blue Enclosure 13', 'กรงสีฟ้า 13'),
    ('Main Zone - Blue', 'Main Yard (Free Roaming)', 'ลานหลัก (พื้นที่เปิดโล่ง)'),
    ('Middle Zone', 'Main Yard', 'ลานหลัก'),
    ('Middle Zone', 'Middle Zone 1', 'โซนกลาง 1'),
    ('Middle Zone', 'Middle Zone 2', 'โซนกลาง 2'),
    ('Middle Zone', 'Middle Zone 3', 'โซนกลาง 3'),
    ('Middle Zone', 'Middle Zone 4', 'โซนกลาง 4'),
    ('Middle Zone', 'Middle Zone 5', 'โซนกลาง 5'),
    ('Offsite', 'Temple', 'วัด'),
    ('Orchard', 'Orchard 1', 'สวนผลไม้ 1'),
    ('Orchard', 'Orchard 2', 'สวนผลไม้ 2'),
    ('Right Zone', 'Right Zone 1', 'โซนขวา 1'),
    ('Right Zone', 'Right Zone 2', 'โซนขวา 2'),
    ('Right Zone', 'Right Zone 3', 'โซนขวา 3'),
    ('Right Zone', 'Right Zone 4', 'โซนขวา 4'),
    ('Right Zone', 'Right Zone 5', 'โซนขวา 5'),
    ('Right Zone', 'Right Zone 6', 'โซนขวา 6'),
    ('Right Zone', 'Right Zone 7', 'โซนขวา 7'),
    ('Right Zone', 'Right Zone 8', 'โซนขวา 8'),
    ('Right Zone', 'Right Zone 9', 'โซนขวา 9'),
    ('Village', 'Shops', 'ร้านค้า'),
    ('Village', 'Soi 1', 'ซอย 1')
  ) as v(zone, name, name_th)
  join zones z on z.name = v.zone
 where e.zone_id = z.id and e.name = v.name and e.name_th is null;
