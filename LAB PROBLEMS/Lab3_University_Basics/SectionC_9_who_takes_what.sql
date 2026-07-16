SELECT student.name, takes.course_id
FROM student, takes
WHERE student.ID = takes.ID;
