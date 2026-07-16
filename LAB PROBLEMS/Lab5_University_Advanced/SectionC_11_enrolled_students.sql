SELECT name FROM student
WHERE ID IN (SELECT ID FROM takes WHERE course_id = 'CS-101');
