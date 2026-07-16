SELECT name FROM instructor
WHERE salary > (SELECT salary FROM instructor WHERE name = 'Einstein');
