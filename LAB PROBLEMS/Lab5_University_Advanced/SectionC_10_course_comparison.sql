SELECT name FROM instructor
WHERE salary > SOME (SELECT salary FROM instructor WHERE dept_name = 'Biology');
