SELECT DISTINCT instructor.name
FROM instructor, teaches, section
WHERE instructor.ID = teaches.ID
  AND teaches.course_id = section.course_id
  AND teaches.sec_id = section.sec_id
  AND teaches.semester = section.semester
  AND teaches.year = section.year
  AND section.building = 'Taylor';
