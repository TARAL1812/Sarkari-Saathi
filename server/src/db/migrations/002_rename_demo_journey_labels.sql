UPDATE journeys
SET title = 'Hospital Visit Process'
WHERE id = 'demo-hospital' AND is_demo = 1 AND title = 'Hospital Visit Journey';

UPDATE journeys
SET title = 'College Admission Process'
WHERE id = 'demo-college' AND is_demo = 1 AND title = 'College Admission Journey';

UPDATE journeys
SET title = 'Driving Licence Process'
WHERE id = 'demo-driving' AND is_demo = 1 AND title = 'Driving Licence Journey';

UPDATE categories
SET description = 'Licence and transport authority services.'
WHERE id = 'Transport' AND is_builtin = 1
  AND description = 'Licence and transport authority journeys.';
