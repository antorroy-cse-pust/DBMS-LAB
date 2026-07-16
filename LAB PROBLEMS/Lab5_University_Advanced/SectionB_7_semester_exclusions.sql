SELECT course_id FROM section WHERE semester = 'Fall' AND year = 2024
EXCEPT
SELECT course_id FROM section WHERE semester = 'Spring' AND year = 2025;
